import { createHeader } from '../components/header.js';
import { getLastTwoReadings } from '../db.js';
import { BUSINESSES, getActiveBusiness, getActiveBusinessName, getActiveServices, getCounterStyle } from '../utils/constants.js';
import { formatDateTime } from '../utils/date-helpers.js';
import { isAdmin, getActiveBusinessId, setActiveBusinessId } from '../utils/session.js';

export async function renderDashboard() {
  const container = document.createElement('div');
  container.className = 'page-content dashboard';

  const activeBusiness = getActiveBusiness();
  const activeBusinessId = getActiveBusinessId() || activeBusiness.id;
  const businessName = getActiveBusinessName();
  const headerHtml = createHeader(businessName);
  const servicesDef = getActiveServices();
  const lastTwo = await getLastTwoReadings() || [];
  const currentReading = lastTwo.length > 0 ? lastTwo[0] : null;
  const previousReading = lastTwo.length > 1 ? lastTwo[1] : null;

  let contentHtml = '';

  // Station Banner / Selector
  let businessBannerHtml = '';
  if (isAdmin()) {
    businessBannerHtml = `
      <div style="background: rgba(0, 43, 73, 0.05); border: 1.5px solid rgba(0, 43, 73, 0.15); border-radius: 12px; padding: 0.75rem 1rem; margin-top: 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; gap: 0.8rem; flex-wrap: wrap;">
        <div>
          <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Punto de Venta / Estación</div>
          <select id="adminStationSelect" style="font-size: 1.05rem; font-weight: 800; color: #002B49; border: 1.5px solid #002B49; border-radius: 8px; padding: 5px 10px; background: #ffffff; cursor: pointer; margin-top: 4px;">
            ${BUSINESSES.map(b => `<option value="${b.id}" ${b.id === activeBusinessId ? 'selected' : ''}>${b.name}</option>`).join('')}
          </select>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span style="font-size: 0.75rem; background: #ff6600; color: #fff; padding: 3px 8px; border-radius: 6px; font-weight: 700;">ADMIN</span>
        </div>
      </div>
    `;
  } else {
    businessBannerHtml = `
      <div style="background: rgba(0, 43, 73, 0.05); border: 1px solid rgba(0, 43, 73, 0.15); border-radius: 12px; padding: 0.75rem 1rem; margin-top: 12px; margin-bottom: 12px;">
        <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Punto de Venta</div>
        <div style="font-size: 1.1rem; font-weight: 800; color: #002B49;">${businessName}</div>
      </div>
    `;
  }

  contentHtml += businessBannerHtml;

  if (!currentReading) {
    contentHtml += `
      <div class="empty-state" style="text-align: center; padding: 3rem 1rem; background: #ffffff; border-radius: 16px; border: 1px dashed var(--border-color); margin-top: 1rem;">
        <div class="empty-icon" style="font-size: 3rem; margin-bottom: 1rem;">⛽</div>
        <h3 style="color: var(--text-main); font-size: 1.2rem; margin-bottom: 0.5rem;">No hay lecturas registradas para ${businessName}</h3>
        <p class="empty-subtitle" style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">Registra la primera toma de totalizadores nocturna pulsando el botón +.</p>
        <button onclick="window.location.hash='#register'" class="btn btn-primary" style="padding: 0.8rem 1.5rem; border-radius: 8px; font-weight: 600; background: #002B49; color: #fff; border: none;">
          + Nueva Lectura
        </button>
      </div>
    `;
  } else {
    const curDateStr = formatDateTime(currentReading.date);
    const prevDateStr = previousReading ? formatDateTime(previousReading.date) : 'Lectura inicial base';

    // Calculate total station liters and per-calle totals
    let stationTotalDiff = 0;
    const calleCards = [];

    for (const service of servicesDef) {
      let calleDiffTotal = 0;
      let counterRowsHtml = '';

      service.counters.forEach(counterObj => {
        const counterName = counterObj.short || counterObj.name;
        const unit = counterObj.unit || 'L';
        const val = currentReading?.data?.[service.name]?.[counterName] ?? 0;
        const prevVal = previousReading?.data?.[service.name]?.[counterName] ?? val;
        const diff = previousReading ? (val - prevVal) : 0;
        calleDiffTotal += diff;
        stationTotalDiff += diff;

        const cStyle = getCounterStyle(service, counterObj);

        let diffBadge = '';
        if (previousReading) {
          if (diff > 0) {
            diffBadge = `<span style="color: var(--success); font-size: 0.85rem; background: var(--success-glow); padding: 3px 8px; border-radius: 6px; font-weight: 700;">+${diff.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${unit}</span>`;
          } else if (diff < 0) {
            diffBadge = `<span style="color: var(--error); font-size: 0.85rem; background: var(--error-glow); padding: 3px 8px; border-radius: 6px; font-weight: 700;">-${Math.abs(diff).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${unit}</span>`;
          } else {
            diffBadge = `<span style="color: var(--text-dim); font-size: 0.85rem; font-weight: 600;">0 ${unit}</span>`;
          }
        }

        const counterProductBadge = counterObj.product ? `
          <span style="font-size: 0.72rem; font-weight: 700; color: ${cStyle.textColor}; background: ${cStyle.color}; padding: 2px 7px; border-radius: 6px; margin-right: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.15);">
            ${cStyle.product}
          </span>
        ` : '';

        counterRowsHtml += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.45rem 0; border-bottom: 1px solid var(--border-light);">
            <div style="display: flex; align-items: center;">
              ${counterProductBadge}
              <span style="color: var(--text-muted); font-size: 0.85rem; font-weight: 500;">${counterName}:</span>
              <strong style="color: var(--text-main); font-size: 1rem; margin-left: 0.4rem;">${val.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${unit}</strong>
            </div>
            <div>${diffBadge}</div>
          </div>
        `;
      });

      const calleHeaderBadge = service.product ? `
        <span style="font-size: 0.75rem; font-weight: 700; color: ${service.textColor || '#ffffff'}; background: ${service.color || '#005B8E'}; padding: 3px 10px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.15); letter-spacing: 0.3px;">
          ${service.product}
        </span>
      ` : '';

      calleCards.push(`
        <div class="card" style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 12px; padding: 0.85rem 1rem; box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; border-bottom: 1px solid var(--border-light); padding-bottom: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.2rem;">${service.icon || '⛽'}</span>
              <strong style="color: #002B49; font-size: 1.05rem;">${service.name}</strong>
            </div>
            ${calleHeaderBadge}
          </div>

          <div style="display: flex; flex-direction: column;">
            ${counterRowsHtml}
          </div>

          ${service.counters.length > 1 && previousReading ? `
            <div style="margin-top: 0.6rem; padding-top: 0.5rem; display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: 0.95rem; background: rgba(0, 43, 73, 0.03); padding: 6px 10px; border-radius: 6px;">
              <span style="color: #002B49;">Total ${service.name}:</span>
              <span style="color: #2e7d32; font-size: 1.05rem;">+${calleDiffTotal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} L</span>
            </div>
          ` : ''}
        </div>
      `);
    }

    // Top summary banner with date and station total
    const summaryBanner = `
      <div class="card" style="background: linear-gradient(135deg, #002B49, #004b7c); color: #ffffff; border-radius: 14px; padding: 1.1rem; margin-bottom: 1rem; box-shadow: 0 4px 14px rgba(0, 43, 73, 0.25); border-left: 5px solid #ff6600;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.8rem;">
          <div>
            <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.85;">Última Toma Nocturna</span>
            <div style="font-size: 1.15rem; font-weight: 700; margin-top: 2px;">${curDateStr}</div>
          </div>
          <span style="background: rgba(255,255,255,0.15); padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">
            ${previousReading ? 'Intervalo respecto a toma previa' : 'Lectura inicial'}
          </span>
        </div>

        ${previousReading ? `
          <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 0.8rem; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <span style="font-size: 0.8rem; opacity: 0.85;">Total Suministrado en la Estación</span>
              <div style="font-size: 1.6rem; font-weight: 800; letter-spacing: -0.5px; line-height: 1.2;">
                +${stationTotalDiff.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} <span style="font-size: 1rem; font-weight: 500;">L</span>
              </div>
            </div>
            <div style="text-align: right; font-size: 0.75rem; opacity: 0.8;">
              Ref. anterior:<br>${prevDateStr}
            </div>
          </div>
        ` : `
          <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 0.6rem; font-size: 0.85rem; opacity: 0.9;">
            Lectura base guardada. Las diferencias en litros se calcularán con la siguiente toma nocturna.
          </div>
        `}
      </div>
    `;

    contentHtml += summaryBanner;
    contentHtml += `<h4 style="color: #002B49; font-size: 1rem; margin: 1rem 0 0.5rem; font-weight: 800;">Totales por Calle:</h4>`;
    contentHtml += `<div class="stats-grid" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 90px;">`;
    contentHtml += calleCards.join('');
    contentHtml += `</div>`;
  }

  contentHtml += `
    <button class="btn btn-fab" onclick="window.location.hash='#register'" title="Nueva Lectura" style="position: fixed; bottom: 80px; right: 20px; width: 60px; height: 60px; border-radius: 50%; background: #ff6600; color: #fff; font-size: 2rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(255, 102, 0, 0.4); border: none; cursor: pointer; z-index: 99;">+</button>
  `;

  container.innerHTML = headerHtml + contentHtml;

  // Station switch handler for Admin
  const stationSelect = container.querySelector('#adminStationSelect');
  if (stationSelect) {
    stationSelect.addEventListener('change', (e) => {
      setActiveBusinessId(e.target.value);
      window.location.reload();
    });
  }

  return container;
}
