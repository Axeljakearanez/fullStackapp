//  1. Storage Key 
const STORAGE_KEY = 'ipt_demo_v1';

//  2. Global State 
let currentUser = null;
let unverifiedEmail = null;

window.db = {
  accounts: [],
  employees: [],
  departments: [],
  requests: []
};

//  3. saveToStorage() 
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

//  4. loadFromStorage() 
function loadFromStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    seedDefaults();
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    window.db.accounts    = parsed.accounts    || [];
    window.db.employees   = parsed.employees   || [];
    window.db.departments = parsed.departments || [];
    window.db.requests    = parsed.requests    || [];

    // Always ensure admin account is up to date
    const adminIdx = window.db.accounts.findIndex(a => a.email === 'admin@example.com');
    if (adminIdx === -1) {
      window.db.accounts.push({ firstName: 'Admin', lastName: 'User', email: 'admin@example.com', password: 'Password123!', role: 'admin', verified: true, blocked: false });
    } else {
      window.db.accounts[adminIdx].password = 'Password123!';
      window.db.accounts[adminIdx].role = 'admin';
      window.db.accounts[adminIdx].verified = true;
      window.db.accounts[adminIdx].blocked = false;
    }

    // Restore unverifiedEmail if any
    unverifiedEmail = localStorage.getItem('unverified_email') || null;

    saveToStorage();
  } catch (e) {
    console.warn('Storage corrupt, re-seeding:', e);
    seedDefaults();
  }
}

function seedDefaults() {
  window.db.accounts = [
    { firstName: 'Admin', lastName: 'User', email: 'admin@example.com', password: 'Password123!', role: 'admin', verified: true, blocked: false }
  ];
  window.db.departments = [
    { name: 'Engineering', description: 'Software team' },
    { name: 'HR', description: 'Human Resources' }
  ];
  window.db.employees = [];
  window.db.requests  = [];
  saveToStorage();
}

// Init
loadFromStorage();

// 5. Navigation
function navigateTo(hash) {
  window.location.hash = hash;
}

//  5.5 Auth State 
function setAuthState(isAuth, user) {
  currentUser = user;
  if (isAuth) {
    document.body.classList.add('authenticated');
    document.body.classList.remove('not-authenticated');
    if (user.role === 'admin') document.body.classList.add('is-admin');
  } else {
    document.body.classList.remove('authenticated', 'is-admin');
    document.body.classList.add('not-authenticated');
  }
}

//  6. Navbar 
function updateNavbar() {
  const navArea = document.getElementById('navArea');
  if (!navArea) return;

  if (!currentUser) {
    navArea.innerHTML = `
      <a class="nav-link d-inline text-light me-3" href="#/login">Login</a>
      <a class="nav-link d-inline text-light" href="#/register">Register</a>
    `;
    return;
  }

  if (currentUser.role === 'admin') {
    navArea.innerHTML = `
      <div class="dropdown">
        <a class="nav-link text-light dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
          Admin ▾
        </a>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><a class="dropdown-item" href="#/profile">Profile</a></li>
          <li><a class="dropdown-item" href="#/employees">Employees</a></li>
          <li><a class="dropdown-item" href="#/accounts">Accounts</a></li>
          <li><a class="dropdown-item" href="#/departments">Departments</a></li>
          <li><a class="dropdown-item" href="#/requests">My Requests</a></li>
          <li><hr class="dropdown-divider"/></li>
          <li><a class="dropdown-item text-danger" href="#" id="logoutBtn">Logout</a></li>
        </ul>
      </div>
    `;
  } else {
    navArea.innerHTML = `
      <div class="dropdown">
        <a class="nav-link text-light dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
          ${currentUser.firstName} ▾
        </a>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><a class="dropdown-item" href="#/profile">Profile</a></li>
          <li><a class="dropdown-item" href="#/requests">My Requests</a></li>
          <li><hr class="dropdown-divider"/></li>
          <li><a class="dropdown-item text-danger" href="#" id="logoutBtn">Logout</a></li>
        </ul>
      </div>
    `;
  }

  document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('auth_token');
    setAuthState(false, null);
    updateNavbar();
    navigateTo('#/');
  });
}

//  7. Router 
function handleRouting() {
  const hash = window.location.hash || '#/';

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  const protectedPages = ['#/profile', '#/requests', '#/employees', '#/accounts', '#/departments'];
  const adminPages     = ['#/employees', '#/accounts', '#/departments'];

  if (protectedPages.includes(hash) && !currentUser) {
    navigateTo('#/login');
    return;
  }
  if (adminPages.includes(hash) && currentUser && currentUser.role !== 'admin') {
    navigateTo('#/');
    return;
  }

  const map = {
    '#/':            'page-home',
    '#/login':       'page-login',
    '#/register':    'page-register',
    '#/verify-email':'page-verify',
    '#/profile':     'page-profile',
    '#/employees':   'page-employees',
    '#/accounts':    'page-accounts',
    '#/departments': 'page-departments',
    '#/requests':    'page-requests'
  };

  const pageId = map[hash] || 'page-home';
  const pageEl = document.getElementById(pageId);
  if (pageEl) pageEl.classList.add('active');

  if (pageId === 'page-verify')      renderVerify();
  if (pageId === 'page-profile')     renderProfile();
  if (pageId === 'page-employees')   renderEmployees();
  if (pageId === 'page-accounts')    renderAccounts();
  if (pageId === 'page-departments') renderDepartments();
  if (pageId === 'page-requests')    renderRequests();
}

//  8. Render: Verify 
function renderVerify() {
  const msg = document.getElementById('verifyMessage');
  if (!unverifiedEmail) {
    navigateTo('#/register');
    return;
  }
  if (msg) msg.textContent = unverifiedEmail;
}

// 9. Render: Profile 
function renderProfile() {
  if (!currentUser) return;
  document.getElementById('profileName').textContent  = `${currentUser.firstName} ${currentUser.lastName}`;
  document.getElementById('profileEmail').textContent = currentUser.email;
  document.getElementById('profileRole').textContent  = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
}

// 10. Render: Employees 
function renderEmployees() {
  const tbody = document.getElementById('employeeTableBody');
  if (!tbody) return;
  if (window.db.employees.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No employees.</td></tr>';
    return;
  }
  tbody.innerHTML = window.db.employees.map((emp, i) => `
    <tr>
      <td>${emp.id}</td>
      <td>${emp.email}</td>
      <td>${emp.position}</td>
      <td>${emp.dept}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1" onclick="editEmployee(${i})">Edit</button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteEmployee(${i})">Delete</button>
      </td>
    </tr>
  `).join('');
}

function showEmployeeForm(i) {
  const deptSelect = document.getElementById('empDept');
  deptSelect.innerHTML = '';
  if (window.db.departments.length === 0) {
    deptSelect.innerHTML = '<option value="">-- No departments available --</option>';
  } else {
    window.db.departments.forEach(dept => {
      const opt = document.createElement('option');
      opt.value = dept.name;
      opt.textContent = dept.name;
      deptSelect.appendChild(opt);
    });
  }

  document.getElementById('employeeForm').style.display = 'block';
  document.getElementById('empEditIndex').value = i !== undefined ? i : '';
  if (i !== undefined) {
    const emp = window.db.employees[i];
    document.getElementById('empId').value       = emp.id;
    document.getElementById('empEmail').value    = emp.email;
    document.getElementById('empPosition').value = emp.position;
    document.getElementById('empDept').value     = emp.dept;
    document.getElementById('empHireDate').value = emp.hireDate;
  } else {
    document.getElementById('empId').value       = '';
    document.getElementById('empEmail').value    = '';
    document.getElementById('empPosition').value = '';
    document.getElementById('empHireDate').value = '';
  }
}

function hideEmployeeForm() {
  document.getElementById('employeeForm').style.display = 'none';
}

function editEmployee(i)   { showEmployeeForm(i); }

function deleteEmployee(i) {
  window.db.employees.splice(i, 1);
  saveToStorage();
  renderEmployees();
}

function saveEmployee() {
  const id        = document.getElementById('empId').value.trim();
  const email     = document.getElementById('empEmail').value.trim();
  const position  = document.getElementById('empPosition').value.trim();
  const dept      = document.getElementById('empDept').value;
  const hireDate  = document.getElementById('empHireDate').value;
  const editIndex = document.getElementById('empEditIndex').value;

  if (!id || !email || !position) { alert('Please fill in all fields'); return; }

  const accountExists = window.db.accounts.find(a => a.email === email && a.verified === true);
  if (!accountExists) {
    alert(`No verified account found for "${email}". The user must have a registered and verified account before being added as an employee.`);
    return;
  }

  const dupId = window.db.employees.find((e, idx) => e.id === id && String(idx) !== editIndex);
  if (dupId) { alert(`Employee ID "${id}" is already in use.`); return; }

  const emp = { id, email, position, dept, hireDate };

  if (editIndex !== '') {
    window.db.employees[editIndex] = emp;
  } else {
    window.db.employees.push(emp);
  }

  saveToStorage();
  hideEmployeeForm();
  renderEmployees();
}

//  11. Render: Departments 
function renderDepartments() {
  const tbody = document.getElementById('deptTableBody');
  if (!tbody) return;
  tbody.innerHTML = window.db.departments.map((dept, i) => `
    <tr>
      <td>${dept.name}</td>
      <td>${dept.description}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1" onclick="editDept(${i})">Edit</button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteDept(${i})">Delete</button>
      </td>
    </tr>
  `).join('');
}

function showDeptForm(i) {
  document.getElementById('deptForm').style.display = 'block';
  document.getElementById('deptEditIndex').value = i !== undefined ? i : '';
  if (i !== undefined) {
    document.getElementById('deptName').value = window.db.departments[i].name;
    document.getElementById('deptDesc').value = window.db.departments[i].description;
  } else {
    document.getElementById('deptName').value = '';
    document.getElementById('deptDesc').value = '';
  }
}

function hideDeptForm() {
  document.getElementById('deptForm').style.display = 'none';
}

function editDept(i) { showDeptForm(i); }

function deleteDept(i) {
  window.db.departments.splice(i, 1);
  saveToStorage();
  renderDepartments();
}

function saveDept() {
  const name        = document.getElementById('deptName').value.trim();
  const description = document.getElementById('deptDesc').value.trim();
  const editIndex   = document.getElementById('deptEditIndex').value;

  if (!name) { alert('Please enter a department name'); return; }

  const dept = { name, description };

  if (editIndex !== '') {
    window.db.departments[editIndex] = dept;
  } else {
    window.db.departments.push(dept);
  }

  saveToStorage();
  hideDeptForm();
  renderDepartments();
}

// 12. Render: Accounts 
function renderAccounts() {
  const tbody = document.getElementById('accountTableBody');
  if (!tbody) return;
  tbody.innerHTML = window.db.accounts.map((acc, i) => `
    <tr class="${acc.blocked ? 'table-danger' : ''}">
      <td>${acc.firstName} ${acc.lastName}</td>
      <td>${acc.email}</td>
      <td>${acc.role}</td>
      <td>${acc.verified ? '✅' : '❌'}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1" onclick="editAccount(${i})">Edit</button>
        <button class="btn btn-sm btn-outline-warning me-1" onclick="resetPassword(${i})">Reset Password</button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteAccount(${i})">Delete</button>
      </td>
    </tr>
  `).join('');
}

function showAccountForm(i) {
  document.getElementById('accountForm').style.display = 'block';
  document.getElementById('accEditEmail').value = i !== undefined ? window.db.accounts[i].email : '';
  if (i !== undefined) {
    const acc = window.db.accounts[i];
    document.getElementById('accFirstName').value  = acc.firstName;
    document.getElementById('accLastName').value   = acc.lastName;
    document.getElementById('accEmail').value      = acc.email;
    document.getElementById('accPassword').value   = acc.password;
    document.getElementById('accRole').value       = acc.role;
    document.getElementById('accVerified').checked = acc.verified;
  } else {
    document.getElementById('accFirstName').value  = '';
    document.getElementById('accLastName').value   = '';
    document.getElementById('accEmail').value      = '';
    document.getElementById('accPassword').value   = '';
    document.getElementById('accRole').value       = 'user';
    document.getElementById('accVerified').checked = false;
  }
}

function hideAccountForm() {
  document.getElementById('accountForm').style.display = 'none';
}

function editAccount(i) { showAccountForm(i); }

function deleteAccount(i) {
  const acc = window.db.accounts[i];
  if (acc.email === currentUser.email) { alert('Cannot delete your own account'); return; }
  window.db.accounts.splice(i, 1);
  saveToStorage();
  renderAccounts();
}

function toggleBlock(i) {
  const acc = window.db.accounts[i];
  if (acc.email === currentUser.email) { alert('You cannot block your own account'); return; }
  acc.blocked = !acc.blocked;
  saveToStorage();
  alert(`Account "${acc.email}" has been ${acc.blocked ? 'blocked' : 'unblocked'}.`);
  renderAccounts();
}

function resetPassword(i) {
  const acc = window.db.accounts[i];
  const newPass = prompt(`Enter new password for ${acc.email}:`);
  if (!newPass || newPass.length < 6) { alert('Password must be at least 6 characters'); return; }
  acc.password = newPass;
  saveToStorage();
  alert('Password reset successfully');
}

function saveAccount() {
  const firstName = document.getElementById('accFirstName').value.trim();
  const lastName  = document.getElementById('accLastName').value.trim();
  const email     = document.getElementById('accEmail').value.trim();
  const password  = document.getElementById('accPassword').value;
  const role      = document.getElementById('accRole').value;
  const verified  = document.getElementById('accVerified').checked;
  const oldEmail  = document.getElementById('accEditEmail').value;

  if (!firstName || !lastName || !email || !password) { alert('Please fill in all fields'); return; }

  const existing = window.db.accounts.find(a => a.email === (oldEmail || email));
  const blocked  = existing ? (existing.blocked || false) : false;

  const acc = { firstName, lastName, email, password, role, verified, blocked };

  if (oldEmail) {
    const idx = window.db.accounts.findIndex(a => a.email === oldEmail);
    if (idx > -1) window.db.accounts[idx] = acc;
  } else {
    window.db.accounts.push(acc);
  }

  saveToStorage();
  hideAccountForm();
  renderAccounts();
}

// 13. Render: Requests 
function renderRequests() {
  const userRequests = currentUser.role === 'admin'
    ? window.db.requests
    : window.db.requests.filter(r => r.employeeEmail === currentUser.email);
  const emptyDiv     = document.getElementById('requestsEmpty');
  const table        = document.getElementById('requestsTable');
  const tbody        = document.getElementById('requestTableBody');

  if (userRequests.length === 0) {
    emptyDiv.style.display = 'block';
    table.style.display    = 'none';
    return;
  }

  emptyDiv.style.display = 'none';
  table.style.display    = 'table';
  tbody.innerHTML = userRequests.map((req, i) => {
    const globalIdx = window.db.requests.indexOf(req);
    return `
      <tr>
        <td>${req.type}</td>
        <td>${req.items.map(it => `${it.name} (${it.qty})`).join(', ')}</td>
        <td>${req.date || 'N/A'}</td>
        <td>
          <span class="badge bg-${req.status === 'Approved' ? 'success' : req.status === 'Rejected' ? 'danger' : 'warning'}">
            ${req.status || 'Pending'}
          </span>
        </td>
        <td>
          ${currentUser.role === 'admin' ? `
  <button class="btn btn-sm btn-success me-1" onclick="updateStatus(${globalIdx}, 'Approved')">Approve</button>
  <button class="btn btn-sm btn-danger me-1" onclick="updateStatus(${globalIdx}, 'Rejected')">Reject</button>
` : ``}
        </td>
      </tr>
    `;
  }).join('');
}
function deleteRequest(i) {
  const userRequests = window.db.requests.filter(r => r.employeeEmail === currentUser.email);
  const req          = userRequests[i];
  const globalIdx    = window.db.requests.indexOf(req);
  window.db.requests.splice(globalIdx, 1);
  saveToStorage();
  renderRequests();
}

function updateStatus(globalIdx, status) {
  window.db.requests[globalIdx].status = status;
  saveToStorage();
  renderRequests();
}

let requestModal;
function openRequestModal() {
  document.getElementById('reqItems').innerHTML = '';
  document.getElementById('reqType').value      = 'Equipment';
  addRequestItem();
  if (!requestModal) requestModal = new bootstrap.Modal(document.getElementById('requestModal'));
  requestModal.show();
}

function addRequestItem() {
  const container = document.getElementById('reqItems');
  const row       = document.createElement('div');
  row.className   = 'd-flex gap-2 mb-2 align-items-center';
  row.innerHTML   = `
    <input type="text" class="form-control req-item-name" placeholder="Item name"/>
    <input type="number" class="form-control req-item-qty" value="1" style="width:70px"/>
    <button class="btn btn-sm btn-outline-danger" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(row);
}

function submitRequest() {
  const type      = document.getElementById('reqType').value.trim();
  const itemNames = document.querySelectorAll('.req-item-name');
  const itemQtys  = document.querySelectorAll('.req-item-qty');

  if (!type) { alert('Please enter a request type'); return; }

  const items = [];
  itemNames.forEach((inp, i) => {
    const name = inp.value.trim();
    const qty  = itemQtys[i].value || '1';
    if (name) items.push({ name, qty });
  });

  if (items.length === 0) { alert('Please add at least one item'); return; }

  window.db.requests.push({
    employeeEmail: currentUser.email,
    type,
    items,
    status: 'Pending',
    date: new Date().toLocaleDateString()
  });
  saveToStorage();
  requestModal.hide();
  renderRequests();
}

// 14. Login 
function loginUser() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) { alert('Please enter email and password'); return; }

  const user = window.db.accounts.find(a => a.email === email && a.password === password);
  if (!user)          { alert('Invalid email or password'); return; }
  if (!user.verified) { alert('Please verify your email first'); return; }
  if (user.blocked)   { alert('Your account has been blocked. Please contact the administrator.'); return; }

  localStorage.setItem('auth_token', email);
  setAuthState(true, user);
  updateNavbar();
  navigateTo('#/profile');
}

// ── 15. Register ─────────────────────────────────────────────
function registerUser() {
  const firstName = document.getElementById('firstName').value.trim();
  const lastName  = document.getElementById('lastName').value.trim();
  const email     = document.getElementById('regEmail').value.trim();
  const password  = document.getElementById('regPassword').value;

  if (!firstName || !lastName || !email || !password) { alert('Please fill in all fields'); return; }
  if (password.length < 6) { alert('Password must be at least 6 characters'); return; }

  const exists = window.db.accounts.find(a => a.email === email);
  if (exists) { alert('Email already exists'); return; }

  const newAccount = { firstName, lastName, email, password, role: 'user', verified: false, blocked: false };
  window.db.accounts.push(newAccount);
  saveToStorage();

  unverifiedEmail = email;
  localStorage.setItem('unverified_email', email);
  navigateTo('#/verify-email');
}

// ── 16. Verify ───────────────────────────────────────────────
function simulateVerification() {
  const user = window.db.accounts.find(a => a.email === unverifiedEmail);
  if (!user) { alert('No unverified email found'); return; }

  user.verified = true;
  saveToStorage();
  localStorage.removeItem('unverified_email');
  unverifiedEmail = null;
  navigateTo('#/login');

  setTimeout(() => {
    const loginSection = document.getElementById('page-login');
    if (!document.getElementById('verifySuccessBanner')) {
      loginSection.insertAdjacentHTML('afterbegin',
        '<div id="verifySuccessBanner" class="alert alert-success mb-3">✅ Email verified! You may now log in.</div>'
      );
    }
  }, 50);
}

// ── 17. Event Listeners ──────────────────────────────────────
window.addEventListener('hashchange', handleRouting);
window.addEventListener('load', () => {
  if (!window.location.hash) navigateTo('#/');
  handleRouting();
  updateNavbar();

  document.getElementById('loginBtn').addEventListener('click', loginUser);
  document.getElementById('registerBtn').addEventListener('click', registerUser);
  document.getElementById('verifyBtn').addEventListener('click', simulateVerification);
});