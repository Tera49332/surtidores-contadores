import { createHeader } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { getLatestGasReading, saveGasReading } from '../db.js';
import { getActiveGasConfig, getActiveBusinessName } from '../utils/constants.js';
import { isAdmin, logout } from '../utils/session.js';
import { formatDateTime } from '../utils/date-helpers.js';

export async function renderGasRegisterPage() {
  const container = document.createElement('div');
  container.className = 'page-content gas-register-page';

  const businessName = getActiveBusinessName();
  const gasConfig = getActiveGasConfig();
  const latestReading = await getLatestGasReading();
  const headerHtml = createHeader(isAdmin() ? 'Conteo de Bombonas' : 'Butano y Propano', true);

  // Format current local datetime
  const now = new Date();
  const localIsoDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  let formHtml = `
    <form id="gasRegisterForm" novalidate style="padding: 1rem 1rem 5rem; max-width: 540px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem;">
      
      <!-- NAVEGACIÓN RÁPIDA / VOLVER AL MENÚ -->
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <button type="button" onclick="window.location.hash='#menu'" 
                style="background: rgba(0, 43, 73, 0.05); border: 1px solid rgba(0, 43, 73, 0.15); border-radius: 8px; padding: 6px 12px; font-size: 0.85rem; font-weight: 700; color: #002B49; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem;">
          <span>←</span> Menú de tareas
        </button>
        <button type="button" onclick="window.location.hash='#gas-delivery'"
                style="background: rgba(16, 124, 65, 0.08); border: 1px solid rgba(16, 124, 65, 0.25); border-radius: 8px; padding: 6px 12px; font-size: 0.85rem; font-weight: 700; color: #107c41; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem;">
          <span>🚚</span> Descarga Camión ➔
        </button>
      </div>

      <!-- FECHA Y HORA -->
      <div class="card" style="padding: 1rem; background: #ffffff; border: 1px solid var(--border-color); border-radius: 12px;">
        <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.4rem;">
          📅 Fecha y Hora del Conteo
        </label>
        <input type="datetime-local" id="gasDateTime" value="${localIsoDate}" 
          style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; font-size: 1rem; font-weight: 600; color: var(--text-main); box-sizing: border-box;">
      </div>
  `;

  // GENERAR TARJETA POR CADA PRODUCTO (BUTANO / PROPANO)
  const products = [
    { key: 'butano', ...gasConfig.butano },
    { key: 'propano', ...gasConfig.propano }
  ];

  products.forEach(prod => {
    const prev = latestReading?.data?.[prod.key] || { llenas: 0, vacias: 0, huecos: 0 };
    const capacityText = prod.capacity !== null && prod.capacity !== undefined 
      ? `Capacidad: ${prod.capacity} botellas` 
      : 'Capacidad variable';

    formHtml += `
      <div class="card gas-product-card" data-product="${prod.key}" data-capacity="${prod.capacity ?? ''}"
           style="background: #ffffff; border: 1.5px solid var(--border-color); border-radius: 14px; padding: 1.1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
        
        <!-- CABECERA DEL PRODUCTO -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-light);">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <img src="${prod.iconImg}" alt="${prod.name}" style="height: 48px; width: auto; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.12));">
            <div>
              <h3 style="margin: 0; font-size: 1.1rem; font-weight: 900; color: #002B49;">${prod.name}</h3>
              <span style="font-size: 0.75rem; font-weight: 700; color: #ff6600;">${capacityText}</span>
            </div>
          </div>
          <div class="tally-status" style="font-size: 0.8rem; font-weight: 700; padding: 4px 10px; border-radius: 8px; background: #f0f4f8; color: var(--text-muted);">
            Total: 0
          </div>
        </div>

        <!-- INPUTS: LLENAS, VACÍAS, HUECOS -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.65rem;">
          
          <!-- LLENAS -->
          <div style="display: flex; flex-direction: column; gap: 0.3rem;">
            <label style="font-size: 0.8rem; font-weight: 700; color: #2e7d32; display: flex; align-items: center; gap: 4px;">
              <span>🟢</span> Llenas
            </label>
            <input type="number" min="0" step="1" inputmode="numeric" pattern="[0-9]*"
                   class="input-gas input-gas-llenas" 
                   data-product="${prod.key}" data-field="llenas"
                   placeholder="0"
                   style="width: 100%; padding: 0.75rem 0.5rem; border: 1.5px solid #2e7d32; border-radius: 8px; font-size: 1.25rem; font-weight: 800; text-align: center; color: #002B49; box-sizing: border-box; background: #f1f8e9;"
                   onfocus="this.select()">
            <span style="font-size: 0.7rem; color: var(--text-muted); text-align: center;">
              Ant: ${prev.llenas ?? 0}
            </span>
          </div>

          <!-- VACÍAS -->
          <div style="display: flex; flex-direction: column; gap: 0.3rem;">
            <label style="font-size: 0.8rem; font-weight: 700; color: #0277bd; display: flex; align-items: center; gap: 4px;">
              <span>⚪</span> Vacías
            </label>
            <input type="number" min="0" step="1" inputmode="numeric" pattern="[0-9]*"
                   class="input-gas input-gas-vacias" 
                   data-product="${prod.key}" data-field="vacias"
                   placeholder="0"
                   style="width: 100%; padding: 0.75rem 0.5rem; border: 1.5px solid #0277bd; border-radius: 8px; font-size: 1.25rem; font-weight: 800; text-align: center; color: #002B49; box-sizing: border-box; background: #e1f5fe;"
                   onfocus="this.select()">
            <span style="font-size: 0.7rem; color: var(--text-muted); text-align: center;">
              Ant: ${prev.vacias ?? 0}
            </span>
          </div>

          <!-- HUECOS -->
          <div style="display: flex; flex-direction: column; gap: 0.3rem;">
            <label style="font-size: 0.8rem; font-weight: 700; color: #c62828; display: flex; align-items: center; gap: 4px;">
              <span>🔴</span> Huecos
            </label>
            <input type="number" min="0" step="1" inputmode="numeric" pattern="[0-9]*"
                   class="input-gas input-gas-huecos" 
                   data-product="${prod.key}" data-field="huecos"
                   placeholder="0"
                   style="width: 100%; padding: 0.75rem 0.5rem; border: 1.5px solid #c62828; border-radius: 8px; font-size: 1.25rem; font-weight: 800; text-align: center; color: #002B49; box-sizing: border-box; background: #ffebee;"
                   onfocus="this.select()">
            <span style="font-size: 0.7rem; color: var(--text-muted); text-align: center;">
              Ant: ${prev.huecos ?? 0}
            </span>
          </div>

        </div>

        <!-- AVISO DE CUADRE EN TIEMPO REAL -->
        <div class="tally-alert" style="margin-top: 0.85rem; padding: 0.55rem 0.85rem; border-radius: 8px; font-size: 0.85rem; font-weight: 700; display: none;">
        </div>

      </div>
    `;
  });

  // OBSERVACIONES / INCIDENCIAS
  formHtml += `
      <div class="card" style="padding: 1rem; background: #ffffff; border: 1px solid var(--border-color); border-radius: 12px;">
        <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.4rem;">
          📝 Observaciones / Incidencias (opcional)
        </label>
        <textarea id="gasNotes" rows="2" placeholder="Ej: 1 envase golpeado, precinto roto, etc."
          style="width: 100%; padding: 0.65rem; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.95rem; color: var(--text-main); box-sizing: border-box; resize: vertical;"></textarea>
      </div>

      <div style="margin-top: 0.5rem;">
        <button type="submit" id="btnSubmitGas" class="btn btn-primary" 
          style="width: 100%; padding: 1.05rem; border-radius: 10px; font-weight: 800; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.6rem; background: #ff6600; color: #fff; border: none; box-shadow: 0 4px 14px rgba(255, 102, 0, 0.35);">
          💾 Guardar Conteo de Bombonas
        </button>
      </div>

    </form>
  `;

  container.innerHTML = headerHtml + formHtml;

  // LÓGICA DE CÁLCULO Y VALIDACIÓN EN TIEMPO REAL
  function updateTally(card) {
    const capacityAttr = card.dataset.capacity;
    const capacity = capacityAttr !== '' ? parseInt(capacityAttr, 10) : null;
    
    const llenasInput = card.querySelector('.input-gas-llenas');
    const vaciasInput = card.querySelector('.input-gas-vacias');
    const huecosInput = card.querySelector('.input-gas-huecos');

    const llenas = parseInt(llenasInput.value, 10) || 0;
    const vacias = parseInt(vaciasInput.value, 10) || 0;
    const huecos = parseInt(huecosInput.value, 10) || 0;
    const total = llenas + vacias + huecos;

    const statusBadge = card.querySelector('.tally-status');
    const alertBox = card.querySelector('.tally-alert');

    if (total === 0 && llenasInput.value === '' && vaciasInput.value === '' && huecosInput.value === '') {
      statusBadge.textContent = 'Pendiente';
      statusBadge.style.background = '#f0f4f8';
      statusBadge.style.color = 'var(--text-muted)';
      alertBox.style.display = 'none';
      return { total, matches: true };
    }

    if (capacity !== null) {
      if (total === capacity) {
        statusBadge.textContent = `Total: ${total} / ${capacity} ✓`;
        statusBadge.style.background = '#e8f5e9';
        statusBadge.style.color = '#2e7d32';

        alertBox.style.display = 'block';
        alertBox.style.background = '#e8f5e9';
        alertBox.style.color = '#2e7d32';
        alertBox.style.border = '1px solid #c8e6c9';
        alertBox.innerHTML = `✅ Cuadre exacto: ${llenas} llenas + ${vacias} vacías + ${huecos} huecos = ${total} botellas`;
        return { total, matches: true };
      } else {
        const diff = total - capacity;
        const diffText = diff > 0 ? `sobran ${diff}` : `faltan ${Math.abs(diff)}`;
        statusBadge.textContent = `Total: ${total} / ${capacity} ⚠️`;
        statusBadge.style.background = '#ffebee';
        statusBadge.style.color = '#c62828';

        alertBox.style.display = 'block';
        alertBox.style.background = '#fff3e0';
        alertBox.style.color = '#e65100';
        alertBox.style.border = '1px solid #ffe082';
        alertBox.innerHTML = `⚠️ Descuadre en jaula: Total ${total} de ${capacity} (${diffText}). Revisa las cantidades.`;
        return { total, matches: false, diff };
      }
    } else {
      statusBadge.textContent = `Total: ${total} botellas`;
      statusBadge.style.background = '#e1f5fe';
      statusBadge.style.color = '#0277bd';
      alertBox.style.display = 'none';
      return { total, matches: true };
    }
  }

  const cards = container.querySelectorAll('.gas-product-card');
  cards.forEach(card => {
    card.querySelectorAll('.input-gas').forEach(inp => {
      inp.addEventListener('input', () => updateTally(card));
    });
    updateTally(card);
  });

  // SUBMIT HANDLER
  const form = container.querySelector('#gasRegisterForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {};
    const mismatches = [];
    const dateInput = container.querySelector('#gasDateTime');
    const selectedDate = dateInput && dateInput.value ? new Date(dateInput.value) : new Date();
    const notes = (container.querySelector('#gasNotes')?.value || '').trim();

    cards.forEach(card => {
      const prodKey = card.dataset.product;
      const capacityAttr = card.dataset.capacity;
      const capacity = capacityAttr !== '' ? parseInt(capacityAttr, 10) : null;

      const llenas = parseInt(card.querySelector('.input-gas-llenas').value, 10) || 0;
      const vacias = parseInt(card.querySelector('.input-gas-vacias').value, 10) || 0;
      const huecos = parseInt(card.querySelector('.input-gas-huecos').value, 10) || 0;
      const total = llenas + vacias + huecos;

      data[prodKey] = { llenas, vacias, huecos, total, capacity };

      if (capacity !== null && total !== capacity) {
        const prodName = prodKey === 'butano' ? 'Butano' : 'Propano';
        mismatches.push(`• ${prodName}: ${total} contadas vs ${capacity} capacidad`);
      }
    });

    if (mismatches.length > 0) {
      const proceed = confirm(
        `Aviso de descuadre en jaula de bombonas:\n\n` +
        mismatches.join('\n') +
        `\n\n¿Deseas registrar estos datos de todas formas?`
      );
      if (!proceed) return;
    } else {
      if (!confirm('¿Confirmas guardar el recuento de bombonas?')) return;
    }

    const submitBtn = container.querySelector('#btnSubmitGas');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando datos...';
      submitBtn.style.opacity = '0.7';
    }

    const readingData = {
      id: 'gas_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      date: selectedDate.toISOString(),
      data,
      notes
    };

    try {
      await saveGasReading(readingData);
      showToast('Conteo de bombonas guardado con éxito', 'success');

      if (isAdmin()) {
        window.location.hash = '#dashboard';
      } else {
        showGasOperatorConfirmation(container, businessName, selectedDate, data);
      }
    } catch (err) {
      console.error('Error al guardar recuento de gas:', err);
      showToast(`Error al guardar: ${err.message || 'Error desconocido'}`, 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '💾 Guardar Conteo de Bombonas';
        submitBtn.style.opacity = '1';
      }
    }
  });

  return container;
}

function showGasOperatorConfirmation(container, businessName, selectedDate, data) {
  const butano = data.butano || { llenas: 0, vacias: 0, huecos: 0, total: 0 };
  const propano = data.propano || { llenas: 0, vacias: 0, huecos: 0, total: 0 };

  container.innerHTML = `
    <header class="app-header" style="display: flex; justify-content: center; align-items: center; padding: 0.8rem 1rem; background: #ffffff; border-bottom: 2px solid #ff6600; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
      <div style="display: flex; align-items: center; gap: 0.6rem;">
        <img src="/repsol-logo.jpg" alt="Repsol" style="height: 40px; width: auto; object-fit: contain;">
        <span style="font-size: 1.2rem; font-weight: 900; letter-spacing: 1.5px; color: #002B49;">CONTADORES</span>
      </div>
    </header>

    <div style="padding: 2rem 1.2rem; text-align: center; max-width: 480px; margin: 1rem auto;">
      <div style="width: 80px; height: 80px; background: #e8f5e9; color: #2e7d32; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; margin: 0 auto 1.5rem; box-shadow: 0 4px 16px rgba(46, 125, 50, 0.2);">
        ✓
      </div>

      <h2 style="color: #002B49; font-size: 1.45rem; font-weight: 800; margin-bottom: 0.5rem;">
        ¡Conteo de Bombonas Registrado!
      </h2>

      <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.25rem;">
        Stock matinal registrado para <strong>${businessName}</strong>:
        <br>
        <span style="display: inline-block; margin-top: 0.4rem; font-weight: 700; color: #002B49; background: #f0f4f8; padding: 4px 12px; border-radius: 8px;">
          📅 ${formatDateTime(selectedDate)}
        </span>
      </p>

      <!-- RESUMEN EN TARJETAS -->
      <div style="display: flex; flex-direction: column; gap: 0.75rem; text-align: left; margin-bottom: 2rem;">
        <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 12px; padding: 0.85rem 1rem; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <img src="/images/butano.png" alt="Butano" style="height: 38px; width: auto;">
            <div>
              <strong style="color: #002B49; font-size: 0.95rem;">Butano (normal)</strong>
              <div style="font-size: 0.8rem; color: var(--text-muted);">🟢 ${butano.llenas} Llenas | ⚪ ${butano.vacias} Vacías | 🔴 ${butano.huecos} Huecos</div>
            </div>
          </div>
          <strong style="font-size: 1.1rem; color: #002B49;">${butano.total}</strong>
        </div>

        <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 12px; padding: 0.85rem 1rem; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <img src="/images/propano.png" alt="Propano" style="height: 38px; width: auto;">
            <div>
              <strong style="color: #002B49; font-size: 0.95rem;">Propano (11kg)</strong>
              <div style="font-size: 0.8rem; color: var(--text-muted);">🟢 ${propano.llenas} Llenas | ⚪ ${propano.vacias} Vacías | 🔴 ${propano.huecos} Huecos</div>
            </div>
          </div>
          <strong style="font-size: 1.1rem; color: #002B49;">${propano.total}</strong>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.8rem;">
        <button id="btnGasOperatorLogout" class="btn btn-primary" 
          style="width: 100%; padding: 1rem; border-radius: 10px; font-weight: 700; font-size: 1.05rem; background: #ff6600; color: #fff; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(255, 102, 0, 0.3);">
          🚪 Finalizar y Cerrar Sesión
        </button>

        <button id="btnGasOperatorMenu" class="btn btn-secondary" 
          style="width: 100%; padding: 0.8rem; border-radius: 10px; font-weight: 600; font-size: 0.95rem; background: #ffffff; border: 1px solid var(--border-color); color: var(--text-muted); cursor: pointer;">
          📋 Ir al Menú de Tareas
        </button>
      </div>
    </div>
  `;

  container.querySelector('#btnGasOperatorLogout').addEventListener('click', () => {
    logout();
    window.location.hash = '#login';
    window.location.reload();
  });

  container.querySelector('#btnGasOperatorMenu').addEventListener('click', () => {
    window.location.hash = '#menu';
  });
}
