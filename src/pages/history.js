import { createHeader } from '../components/header.js';
import { getReadings, deleteReading } from '../db.js';
import { BUSINESSES, getActiveBusiness, getActiveBusinessName, getActiveServices, getCounterStyle } from '../utils/constants.js';
import { showToast } from '../components/toast.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDateTime, formatDate } from '../utils/date-helpers.js';
import { exportSingleReadingExcel } from '../utils/excel-generator.js';
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

  const filterHtml = `
    <div class="filters" style="display: flex; gap: 0.5rem; padding: 0.8rem 1rem 0.5rem; overflow-x: auto;">
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

  container.innerHTML = headerHtml + stationSelectorHtml + filterHtml;
  container.appendChild(listContainer);

  const readings = await getReadings();
  const sortedChronological = [...readings].sort((a, b) => new Date(a.date) - new Date(b.date));

  function renderList(filteredReadings) {
    listContainer.innerHTML = '';
    
    if (filteredReadings.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 3rem 1rem; color: var(--text-muted); background: #ffffff; border-radius: 12px; border: 1px dashed var(--border-color);">
          <div class="empty-icon" style="font-size: 3rem; margin-bottom: 0.5rem;">📜</div>
          <p class="empty-subtitle" style="font-weight: 500; font-size: 0.95rem;">No hay registros para ${businessName}</p>
        </div>
      `;
      return;
    }

    filteredReadings.forEach(reading => {
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
        exportSingleReadingExcel(reading, prevReading, servicesDef, businessName);
        showToast('Lectura exportada a Excel', 'success');
      });

      // Single reading PDF export
      const btnPrint = card.querySelector('.btn-print');
      btnPrint.addEventListener('click', (e) => {
        e.stopPropagation();
        exportSingleReadingPdf(reading, prevReading, servicesDef, businessName);
      });

      // Delete reading
      const btnDelete = card.querySelector('.btn-delete');
      btnDelete.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`¿Estás seguro de que deseas eliminar la lectura del ${dateStr}?`)) {
          try {
            await deleteReading(reading.id);
            showToast('Lectura eliminada', 'success');
            // Refresh
            const updated = await getReadings();
            const sorted = [...updated].sort((a, b) => new Date(b.date) - new Date(a.date));
            renderList(sorted);
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

      const filter = e.target.dataset.filter;
      const now = new Date();
      let filtered = [...readings];

      if (filter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(r => new Date(r.date) >= weekAgo);
      } else if (filter === 'month') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = filtered.filter(r => new Date(r.date) >= monthAgo);
      }

      // Newest first
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      renderList(filtered);
    });
  });

  // Initial render: newest first
  const initialSorted = [...readings].sort((a, b) => new Date(b.date) - new Date(a.date));
  renderList(initialSorted);

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

  doc.save(`Lectura_${businessName.replace(/\s+/g, '_')}_${curr.date.slice(0, 10)}.pdf`);
}
