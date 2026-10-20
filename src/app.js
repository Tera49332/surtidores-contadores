import { renderLoginPage } from './pages/login.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderRegisterPage } from './pages/register.js';
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
    // Si es operador, ocultar siempre la barra de navegación (solo tiene acceso a registrar)
    if (isOperator()) {
      navElement.style.display = 'none';
      return;
    }

    const items = navElement.querySelectorAll('.nav-item');
    items.forEach(item => item.classList.remove('active'));
    const target = hash.replace('#', '') || 'dashboard';
    const activeItem = navElement.querySelector(`[data-target="${target}"]`);
    if (activeItem) activeItem.classList.add('active');
    
    // Hide nav on login or register for admin
    if (target === 'login' || target === 'register') {
      navElement.style.display = 'none';
    } else {
      navElement.style.display = 'flex';
    }
  }

  async function route() {
    let hash = window.location.hash || '#dashboard';
    
    // Auth check
    const auth = isAuthenticated();
    if (!auth && hash !== '#login') {
      window.location.hash = '#login';
      return;
    }
    
    // Protección de rutas: el operador solo puede estar en #register o #login
    if (auth && isOperator() && hash !== '#register') {
      window.location.hash = '#register';
      return;
    }
    
    updateNav(hash);
    appContainer.innerHTML = ''; // Clear current page
    
    // Smooth transition simulation
    appContainer.style.opacity = 0;
    
    let pageElement = null;
    
    switch (hash) {
      case '#login':
        pageElement = renderLoginPage(() => {
          window.location.hash = '#dashboard';
        });
        break;
      case '#dashboard':
        pageElement = await renderDashboard();
        break;
      case '#register':
        pageElement = await renderRegisterPage();
        break;
      case '#history':
        pageElement = await renderHistoryPage();
        break;
      case '#report':
        pageElement = await renderReportPage();
        break;
      default:
        window.location.hash = '#dashboard';
        return;
    }
    
    if (pageElement) {
      appContainer.appendChild(pageElement);
      // Fade in
      setTimeout(() => {
        appContainer.style.transition = 'opacity 0.3s ease';
        appContainer.style.opacity = 1;
      }, 50);
    }
  }

  window.addEventListener('hashchange', route);
  route(); // Initial route
}
