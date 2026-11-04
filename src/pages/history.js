import { createHeader } from '../components/header.js';
import { getReadings, deleteReading, getGasReadings, deleteGasReading } from '../db.js';
import { BUSINESSES, getActiveBusiness, getActiveBusinessName, getActiveServices, getCounterStyle } from '../utils/constants.js';
import { showToast } from '../components/toast.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDateTime, formatDate } from '../utils/date-helpers.js';
import { exportSingleReadingExcel, exportSingleGasReadingExcel } from '../utils/excel-generator.js';
import { isAdmin, getActiveBusinessId, setActiveBusinessId } from '../utils/session.js';

function calculateReadingLitres(curr, prev, servicesDef) {
  if (!curr) return null;
  let stationTotal = 0;
  const calleBreakdown = {};
  const currData = curr.data || {};
  const prevData = prev?.data || {};

  for (const srv of servicesDef) {
    let calleTotal = 0;
    calleBreakdown[srv.name] = {
      product: srv.product || '',
      color: srv.color || '#005B8E',
      textColor: srv.textColor || '#ffffff',
      icon: srv.icon || '⛽',
      counters: {}
    };

    srv.counters.forEach(cntObj => {
      const cnt = cntObj.short || cntObj.name;
      const unit = cntObj.unit || 'L';
      const currVal = currData[srv.name]?.[cnt] ?? 0;
      const prevVal = prev ? (prevData[srv.name]?.[cnt] ?? currVal) : currVal;
      const diff = prev ? (currVal - prevVal) : 0;
      calleTotal += diff;
      stationTotal += diff;

      const cStyle = getCounterStyle(srv, cntObj);

      calleBreakdown[srv.name].counters[cnt] = {
        val: currVal,
        prevVal,
        diff,
        unit,
        product: cntObj.product || '',
        color: cStyle.color,
        textColor: cStyle.textColor
      };
    });

    calleBreakdown[srv.name].calleTotal = calleTotal;
  }

  return { stationTotal, calleBreakdown };
}

export async function renderHistoryPage() {
  const container = document.createElement('div');
  container.className = 'page-content history-page';

  const activeBusiness = getActiveBusiness();
  const activeBusinessId = getActiveBusinessId() || activeBusiness.id;
  const businessName = getActiveBusinessName();
  const servicesDef = getActiveServices();
  const headerHtml = createHeader('Historial');
  
  let stationSelectorHtml = '';
  if (isAdmin()) {
    stationSelectorHtml = `
      <div style="background: rgba(0, 43, 73, 0.05); border: 1.5px solid rgba(0, 43, 73, 0.15); border-radius: 12px; padding: 0.65rem 1rem; margin: 0.8rem 1rem 0; display: flex; justify-content: space-between; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
        <span style="font-size: 0.8rem; color: #002B49; font-weight: 800; text-transform: uppercase;">Punto de Venta:</span>
        <select id="historyStationSelect" style="font-size: 0.95rem; font-weight: 800; color: #002B49; border: 1.5px solid #002B49; border-radius: 8px; padding: 4px 8px; background: #ffffff; cursor: pointer;">
          ${BUSINESSES.map(b => `<option value="${b.id}" ${b.id === activeBusinessId ? 'selected' : ''}>${b.name}</option>`).join('')}
        </select>
      </div>
    `;
  }

  const tabsHtml = `
    <div class="history-type-tabs" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; padding: 0.8rem 1rem 0.2rem;">
      <button id="btnTabFuel" class="btn" style="padding: 0.75rem; border-radius: 10px; font-weight: 800; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: #002B49; color: #ffffff; border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
        <span>⛽</span> Surtidores
      </button>
      <button id="btnTabGas" class="btn" style="padding: 0.75rem; border-radius: 10px; font-weight: 800; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: #ffffff; color: var(--text-muted); border: 1.5px solid var(--border-color);">
        <img src="/images/butano.png" alt="Bombonas" style="height: 20px; width: auto;"> Bombonas
      </button>
    </div>
  `;

  const filterHtml = `
    <div class="filters" style="display: flex; gap: 0.5rem; padding: 0.6rem 1rem 0.5rem; overflow-x: auto;">
      <button class="filter-btn active" data-filter="all" style="background: rgba(0, 43, 73, 0.1); color: #002B49; border: 1.5px solid #002B49; padding: 0.45rem 0.9rem; border-radius: 20px; white-space: nowrap; cursor: pointer; font-weight: 700;">Todo</button>
      <button class="filter-btn" data-filter="week" style="background: #ffffff; color: var(--text-muted); border: 1px solid var(--border-color); padding: 0.45rem 0.9rem; border-radius: 20px; white-space: nowrap; cursor: pointer; font-weight: 500;">Esta semana</button>
      <button class="filter-btn" data-filter="month" style="background: #ffffff; color: var(--text-muted); border: 1px solid var(--border-color); padding: 0.45rem 0.9rem; border-radius: 20px; white-space: nowrap; cursor: pointer; font-weight: 500;">Este mes</button>
    </div>
  `;

  const listContainer = document.createElement('div');
  listContainer.className = 'history-list';
  listContainer.style.padding = '0.5rem 1rem 6rem 1rem';
  listContainer.style.display = 'flex';
  listContainer.style.flexDirection = 'column';
  listContainer.style.gap = '1rem';

  container.innerHTML = headerHtml + stationSelectorHtml + tabsHtml + filterHtml;
  container.appendChild(listContainer);

  let currentTab = 'fuel'; // 'fuel' | 'gas'
  let currentFilter = 'all';

  let fuelReadings = await getReadings();
  let gasReadings = await getGasReadings();

  function applyFilter(list) {
    const now = new Date();
    if (currentFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return list.filter(r => new Date(r.date) >= weekAgo);
    } else if (currentFilter === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
      return list.filter(r => new Date(r.date) >= monthAgo);
    }
    return [...list];
  }

  function renderFuelList() {
    listContainer.innerHTML = '';
    const sortedChronological = [...fuelReadings].sort((a, b) => new Date(a.date) - new Date(b.date));
    let filtered = applyFilter(fuelReadings);
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 3rem 1rem; color: var(--text-muted); background: #ffffff; border-radius: 12px; border: 1px dashed var(--border-color);">
          <div class="empty-icon" style="font-size: 3rem; margin-bottom: 0.5rem;">📜</div>
          <p class="empty-subtitle" style="font-weight: 500; font-size: 0.95rem;">No hay registros de surtidores para ${businessName}</p>
        </div>
      `;
      return;
    }

    filtered.forEach(reading => {
      const currIdx = sortedChronological.findIndex(r => r.id === reading.id);
      const prevReading = currIdx > 0 ? sortedChronological[currIdx - 1] : null;
      const calc = calculateReadingLitres(reading, prevReading, servicesDef);
      const dateStr = formatDateTime(reading.date);

      const card = document.createElement('div');
      card.className = 'card history-card';
      card.style.background = '#ffffff';
      card.style.borderRadius = '12px';
      card.style.border = '1px solid var(--border-color)';
      card.style.overflow = 'hidden';
      card.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)';

      let callesRowsHtml = '';
      if (calc) {
        for (const [calleName, data] of Object.entries(calc.calleBreakdown)) {
          let cntDetails = '';
          for (const [cntName, cData] of Object.entries(data.counters)) {
            const diffHtml = prevReading
              ? `<span style="color: ${cData.diff >= 0 ? 'var(--success)' : 'var(--error)'}; font-weight: 700; font-size: 0.9rem;">
                  ${cData.diff >= 0 ? '+' : ''}${cData.diff.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${cData.unit}
                </span>`
              : `<span style="color: var(--text-muted); font-size: 0.8rem;">Base inicial</span>`;

            const counterBadgeHtml = cData.product ? `
              <span style="font-size: 0.72rem; font-weight: 700; color: ${cData.textColor}; background: ${cData.color}; padding: 2px 7px; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.15); margin-right: 5px;">
                ${cData.product}
              </span>
            ` : '';

            cntDetails += `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.35rem 0; font-size: 0.9rem; border-bottom: 1px solid var(--border-light);">
                <div style="display: flex; align-items: center;">
                  ${counterBadgeHtml}
                  <span style="color: var(--text-muted);">${cntName}: <strong style="color: var(--text-main);">${cData.val.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${cData.unit}</strong></span>
                </div>
                <div>${diffHtml}</div>
              </div>
            `;
          }

          const calleBadgeHtml = data.product ? `
            <span style="font-size: 0.72rem; font-weight: 700; color: ${data.textColor || '#ffffff'}; background: ${data.color}; padding: 3px 8px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.15); letter-spacing: 0.3px;">
              ${data.product}
            </span>
          ` : '';

          callesRowsHtml += `
            <div style="background: rgba(0, 50, 80, 0.02); border: 1px solid var(--border-light); border-radius: 8px; padding: 0.65rem 0.85rem; margin-bottom: 0.6rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                <div style="display: flex; align-items: center; gap: 0.4rem;">
                  <span>${data.icon}</span>
                  <strong style="color: #002B49; font-size: 0.95rem;">${calleName}</strong>
                </div>
                ${calleBadgeHtml}
              </div>
              <div>${cntDetails}</div>
              ${Object.keys(data.counters).length > 1 && prevReading ? `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.4rem; padding-top: 0.35rem; font-weight: 800; font-size: 0.85rem; color: #002B49;">
                  <span>Total ${calleName}:</span>
                  <span style="color: #2e7d32;">+${data.calleTotal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} L</span>
                </div>
              ` : ''}
            </div>
          `;
        }
      }

      card.innerHTML = `
        <div class="history-card-header" style="padding: 1rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; background: #ffffff;">
          <div>
            <div style="font-weight: 800; color: #002B49; font-size: 1.05rem;">📅 ${dateStr}</div>
            <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 2px;">
              ${prevReading ? `Total estación: +${calc.stationTotal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} L` : 'Lectura inicial de referencia'}
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            ${prevReading ? `
              <span style="background: var(--success-glow); color: var(--success); font-weight: 800; font-size: 0.85rem; padding: 4px 8px; border-radius: 6px;">
                +${calc.stationTotal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} L
              </span>
            ` : ''}
            <span class="chevron" style="color: var(--text-muted); font-size: 0.85rem; transition: transform 0.2s;">▼</span>
          </div>
        </div>

        <div class="history-card-body" style="display: none; padding: 1rem; border-top: 1px solid var(--border-light); background: #fafbfc;">
          <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem; letter-spacing: 0.5px;">
            Desglose por Calle (${businessName})
          </div>
          ${callesRowsHtml}

          <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid var(--border-light);">
            <button class="btn btn-secondary btn-excel" style="padding: 0.5rem 0.8rem; font-size: 0.85rem; border-radius: 6px; font-weight: 700; background: #e8f5e9; color: #107c41; border: 1px solid #a5d6a7; cursor: pointer; display: flex; align-items: center; gap: 4px;">
              📗 Excel
            </button>
            <button class="btn btn-secondary btn-print" style="padding: 0.5rem 0.8rem; font-size: 0.85rem; border-radius: 6px; font-weight: 600; cursor: pointer;">
              📄 PDF
            </button>
            <button class="btn btn-danger btn-delete" style="padding: 0.5rem 0.8rem; font-size: 0.85rem; border-radius: 6px; font-weight: 600; background: var(--error-glow); color: var(--error); border: 1px solid var(--error); cursor: pointer;">
              🗑️ Eliminar
            </button>
          </div>
        </div>
      `;

      // Accordion toggle
      const header = card.querySelector('.history-card-header');
      const body = card.querySelector('.history-card-body');
      const chevron = card.querySelector('.chevron');
      header.addEventListener('click', () => {
        const isOpen = body.style.display !== 'none';
        body.style.display = isOpen ? 'none' : 'block';
        chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
      });

      // Single reading Excel export
      const btnExcel = card.querySelector('.btn-excel');
      btnExcel.addEventListener('click', (e) => {
        e.stopPropagation();
        try {
          exportSingleReadingExcel(reading, prevReading, servicesDef, businessName);
          showToast('Lectura exportada a Excel', 'success');
        } catch (err) {
          console.error('Error exportando Excel:', err);
          showToast(`Error al exportar Excel: ${err.message}`, 'error');
        }
      });

      // Single reading PDF export
      const btnPrint = card.querySelector('.btn-print');
      btnPrint.addEventListener('click', (e) => {
        e.stopPropagation();
        try {
          exportSingleReadingPdf(reading, prevReading, servicesDef, businessName);
          showToast('Lectura exportada a PDF', 'success');
        } catch (err) {
          console.error('Error exportando PDF:', err);
          showToast(`Error al exportar PDF: ${err.message}`, 'error');
        }
      });

      // Delete reading
      const btnDelete = card.querySelector('.btn-delete');
      btnDelete.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`¿Estás seguro de que deseas eliminar la lectura del ${dateStr}?`)) {
          try {
            await deleteReading(reading.id);
            showToast('Lectura eliminada', 'success');
            fuelReadings = await getReadings();
            renderFuelList();
          } catch (err) {
            showToast('Error al eliminar', 'error');
          }
        }
      });

      listContainer.appendChild(card);
    });
  }

  function renderGasList() {
    listContainer.innerHTML = '';
    let filtered = applyFilter(gasReadings);
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 3rem 1rem; color: var(--text-muted); background: #ffffff; border-radius: 12px; border: 1px dashed var(--border-color);">
          <div class="empty-icon" style="font-size: 3rem; margin-bottom: 0.5rem;">🟡</div>
          <p class="empty-subtitle" style="font-weight: 500; font-size: 0.95rem;">No hay conteos de bombonas registrados para ${businessName}</p>
          <button onclick="window.location.hash='#gas-register'" class="btn btn-primary" style="margin-top: 1rem; padding: 0.7rem 1.2rem; border-radius: 8px; font-weight: 700; background: #ff6600; color: #fff; border: none; cursor: pointer;">
            + Nuevo Conteo
          </button>
        </div>
      `;
      return;
    }

    filtered.forEach(reading => {
      const dateStr = formatDateTime(reading.date);
      const b = reading.data?.butano || { llenas: 0, vacias: 0, huecos: 0, total: 0 };
      const p = reading.data?.propano || { llenas: 0, vacias: 0, huecos: 0, total: 0 };

      const card = document.createElement('div');
      card.className = 'card history-card';
      card.style.background = '#ffffff';
      card.style.borderRadius = '12px';
      card.style.border = '1px solid var(--border-color)';
      card.style.overflow = 'hidden';
      card.style.boxShadow = '0 2px 6px rgba(0,0,0,0.03)';

      card.innerHTML = `
        <div class="history-card-header" style="padding: 1rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; background: #ffffff;">
          <div>
            <div style="font-weight: 800; color: #002B49; font-size: 1.05rem;">📅 ${dateStr}</div>
            <div style="color: var(--text-muted); font-size: 0.8rem; margin-top: 2px;">
              Butano: <strong>${b.total}</strong> | Propano: <strong>${p.total}</strong> botellas
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="background: rgba(255, 102, 0, 0.1); color: #e65100; font-weight: 800; font-size: 0.85rem; padding: 4px 8px; border-radius: 6px;">
              ${b.total + p.total} botellas
            </span>
            <span class="chevron" style="color: var(--text-muted); font-size: 0.85rem; transition: transform 0.2s;">▼</span>
          </div>
        </div>

        <div class="history-card-body" style="display: none; padding: 1rem; border-top: 1px solid var(--border-light); background: #fafbfc;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem;">
            <div style="background: #fff8f2; border: 1px solid rgba(255, 102, 0, 0.2); border-radius: 10px; padding: 0.7rem 0.85rem;">
              <div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 6px;">
                <img src="/images/butano.png" alt="Butano" style="height: 24px; width: auto;">
                <strong style="color: #002B49; font-size: 0.9rem;">Butano</strong>
              </div>
              <div style="font-size: 0.82rem; color: #2e7d32; font-weight: 700;">🟢 ${b.llenas} Llenas</div>
              <div style="font-size: 0.82rem; color: #0277bd; font-weight: 600;">⚪ ${b.vacias} Vacías</div>
              <div style="font-size: 0.82rem; color: #c62828; font-weight: 600;">🔴 ${b.huecos} Huecos</div>
              <div style="font-size: 0.82rem; color: #002B49; font-weight: 800; margin-top: 4px; border-top: 1px dashed rgba(0,0,0,0.1); padding-top: 4px;">
                Total: ${b.total} ${b.capacity ? `(Cap. ${b.capacity})` : ''}
              </div>
            </div>

            <div style="background: #f0f7ff; border: 1px solid rgba(0, 91, 142, 0.2); border-radius: 10px; padding: 0.7rem 0.85rem;">
              <div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 6px;">
                <img src="/images/propano.png" alt="Propano" style="height: 24px; width: auto;">
                <strong style="color: #002B49; font-size: 0.9rem;">Propano</strong>
              </div>
              <div style="font-size: 0.82rem; color: #2e7d32; font-weight: 700;">🟢 ${p.llenas} Llenas</div>
              <div style="font-size: 0.82rem; color: #0277bd; font-weight: 600;">⚪ ${p.vacias} Vacías</div>
              <div style="font-size: 0.82rem; color: #c62828; font-weight: 600;">🔴 ${p.huecos} Huecos</div>
              <div style="font-size: 0.82rem; color: #002B49; font-weight: 800; margin-top: 4px; border-top: 1px dashed rgba(0,0,0,0.1); padding-top: 4px;">
                Total: ${p.total} ${p.capacity ? `(Cap. ${p.capacity})` : ''}
              </div>
            </div>
          </div>

          ${reading.notes ? `
            <div style="font-size: 0.85rem; color: var(--text-muted); background: #ffffff; padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid var(--border-light); margin-bottom: 0.75rem;">
              <strong>Observaciones:</strong> ${reading.notes}
            </div>
          ` : ''}

          <div style="display: flex; gap: 0.5rem; justify-content: flex-end; padding-top: 0.5rem; border-top: 1px solid var(--border-light);">
            <button class="btn btn-secondary btn-gas-excel" style="padding: 0.5rem 0.8rem; font-size: 0.85rem; border-radius: 6px; font-weight: 700; background: #e8f5e9; color: #107c41; border: 1px solid #a5d6a7; cursor: pointer; display: flex; align-items: center; gap: 4px;">
              📗 Excel
            </button>
            <button class="btn btn-danger btn-gas-delete" style="padding: 0.5rem 0.8rem; font-size: 0.85rem; border-radius: 6px; font-weight: 600; background: var(--error-glow); color: var(--error); border: 1px solid var(--error); cursor: pointer;">
              🗑️ Eliminar
            </button>
          </div>
        </div>
      `;

      // Accordion
      const header = card.querySelector('.history-card-header');
      const body = card.querySelector('.history-card-body');
      const chevron = card.querySelector('.chevron');
      header.addEventListener('click', () => {
        const isOpen = body.style.display !== 'none';
        body.style.display = isOpen ? 'none' : 'block';
        chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
      });

      // Excel export
      card.querySelector('.btn-gas-excel').addEventListener('click', (e) => {
        e.stopPropagation();
        try {
          exportSingleGasReadingExcel(reading, businessName);
          showToast('Conteo exportado a Excel', 'success');
        } catch (err) {
          console.error(err);
          showToast(`Error al exportar: ${err.message}`, 'error');
        }
      });

      // Delete
      card.querySelector('.btn-gas-delete').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`¿Estás seguro de que deseas eliminar este conteo de bombonas del ${dateStr}?`)) {
          try {
            await deleteGasReading(reading.id);
            showToast('Conteo eliminado', 'success');
            gasReadings = await getGasReadings();
            renderGasList();
          } catch (err) {
            showToast('Error al eliminar', 'error');
          }
        }
      });

      listContainer.appendChild(card);
    });
  }

  // Station switch handler for Admin
  const historyStationSelect = container.querySelector('#historyStationSelect');
  if (historyStationSelect) {
    historyStationSelect.addEventListener('change', (e) => {
      setActiveBusinessId(e.target.value);
      window.location.reload();
    });
  }

  // TAB SWITCH HANDLERS
  const btnTabFuel = container.querySelector('#btnTabFuel');
  const btnTabGas = container.querySelector('#btnTabGas');

  btnTabFuel.addEventListener('click', () => {
    currentTab = 'fuel';
    btnTabFuel.style.background = '#002B49';
    btnTabFuel.style.color = '#ffffff';
    btnTabFuel.style.border = 'none';
    btnTabFuel.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';

    btnTabGas.style.background = '#ffffff';
    btnTabGas.style.color = 'var(--text-muted)';
    btnTabGas.style.border = '1.5px solid var(--border-color)';
    btnTabGas.style.boxShadow = 'none';

    renderFuelList();
  });

  btnTabGas.addEventListener('click', () => {
    currentTab = 'gas';
    btnTabGas.style.background = '#002B49';
    btnTabGas.style.color = '#ffffff';
    btnTabGas.style.border = 'none';
    btnTabGas.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';

    btnTabFuel.style.background = '#ffffff';
    btnTabFuel.style.color = 'var(--text-muted)';
    btnTabFuel.style.border = '1.5px solid var(--border-color)';
    btnTabFuel.style.boxShadow = 'none';

    renderGasList();
  });

  // Filter handlers
  container.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      container.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('active');
        b.style.background = '#ffffff';
        b.style.color = 'var(--text-muted)';
        b.style.borderColor = 'var(--border-color)';
      });
      e.target.classList.add('active');
      e.target.style.background = 'rgba(0, 43, 73, 0.1)';
      e.target.style.color = '#002B49';
      e.target.style.borderColor = '#002B49';

      currentFilter = e.target.dataset.filter;
      if (currentTab === 'fuel') {
        renderFuelList();
      } else {
        renderGasList();
      }
    });
  });

  // Initial render: fuel list
  renderFuelList();

  return container;
}

function exportSingleReadingPdf(curr, prev, servicesDef, businessName) {
  const doc = new jsPDF('portrait');
  const dateStr = formatDateTime(curr.date);
  const prevDateStr = prev ? formatDateTime(prev.date) : 'N/A (Lectura inicial)';

  // Header banner
  doc.setFillColor(0, 43, 73);
  doc.rect(0, 0, doc.internal.pageSize.width, 28, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`REPSOL - ${businessName}`, 14, 14);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha toma: ${dateStr} | Ref. anterior: ${prevDateStr}`, 14, 22);

  const tableRows = [];
  let totalStationLiters = 0;

  servicesDef.forEach(srv => {
    srv.counters.forEach(cntObj => {
      const cnt = cntObj.short || cntObj.name;
      const currVal = curr.data?.[srv.name]?.[cnt] ?? 0;
      const prevVal = prev ? (prev.data?.[srv.name]?.[cnt] ?? currVal) : currVal;
      const diff = prev ? (currVal - prevVal) : 0;
      totalStationLiters += diff;

      tableRows.push([
        srv.name,
        cntObj.product || srv.product || '',
        cnt,
        prev ? `${prevVal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} L` : '-',
        `${currVal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} L`,
        prev ? `+${diff.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} L` : 'Base inicial'
      ]);
    });
  });

  autoTable(doc, {
    startY: 34,
    head: [['Calle', 'Producto', 'Totalizador', 'Lectura Anterior', 'Lectura Actual', 'Litros Suministrados']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [0, 43, 73], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 },
    alternateRowStyles: { fillColor: [245, 248, 252] }
  });

  if (prev) {
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 43, 73);
    doc.text(`TOTAL SUMINISTRADO EN LA ESTACIÓN: +${totalStationLiters.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} L`, 14, finalY);
  }

  const dateObj = curr.date instanceof Date ? curr.date : new Date(curr.date);
  const fileDate = !isNaN(dateObj.getTime()) ? dateObj.toISOString().slice(0, 10) : 'fecha';
  doc.save(`Lectura_${businessName.replace(/\s+/g, '_')}_${fileDate}.pdf`);
}
