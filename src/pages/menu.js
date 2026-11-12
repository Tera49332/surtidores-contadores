import { createHeader } from '../components/header.js';
import { getActiveBusiness, getActiveBusinessName, getActiveLavaderoConfig } from '../utils/constants.js';
import { isAdmin, logout } from '../utils/session.js';

export function renderMenuPage() {
  const container = document.createElement('div');
  container.className = 'page-content menu-page';

  const business = getActiveBusiness();
  const businessName = getActiveBusinessName();
  const lavaderoConfig = getActiveLavaderoConfig();
  const headerHtml = createHeader('Tareas del Día', isAdmin());

  // Configuración horaria de conteo de bombonas (ej. 06082 se hace por la noche/cierre)
  const isNightGas = business?.code === '6082' || business?.pin === '06082' || business?.gasConfig?.isNightCount;
  const gasSubtitle = isNightGas 
    ? 'Conteo nocturno de bombonas: llenas, vacías y huecos de jaula.' 
    : 'Conteo matinal de bombonas: llenas, vacías y huecos de jaula.';
  const gasBadgeText = isNightGas ? '🌙 Noche / Cierre' : '☀️ Primera hora / Mañana';
  const gasBadgeBg = isNightGas ? '#ede7f6' : '#fff3e0';
  const gasBadgeColor = isNightGas ? '#4527a0' : '#e65100';

  const lavaderoCardHtml = lavaderoConfig ? `
      <!-- OPCIÓN 4: CONTADORES LAVADERO -->
      <div class="card menu-task-card" onclick="window.location.hash='#lavadero-register'" 
           style="background: #ffffff; border: 2px solid rgba(0, 188, 212, 0.35); border-radius: 16px; padding: 1.2rem; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 14px rgba(0, 188, 212, 0.08); display: flex; align-items: center; gap: 1.2rem;">
        <div style="width: 68px; height: 68px; min-width: 68px; border-radius: 14px; background: rgba(0, 188, 212, 0.12); display: flex; align-items: center; justify-content: center; font-size: 2.2rem;">
          🚿
        </div>
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: #002B49;">
              Contadores ${lavaderoConfig.name || 'Lavadero'}
            </h3>
            <span style="color: #00838F; font-size: 1.2rem; font-weight: 900;">➔</span>
          </div>
          <p style="margin: 0.35rem 0 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.35;">
            Toma de contadores de Túnel, Boxes y Aspiradores.
          </p>
          <span style="display: inline-block; margin-top: 0.5rem; font-size: 0.75rem; font-weight: 700; background: #e0f7fa; color: #006064; padding: 2px 8px; border-radius: 6px;">
            ✨ ${lavaderoConfig.name || 'Lavadero'}
          </span>
        </div>
      </div>
  ` : '';

  container.innerHTML = `
    ${headerHtml}
    <div style="padding: 1.5rem 1rem 5rem; max-width: 520px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.25rem;">
      <div style="text-align: center; margin-bottom: 0.5rem;">
        <span style="font-size: 0.8rem; font-weight: 800; color: #ff6600; text-transform: uppercase; letter-spacing: 1px;">
          Punto de Venta
        </span>
        <h2 style="font-size: 1.4rem; font-weight: 900; color: #002B49; margin: 0.2rem 0 0.5rem;">
          ${businessName}
        </h2>
        <p style="font-size: 0.9rem; color: var(--text-muted); margin: 0;">
          Selecciona la tarea a registrar en este turno:
        </p>
      </div>

      <!-- OPCIÓN 1: CONTADORES SURTIDORES -->
      <div class="card menu-task-card" onclick="window.location.hash='#register'" 
           style="background: #ffffff; border: 2px solid rgba(0, 43, 73, 0.12); border-radius: 16px; padding: 1.2rem; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(0,0,0,0.04); display: flex; align-items: center; gap: 1.2rem;">
        <div style="width: 68px; height: 68px; min-width: 68px; border-radius: 14px; background: rgba(0, 43, 73, 0.06); display: flex; align-items: center; justify-content: center; font-size: 2.2rem;">
          ⛽
        </div>
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: #002B49;">
              Contadores Surtidores
            </h3>
            <span style="color: #ff6600; font-size: 1.2rem; font-weight: 900;">➔</span>
          </div>
          <p style="margin: 0.35rem 0 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.35;">
            Toma de totalizadores calle por calle.
          </p>
        </div>
      </div>

      <!-- OPCIÓN 2: CONTEO DE BUTANO Y PROPANO -->
      <div class="card menu-task-card" onclick="window.location.hash='#gas-register'" 
           style="background: #ffffff; border: 2px solid rgba(255, 102, 0, 0.3); border-radius: 16px; padding: 1.2rem; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 14px rgba(255, 102, 0, 0.08); display: flex; align-items: center; gap: 1.2rem;">
        <div style="width: 68px; height: 68px; min-width: 68px; border-radius: 14px; background: rgba(255, 102, 0, 0.1); display: flex; align-items: center; justify-content: center; padding: 4px; box-sizing: border-box;">
          <img src="/images/butano.png" alt="Bombonas Repsol" style="height: 60px; width: auto; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));">
        </div>
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: #002B49;">
              Butano y Propano
            </h3>
            <span style="color: #ff6600; font-size: 1.2rem; font-weight: 900;">➔</span>
          </div>
          <p style="margin: 0.35rem 0 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.35;">
            ${gasSubtitle}
          </p>
          <span style="display: inline-block; margin-top: 0.5rem; font-size: 0.75rem; font-weight: 700; background: ${gasBadgeBg}; color: ${gasBadgeColor}; padding: 2px 8px; border-radius: 6px;">
            ${gasBadgeText}
          </span>
        </div>
      </div>

      <!-- OPCIÓN 3: DESCARGA DE BUTANO (ALBARÁN) -->
      <div class="card menu-task-card" onclick="window.location.hash='#gas-delivery'" 
           style="background: #ffffff; border: 2px solid rgba(16, 124, 65, 0.25); border-radius: 16px; padding: 1.2rem; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 14px rgba(16, 124, 65, 0.06); display: flex; align-items: center; gap: 1.2rem;">
        <div style="width: 68px; height: 68px; min-width: 68px; border-radius: 14px; background: rgba(16, 124, 65, 0.08); display: flex; align-items: center; justify-content: center; font-size: 2.2rem;">
          🚚
        </div>
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: #002B49;">
              Descarga de Butano
            </h3>
            <span style="color: #107c41; font-size: 1.2rem; font-weight: 900;">➔</span>
          </div>
          <p style="margin: 0.35rem 0 0; font-size: 0.85rem; color: var(--text-muted); line-height: 1.35;">
            Anotar albarán cuando el camión descarga bombonas llenas.
          </p>
          <span style="display: inline-block; margin-top: 0.5rem; font-size: 0.75rem; font-weight: 700; background: #e8f5e9; color: #2e7d32; padding: 2px 8px; border-radius: 6px;">
            📦 Albarán Camión
          </span>
        </div>
      </div>

      ${lavaderoCardHtml}

      <div style="margin-top: 1.5rem; text-align: center;">
        <button id="btnMenuLogout" style="background: none; border: 1px solid var(--border-color); color: var(--text-muted); padding: 0.75rem 1.5rem; border-radius: 10px; font-size: 0.9rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem;">
          <span>🚪</span> Cerrar Sesión / Cambiar PIN
        </button>
      </div>
    </div>
  `;

  const logoutBtn = container.querySelector('#btnMenuLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logout();
      window.location.hash = '#login';
      window.location.reload();
    });
  }

  return container;
}
