import { createHeader } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { getLatestReading, saveReading } from '../db.js';
import { getActiveServices, getActiveBusinessName, getCounterStyle } from '../utils/constants.js';
import { isAdmin, logout } from '../utils/session.js';
import { formatDateTime } from '../utils/date-helpers.js';

export async function renderRegisterPage() {
  const container = document.createElement('div');
  container.className = 'page-content register-page';

  const businessName = getActiveBusinessName();
  const headerHtml = createHeader(isAdmin() ? 'Nueva Lectura Nocturna' : 'Toma de Contadores', isAdmin());
  const servicesDef = getActiveServices();
  const latestReading = await getLatestReading();

  // Format current local datetime for datetime-local input
  const now = new Date();
  const localIsoDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  let formHtml = `
    <form id="registerForm" novalidate style="padding: 1rem; padding-bottom: 5rem; display: flex; flex-direction: column; gap: 1rem;">
      <div class="card" style="padding: 1rem; background: #ffffff; border: 1px solid var(--border-color); border-radius: 12px;">
        <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.4rem;">
          📅 Fecha y Hora de la Toma
        </label>
        <input type="datetime-local" id="readingDateTime" value="${localIsoDate}" 
          style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; font-size: 1rem; font-weight: 600; color: var(--text-main); box-sizing: border-box;">
      </div>
  `;

  for (const service of servicesDef) {
    const badgeBg = service.color || '#005B8E';
    const calleBadgeHtml = service.product ? `
      <span style="display: inline-block; font-size: 0.75rem; font-weight: 700; color: ${service.textColor || '#ffffff'}; background: ${badgeBg}; padding: 3px 10px; border-radius: 8px; margin-top: 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.15); letter-spacing: 0.3px;">
        ${service.product}
      </span>
    ` : '';

    formHtml += `
      <div class="register-section card" style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
        <div class="section-header" style="padding: 0.85rem 1rem; display: flex; justify-content: space-between; align-items: center; background: rgba(0, 43, 73, 0.03); border-bottom: 1px solid var(--border-light); cursor: pointer;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span style="font-size: 1.25rem;">${service.icon || '⛽'}</span>
            <div>
              <h3 style="margin: 0; font-size: 1rem; color: #002B49; font-weight: 800;">${service.name}</h3>
              ${calleBadgeHtml}
            </div>
          </div>
          <span class="toggle-icon" style="color: var(--text-muted); font-size: 0.9rem; transition: transform 0.2s;">▼</span>
        </div>
        <div class="section-content" style="padding: 1rem; display: flex; flex-direction: column; gap: 0.85rem;">
    `;

    service.counters.forEach(counterObj => {
      const counter = counterObj.short || counterObj.name;
      const unit = counterObj.unit || 'L';
      const prevVal = latestReading?.data?.[service.name]?.[counter] ?? 0;
      const cStyle = getCounterStyle(service, counterObj);
      
      const counterBadgeHtml = counterObj.product ? `
        <span style="font-size: 0.72rem; font-weight: 700; color: ${cStyle.textColor}; background: ${cStyle.color}; padding: 2px 8px; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.15); letter-spacing: 0.3px;">
          ${counterObj.product}
        </span>
      ` : '';

      formHtml += `
        <div class="input-group" style="display: flex; flex-direction: column; gap: 0.35rem;">
          <label style="color: var(--text-main); font-size: 0.85rem; font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
            <span style="display: flex; align-items: center; gap: 0.4rem;">
              ${counterBadgeHtml}
              <span>${counter} (${unit})</span>
            </span>
            <span class="register-ref" style="color: var(--text-muted); font-size: 0.8rem; font-weight: 500;">
              Ref: <strong>${prevVal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${unit}</strong>
            </span>
          </label>
          <div style="position: relative; display: flex; align-items: center;">
            <input type="number" 
                   step="any"
                   class="input input-counter" 
                   data-service="${service.name}" 
                   data-counter="${counter}" 
                   data-prev="${prevVal}" 
                   value="${prevVal > 0 ? prevVal : ''}" 
                   placeholder="${prevVal > 0 ? prevVal : '0.00'}" 
                   style="background: #ffffff; border: 1.5px solid #002B49; border-radius: 8px; padding: 0.8rem; padding-right: 2.5rem; color: var(--text-main); font-size: 1.1rem; font-weight: 700; width: 100%; box-sizing: border-box;" 
                   onfocus="this.select()">
            <span style="position: absolute; right: 0.85rem; color: var(--text-muted); font-weight: 600; font-size: 0.9rem; pointer-events: none;">${unit}</span>
          </div>
        </div>
      `;
    });

    formHtml += `</div></div>`;
  }

  formHtml += `
    <div class="register-footer" style="margin-top: 0.5rem;">
      <button type="submit" id="btnSubmitRegister" class="btn btn-primary" style="width: 100%; padding: 1rem; border-radius: 10px; font-weight: 700; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: #002B49; color: #fff; border: none; box-shadow: 0 4px 12px rgba(0, 43, 73, 0.25);">
        💾 Guardar Lecturas
      </button>
    </div>
  </form>`;

  container.innerHTML = headerHtml + formHtml;

  // Toggle accordion functionality
  const sections = container.querySelectorAll('.register-section');
  sections.forEach(section => {
    const header = section.querySelector('.section-header');
    const content = section.querySelector('.section-content');
    const icon = section.querySelector('.toggle-icon');
    
    header.addEventListener('click', () => {
      const isHidden = content.style.display === 'none';
      content.style.display = isHidden ? 'flex' : 'none';
      icon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(-90deg)';
    });
  });

  // Submit handling
  const form = container.querySelector('#registerForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {};
    const smallerCounters = [];
    const dateInput = container.querySelector('#readingDateTime');
    const selectedDate = dateInput && dateInput.value ? new Date(dateInput.value) : new Date();

    container.querySelectorAll('.input-counter').forEach(input => {
      const s = input.dataset.service;
      const c = input.dataset.counter;
      const prev = parseFloat(input.dataset.prev) || 0;
      const valStr = (input.value !== undefined && input.value !== null ? String(input.value) : '').trim();
      const v = valStr === '' ? prev : (parseFloat(valStr.replace(',', '.')) || 0);

      if (v < prev) {
        smallerCounters.push(`• ${s} (${c}): Nuevo ${v} L < Anterior ${prev} L`);
        input.style.borderColor = 'var(--error)';
      } else {
        input.style.borderColor = '#002B49';
      }

      if (!data[s]) data[s] = {};
      data[s][c] = v;
    });

    if (smallerCounters.length > 0) {
      const proceed = confirm(
        `Aviso: Los siguientes totalizadores tienen un valor menor que la lectura anterior:\n\n` +
        smallerCounters.join('\n') +
        `\n\n¿Deseas guardar estos datos igualmente? (por ejemplo, por reinicio o sustitución de surtidor)`
      );
      if (!proceed) return;
    } else {
      if (!confirm('¿Confirmas guardar el registro de totalizadores de esta noche/día?')) return;
    }

    const submitBtn = container.querySelector('#btnSubmitRegister');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando lecturas...';
      submitBtn.style.opacity = '0.7';
    }

    const readingData = {
      id: (window.crypto && crypto.randomUUID ? crypto.randomUUID() : 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)),
      date: selectedDate.toISOString(),
      data
    };

    try {
      await saveReading(readingData);
      showToast('Lecturas guardadas correctamente', 'success');

      if (isAdmin()) {
        window.location.hash = '#dashboard';
      } else {
        // Pantalla de confirmación para el Operador del punto de venta
        showOperatorConfirmation(container, businessName, selectedDate);
      }
    } catch (err) {
      console.error('Error al guardar lectura:', err);
      showToast(`Error al guardar: ${err.message || 'Error desconocido'}`, 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '💾 Guardar Lecturas';
        submitBtn.style.opacity = '1';
      }
    }
  });

  return container;
}

function showOperatorConfirmation(container, businessName, selectedDate) {
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

      <h2 style="color: #002B49; font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem;">
        ¡Lecturas Guardadas con Éxito!
      </h2>

      <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.5;">
        Los totalizadores de <strong>${businessName}</strong> se han registrado correctamente con fecha:
        <br>
        <span style="display: inline-block; margin-top: 0.4rem; font-weight: 700; color: #002B49; background: #f0f4f8; padding: 4px 12px; border-radius: 8px;">
          📅 ${formatDateTime(selectedDate)}
        </span>
      </p>

      <div style="display: flex; flex-direction: column; gap: 0.8rem; margin-top: 2rem;">
        <button id="btnOperatorLogout" class="btn btn-primary" style="width: 100%; padding: 1rem; border-radius: 10px; font-weight: 700; font-size: 1.05rem; background: #ff6600; color: #fff; border: none; cursor: pointer; box-shadow: 0 4px 12px rgba(255, 102, 0, 0.3);">
          🚪 Finalizar y Cerrar Sesión
        </button>

        <button id="btnOperatorNewReading" class="btn btn-secondary" style="width: 100%; padding: 0.8rem; border-radius: 10px; font-weight: 600; font-size: 0.95rem; background: #ffffff; border: 1px solid var(--border-color); color: var(--text-muted); cursor: pointer;">
          📝 Modificar o registrar otra lectura
        </button>
      </div>
    </div>
  `;

  container.querySelector('#btnOperatorLogout').addEventListener('click', () => {
    logout();
    window.location.hash = '#login';
    window.location.reload();
  });

  container.querySelector('#btnOperatorNewReading').addEventListener('click', () => {
    window.location.reload();
  });
}
