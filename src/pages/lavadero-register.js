import { createHeader } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { getLatestLavaderoReading, saveLavaderoReading } from '../db.js';
import { getActiveLavaderoConfig } from '../utils/constants.js';
import { isOperator } from '../utils/session.js';

export async function renderLavaderoRegisterPage() {
  const container = document.createElement('div');
  container.className = 'page-content register-page';

  const lavaderoConfig = getActiveLavaderoConfig();
  if (!lavaderoConfig) {
    window.location.hash = isOperator() ? '#menu' : '#dashboard';
    return container;
  }

  const headerHtml = createHeader(lavaderoConfig.name || 'Lavadero Klin', true);
  const servicesDef = lavaderoConfig.services || [];
  const latestReading = await getLatestLavaderoReading();

  let formHtml = `
    <div style="padding: 1rem 1rem 0.25rem; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #005B8E 0%, #00838F 100%); color: #ffffff; border-radius: 14px; padding: 1rem 1.2rem; display: flex; align-items: center; gap: 0.9rem; box-shadow: 0 4px 12px rgba(0, 91, 142, 0.18);">
        <div style="font-size: 2rem; background: rgba(255,255,255,0.15); width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
          🚿
        </div>
        <div>
          <h2 style="margin: 0; font-size: 1.15rem; font-weight: 900; letter-spacing: 0.5px;">CONTADORES LAVADERO KLIN</h2>
          <p style="margin: 0.2rem 0 0; font-size: 0.82rem; opacity: 0.9;">Introduce la lectura actual de Túnel, Boxes y Aspiradores</p>
        </div>
      </div>
    </div>
    <form id="lavaderoRegisterForm" novalidate style="padding: 1rem; padding-bottom: 5rem; max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem;">
  `;

  for (const service of servicesDef) {
    const accentColor = service.color || '#00BCD4';
    formHtml += `
      <div class="register-section card" style="background: #ffffff; border: 2px solid rgba(0, 91, 142, 0.15); border-radius: 14px; overflow: hidden; box-shadow: 0 3px 10px rgba(0,0,0,0.04);">
        <div class="section-header" style="padding: 0.9rem 1rem; display: flex; justify-content: space-between; align-items: center; background: rgba(0, 188, 212, 0.08); border-bottom: 1px solid rgba(0, 91, 142, 0.1); cursor: pointer;">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span style="font-size: 1.3rem;">${service.icon}</span>
            <h3 style="margin: 0; font-size: 1rem; color: #002B49; font-weight: 800;">${service.name}</h3>
          </div>
          <span class="toggle-icon" style="color: #005B8E; font-weight: bold; transition: transform 0.3s;">▼</span>
        </div>
        <div class="section-content" style="padding: 1rem; display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.9rem;">
    `;

    service.counters.forEach(counterObj => {
      const counter = counterObj.short;
      const prevVal = latestReading?.data?.[service.name]?.[counter] ?? 0;
      formHtml += `
        <div class="input-group" style="display: flex; flex-direction: column; gap: 0.45rem;">
          <label style="color: #002B49; font-size: 0.85rem; font-weight: 800; display: flex; justify-content: space-between; align-items: center;">
            <span style="background: ${accentColor}22; color: #002B49; border-left: 3px solid ${accentColor}; padding: 2px 6px; border-radius: 4px;">${counter}</span>
            <span class="register-ref" style="color: #005B8E; font-size: 0.75rem; font-weight: 700;">Ref: ${prevVal}</span>
          </label>
          <input type="number" 
                 step="any"
                 inputmode="decimal"
                 class="input input-lavadero-counter" 
                 data-service="${service.name}" 
                 data-counter="${counter}" 
                 data-prev="${prevVal}" 
                 value="${prevVal}" 
                 placeholder="${prevVal}" 
                 style="background: #f8fafc; border: 1.5px solid #005B8E; border-radius: 8px; padding: 0.75rem; color: #002B49; font-size: 1.05rem; font-weight: 800; width: 100%; box-sizing: border-box;" 
                 onfocus="this.select()">
        </div>
      `;
    });

    formHtml += `</div></div>`;
  }

  formHtml += `
    <div class="register-footer" style="margin-top: 0.5rem;">
      <button type="submit" id="btnSubmitLavadero" class="btn-primary" style="width: 100%; padding: 1rem; border-radius: 10px; background: #00BCD4; color: #002B49; font-weight: 900; border: none; font-size: 1.1rem; cursor: pointer; box-shadow: 0 4px 12px rgba(0, 188, 212, 0.3);">
        💾 Guardar Contadores Lavadero
      </button>
    </div>
  </form>`;

  container.innerHTML = headerHtml + formHtml;

  // Toggle functionality
  const sections = container.querySelectorAll('.register-section');
  sections.forEach(section => {
    const header = section.querySelector('.section-header');
    const content = section.querySelector('.section-content');
    const icon = section.querySelector('.toggle-icon');

    header.addEventListener('click', () => {
      const isHidden = content.style.display === 'none';
      content.style.display = isHidden ? 'grid' : 'none';
      icon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(-90deg)';
    });
  });

  // Submit handling
  const form = container.querySelector('#lavaderoRegisterForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {};
    const smallerCounters = [];

    container.querySelectorAll('.input-lavadero-counter').forEach(input => {
      const s = input.dataset.service;
      const c = input.dataset.counter;
      const prev = parseFloat(input.dataset.prev) || 0;
      const valStr = (input.value !== undefined && input.value !== null ? String(input.value) : '').trim();
      const v = valStr === '' ? prev : (parseFloat(valStr.replace(',', '.')) || 0);

      if (v < prev) {
        smallerCounters.push(`${s} - ${c} (nuevo: ${v}, anterior: ${prev})`);
        input.style.borderColor = '#F44336';
      } else {
        input.style.borderColor = '#005B8E';
      }

      if (!data[s]) data[s] = {};
      data[s][c] = v;
    });

    if (smallerCounters.length > 0) {
      const proceed = confirm(
        `Aviso: Los siguientes contadores tienen un valor menor que la lectura anterior:\n\n` +
        smallerCounters.join('\n') +
        `\n\n¿Deseas guardar estos datos igualmente? (por ejemplo, por reinicio o cambio de contador)`
      );
      if (!proceed) return;
    } else {
      if (!confirm('¿Guardar este registro de contadores del Lavadero Klin?')) return;
    }

    const submitBtn = container.querySelector('#btnSubmitLavadero');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando...';
      submitBtn.style.opacity = '0.7';
    }

    const readingData = {
      id: (window.crypto && crypto.randomUUID ? crypto.randomUUID() : 'rec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)),
      date: new Date().toISOString(),
      data
    };

    try {
      await saveLavaderoReading(readingData);
      showToast('Contadores de Lavadero Klin guardados correctamente', 'success');
      window.location.hash = isOperator() ? '#menu' : '#dashboard';
    } catch (err) {
      console.error('Error al guardar registro de lavadero:', err);
      showToast(`Error al guardar: ${err.message || 'Error desconocido'}`, 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '💾 Guardar Contadores Lavadero';
        submitBtn.style.opacity = '1';
      }
    }
  });

  return container;
}
