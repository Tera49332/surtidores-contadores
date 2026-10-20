import { isAdmin } from '../utils/session.js';

export function createHeader(title, showBack = false) {
  const allowBack = showBack && isAdmin();

  return `
    <header class="app-header" style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 1rem; background: #ffffff; border-bottom: 2px solid #ff6600; box-shadow: 0 2px 8px rgba(0,0,0,0.06); position: sticky; top: 0; z-index: 100;">
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        ${allowBack 
          ? '<button class="back-btn" onclick="window.location.hash=\'#dashboard\'" title="Volver al panel" style="background: none; border: none; font-size: 1.3rem; cursor: pointer; color: #002B49; padding: 4px 8px;">←</button>' 
          : '<button class="logout-header-btn" onclick="window.appLogout()" title="Cerrar turno / Salir" style="background: rgba(0, 43, 73, 0.06); border: 1px solid rgba(0, 43, 73, 0.15); border-radius: 6px; padding: 5px 9px; font-size: 0.8rem; font-weight: 600; color: #002B49; cursor: pointer;">🚪 Salir</button>'
        }
      </div>

      <div style="display: flex; align-items: center; gap: 0.6rem;">
        <img src="/repsol-logo.jpg" alt="Repsol" style="height: 38px; width: auto; object-fit: contain; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));">
        <div style="display: flex; flex-direction: column; text-align: left;">
          <span style="font-size: 1.05rem; font-weight: 900; letter-spacing: 1.5px; color: #002B49; line-height: 1;">CONTADORES</span>
          <span style="font-size: 0.75rem; font-weight: 700; color: #ff6600; letter-spacing: 0.4px;">${title}</span>
        </div>
      </div>

      <div style="width: 40px; text-align: right;"></div>
    </header>
  `;
}
