import { createHeader } from '../components/header.js';
import { getReadings } from '../db.js';
import { BUSINESSES, getActiveBusiness, getActiveBusinessName, getActiveServices, getCounterStyle } from '../utils/constants.js';
import { generateExcelReport } from '../utils/excel-generator.js';
import { generateReport as generatePdfReport } from '../utils/pdf-generator.js';
import { formatDate } from '../utils/date-helpers.js';
import { showToast } from '../components/toast.js';
import { isAdmin, getActiveBusinessId, setActiveBusinessId } from '../utils/session.js';

export async function renderReportPage() {
  const container = document.createElement('div');
  container.className = 'page-content report-page';

  const activeBusiness = getActiveBusiness();
  const activeBusinessId = getActiveBusinessId() || activeBusiness.id;
  const businessName = getActiveBusinessName();
  const servicesDef = getActiveServices();
  const headerHtml = createHeader('Informes');

  const readings = await getReadings();
  const sortedAsc = [...readings].sort((a, b) => new Date(a.date) - new Date(b.date));

  let stationSelectorHtml = '';
  if (isAdmin()) {
    stationSelectorHtml = `
      <div style="background: rgba(0, 43, 73, 0.05); border: 1.5px solid rgba(0, 43, 73, 0.15); border-radius: 12px; padding: 0.65rem 1rem; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
        <span style="font-size: 0.8rem; color: #002B49; font-weight: 800; text-transform: uppercase;">Punto de Venta:</span>
        <select id="reportStationSelect" style="font-size: 0.95rem; font-weight: 800; color: #002B49; border: 1.5px solid #002B49; border-radius: 8px; padding: 4px 8px; background: #ffffff; cursor: pointer;">
          ${BUSINESSES.map(b => `<option value="${b.id}" ${b.id === activeBusinessId ? 'selected' : ''}>${b.name}</option>`).join('')}
        </select>
      </div>
    `;
  }

  let contentHtml = `
    <div style="padding: 1rem; padding-bottom: 6rem; display: flex; flex-direction: column; gap: 1rem;">
      ${stationSelectorHtml}

      <div class="card" style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
        <h4 style="margin: 0 0 0.8rem 0; color: #002B49; font-size: 1.05rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>📊</span> Exportar Informe de Suministro (${businessName})
        </h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem; margin-bottom: 1rem;">
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.3rem;">Desde:</label>
            <input type="date" id="reportStartDate" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.95rem; box-sizing: border-box;">
          </div>
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-muted); margin-bottom: 0.3rem;">Hasta:</label>
            <input type="date" id="reportEndDate" style="width: 100%; padding: 0.6rem; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.95rem; box-sizing: border-box;">
          </div>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 0.6rem;">
          <button id="btnGenerateExcel" class="btn btn-primary" style="width: 100%; padding: 0.9rem; border-radius: 8px; font-weight: 700; font-size: 1.05rem; background: #107c41; border: none; color: #fff; display: flex; align-items: center; justify-content: center; gap: 0.6rem; cursor: pointer; box-shadow: 0 3px 10px rgba(16, 124, 65, 0.25);">
            <span style="font-size: 1.2rem;">📗</span> Descargar Informe en Excel (.xlsx)
          </button>
          
          <button id="btnGeneratePdf" class="btn btn-secondary" style="width: 100%; padding: 0.65rem; border-radius: 8px; font-weight: 600; font-size: 0.9rem; background: transparent; border: 1px solid var(--border-color); color: var(--text-muted); display: flex; align-items: center; justify-content: center; gap: 0.4rem; cursor: pointer;">
            <span>📄</span> Opcional: Descargar en PDF
          </button>
        </div>
      </div>

      <div id="reportSummaryPreview"></div>
    </div>
  `;

  container.innerHTML = headerHtml + contentHtml;

  const previewContainer = container.querySelector('#reportSummaryPreview');
  const btnGenerateExcel = container.querySelector('#btnGenerateExcel');
  const btnGeneratePdf = container.querySelector('#btnGeneratePdf');
  const startDateInput = container.querySelector('#reportStartDate');
  const endDateInput = container.querySelector('#reportEndDate');

  // Station switch handler for Admin
  const reportStationSelect = container.querySelector('#reportStationSelect');
  if (reportStationSelect) {
    reportStationSelect.addEventListener('change', (e) => {
      setActiveBusinessId(e.target.value);
      window.location.reload();
    });
  }

  function getFilteredReadings() {
    let filtered = [...sortedAsc];
    const sVal = startDateInput.value;
    const eVal = endDateInput.value;

    if (sVal) {
      const sDate = new Date(sVal);
      sDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(r => new Date(r.date) >= sDate);
    }
    if (eVal) {
      const eDate = new Date(eVal);
      eDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(r => new Date(r.date) <= eDate);
    }
    return { filtered, sVal, eVal };
  }

  function updatePreview() {
    const { filtered } = getFilteredReadings();

    if (filtered.length < 2) {
      previewContainer.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 2.5rem 1rem; background: #ffffff; border-radius: 12px; border: 1px dashed var(--border-color);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">📊</div>
          <p style="color: var(--text-muted); font-size: 0.9rem;">
            ${readings.length < 2 ? `Se necesitan al menos 2 tomas de lecturas para calcular diferencias de litros en ${businessName}.` : 'No hay suficientes tomas en el rango de fechas seleccionado.'}
          </p>
        </div>
      `;
      return;
    }

    const first = filtered[0];
    const last = filtered[filtered.length - 1];
    let totalStationLiters = 0;
    let rowsHtml = '';

    servicesDef.forEach(srv => {
      srv.counters.forEach(cntObj => {
        const cnt = cntObj.short || cntObj.name;
        const initialVal = first.data?.[srv.name]?.[cnt] ?? 0;
        const finalVal = last.data?.[srv.name]?.[cnt] ?? 0;
        const diff = finalVal - initialVal;
        totalStationLiters += diff;

        const cStyle = getCounterStyle(srv, cntObj);
        const counterBadge = cStyle.product ? `
          <span style="font-size: 0.72rem; font-weight: 700; color: ${cStyle.textColor}; background: ${cStyle.color}; padding: 2px 7px; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.15);">
            ${cStyle.product}
          </span>
        ` : '';

        rowsHtml += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0; border-bottom: 1px solid var(--border-light);">
            <div>
              <div style="font-weight: 700; color: var(--text-main); font-size: 0.95rem; display: flex; align-items: center; gap: 0.4rem;">
                <strong style="color: #002B49;">${srv.name}</strong>
                ${counterBadge}
              </div>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">${cnt}: ${initialVal.toLocaleString('es-ES')} L ➔ ${finalVal.toLocaleString('es-ES')} L</div>
            </div>
            <strong style="color: #2e7d32; font-size: 1.05rem;">+${diff.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} L</strong>
          </div>
        `;
      });
    });

    previewContainer.innerHTML = `
      <div class="card" style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
          <h4 style="margin: 0; color: #002B49; font-size: 1rem;">Vista Previa por Calle (${filtered.length} tomas)</h4>
          <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">${formatDate(first.date)} - ${formatDate(last.date)}</span>
        </div>
        <div style="display: flex; flex-direction: column;">
          ${rowsHtml}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding-top: 0.8rem; border-top: 2px solid rgba(0, 43, 73, 0.15);">
          <strong style="color: #002B49; font-size: 1rem;">TOTAL ESTACIÓN:</strong>
          <strong style="color: #002B49; font-size: 1.3rem;">+${totalStationLiters.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} L</strong>
        </div>
      </div>
    `;
  }

  startDateInput.addEventListener('change', updatePreview);
  endDateInput.addEventListener('change', updatePreview);

  btnGenerateExcel.addEventListener('click', () => {
    const { filtered, sVal, eVal } = getFilteredReadings();

    if (filtered.length < 2) {
      showToast('Se necesitan al menos 2 lecturas en el periodo para generar el Excel', 'warning');
      return;
    }

    try {
      generateExcelReport(filtered, sVal ? new Date(sVal) : null, eVal ? new Date(eVal) : null);
      showToast('Informe Excel (.xlsx) generado correctamente', 'success');
    } catch (err) {
      console.error('Error al generar Excel:', err);
      showToast(`Error al generar Excel: ${err.message}`, 'error');
    }
  });

  btnGeneratePdf.addEventListener('click', () => {
    const { filtered, sVal, eVal } = getFilteredReadings();

    if (filtered.length < 2) {
      showToast('Se necesitan al menos 2 lecturas en el periodo', 'warning');
      return;
    }

    try {
      generatePdfReport(filtered, sVal ? new Date(sVal) : null, eVal ? new Date(eVal) : null);
      showToast('Informe PDF generado', 'success');
    } catch (err) {
      console.error('Error al generar PDF:', err);
      showToast(`Error al generar PDF: ${err.message}`, 'error');
    }
  });

  updatePreview();
  return container;
}
