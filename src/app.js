import { renderLoginPage } from './pages/login.js';
import { renderMenuPage } from './pages/menu.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderRegisterPage } from './pages/register.js';
import { renderGasRegisterPage } from './pages/gas-register.js';
import { renderHistoryPage } from './pages/history.js';
import { renderReportPage } from './pages/report.js';
import { migrateLocalDataToFirebase } from './db.js';
import { isAuthenticated, logout, isOperator, isAdmin } from './utils/session.js';

export function initApp() {
  // Clear any old persistent session tokens from previous versions
  try {
    localStorage.removeItem('active_business_id');
    localStorage.removeItem('app_authenticated');
  } catch (e) {}

  window.appLogout = function() {
    if (confirm('¿Deseas cerrar sesión para cambiar de estación?')) {
      logout();
      if (window.location.hash === '#login') {
        window.location.reload();
      } else {
        window.location.hash = '#login';
      }
    }
  };

  migrateLocalDataToFirebase();
  const appContainer = document.getElementById('app');
  
  // Navigation element creation
  const navElement = document.createElement('nav');
  navElement.className = 'bottom-nav';
  navElement.innerHTML = `
    <a href="#dashboard" class="nav-item" data-target="dashboard">
      <span class="nav-icon">🏠</span>
      <span>Inicio</span>
    </a>
    <a href="#history" class="nav-item" data-target="history">
      <span class="nav-icon">📜</span>
      <span>Historial</span>
    </a>
    <a href="#report" class="nav-item" data-target="report">
      <span class="nav-icon">📄</span>
      <span>Informes</span>
    </a>
    <a href="javascript:void(0)" class="nav-item" id="navLogout" data-target="logout">
      <span class="nav-icon">🚪</span>
      <span>Salir</span>
    </a>
  `;
  document.body.appendChild(navElement);

  const navLogoutBtn = navElement.querySelector('#navLogout');
  if (navLogoutBtn) {
    navLogoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.appLogout();
    });
  }

  function updateNav(hash) {
    // Si es operador, ocultar siempre la barra de navegación inferior
    if (isOperator()) {
      navElement.style.display = 'none';
      return;
    }

    const items = navElement.querySelectorAll('.nav-item');
    items.forEach(item => item.classList.remove('active'));
    const target = hash.replace('#', '') || 'dashboard';
    const activeItem = navElement.querySelector(`[data-target="${target}"]`);
    if (activeItem) activeItem.classList.add('active');
    
    // Hide nav on login, register, gas-register, or menu for admin
    if (target === 'login' || target === 'register' || target === 'gas-register' || target === 'menu') {
      navElement.style.display = 'none';
    } else {
      navElement.style.display = 'flex';
    }
  }

  let currentRouteToken = 0;

  async function route() {
    const routeToken = ++currentRouteToken;
    let hash = window.location.hash || '#dashboard';
    
    // Auth check
    const auth = isAuthenticated();
    if (!auth && hash !== '#login') {
      if (window.location.hash !== '#login') {
        window.location.hash = '#login';
      }
      return;
    }
    
    // Protección de rutas: el operador solo puede estar en #menu, #register, #gas-register o #login
    if (auth && isOperator() && !['#menu', '#register', '#gas-register', '#login'].includes(hash)) {
      if (window.location.hash !== '#menu') {
        window.location.hash = '#menu';
      }
      return;
    }
    
    updateNav(hash);
    
    let pageElement = null;
    
    switch (hash) {
      case '#login':
        pageElement = renderLoginPage();
        break;
      case '#menu':
        pageElement = renderMenuPage();
        break;
      case '#dashboard':
        pageElement = await renderDashboard();
        break;
      case '#register':
        pageElement = await renderRegisterPage();
        break;
      case '#gas-register':
        pageElement = await renderGasRegisterPage();
        break;
      case '#history':
        pageElement = await renderHistoryPage();
        break;
      case '#report':
        pageElement = await renderReportPage();
        break;
      default:
        window.location.hash = isOperator() ? '#menu' : '#dashboard';
        return;
    }
    
    // Si ha entrado otra navegación mientras se resolvía la página asíncrona, descartar
    if (routeToken !== currentRouteToken) {
      return;
    }

    // Limpiar el contenedor y montar la página nueva para evitar cualquier duplicidad
    appContainer.innerHTML = '';
    if (pageElement) {
      appContainer.appendChild(pageElement);
      appContainer.style.opacity = 1;
    }
  }

  window.addEventListener('hashchange', route);
  route(); // Initial route
}
