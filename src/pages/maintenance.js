import { createHeader } from '../components/header.js';
import { getCuadresCombustible } from '../db.js';
import { BUSINESSES, getActiveBusiness, getActiveBusinessName } from '../utils/constants.js';
import { isAdmin, getActiveBusinessId, setActiveBusinessId } from '../utils/session.js';
import { formatDateTime } from '../utils/date-helpers.js';
import { showToast } from '../components/toast.js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function renderMaintenancePage() {
  const container = document.createElement('div');
  container.className = 'page-content maintenance-page';

  if (!isAdmin()) {
    window.location.hash = '#menu';
    return container;
  }

  const activeBusiness = getActiveBusiness();
  const activeBusinessId = getActiveBusinessId() || activeBusiness.id;
  const businessName = getActiveBusinessName();
  const headerHtml = createHeader('Control Descuadres');

  const stationSelectorHtml = `
    <div style="background: rgba(0, 43, 73, 0.05); border: 1.5px solid rgba(0, 43, 73, 0.15); border-radius: 12px; padding: 0.75rem 1rem; margin: 12px 1rem 0.5rem; display: flex; justify-content: space-between; align-items: center; gap: 0.8rem; flex-wrap: wrap;">
      <div>
        <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Estación a inspeccionar</div>
        <select id="maintStationSelect" style="font-size: 1rem; font-weight: 800; color: #002B49; border: 1.5px solid #002B49; border-radius: 8px; padding: 5px 10px; background: #ffffff; cursor: pointer; margin-top: 4px;">
          ${BUSINESSES.map(b => `<option value="${b.id}" ${b.id === activeBusinessId ? 'selected' : ''}>${b.name}</option>`).join('')}
        </select>
      </div>
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <button id="btnMaintPdf" style="background: #002B49; color: #fff; border: none; border-radius: 8px; padding: 7px 12px; font-size: 0.8rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
          📄 PDF Mantenimiento
        </button>
      </div>
    </div>
  `;

  const cuadres = await getCuadresCombustible(activeBusinessId);
  // Ordenar cronológicamente (antiguo -> reciente) para calcular rachas consecutivas
  const sortedAsc = [...cuadres].sort((a, b) => new Date(a.date) - new Date(b.date));

  let bodyHtml = '';
  let statsPorManguera = [];

  if (sortedAsc.length === 0) {
    bodyHtml = `
      <div style="padding: 1rem;">
        <div class="card" style="text-align: center; padding: 2.5rem 1.25rem; background: #ffffff; border: 1.5px dashed var(--border-color); border-radius: 16px;">
          <div style="font-size: 2.8rem; margin-bottom: 0.75rem;">🔧</div>
          <h3 style="margin: 0 0 0.5rem; color: #002B49; font-size: 1.1rem;">Sin cuadres registrados todavía para ${businessName}</h3>
          <p style="margin: 0; color: var(--text-muted); font-size: 0.88rem; line-height: 1.45;">
            A partir de la próxima ejecución de <strong>CuadreCombustibleMagon</strong> (manual o automática a las 10:05), cada comprobación se guardará aquí automáticamente para detectar posibles averías o descuadres continuados.
          </p>
        </div>
      </div>
    `;
  } else {
    // Agrupar historial por calle + producto
    const mapMangueras = new Map();

    for (const c of sortedAsc) {
      const mList = Array.isArray(c.mangueras) ? c.mangueras : [];
      for (const m of mList) {
        const key = m.key || `${m.calle}_${m.producto}`;
        if (!mapMangueras.has(key)) {
          mapMangueras.set(key, {
            key,
            calle: m.calle,
            producto: m.producto,
            registros: []
          });
        }
        mapMangueras.get(key).registros.push({
          date: c.date,
          periodo: c.periodo || formatDateTime(c.date),
          litrosApp: Number(m.litrosApp) || 0,
          litrosMagon: Number(m.litrosMagon) || 0,
          dif: Number(m.dif) || 0,
          difAyer: Number(m.difAyer) || 0,
          difNeto: Number(m.difNeto) ?? Number(m.dif) ?? 0,
          estado: m.estado || 'ok'
        });
      }
    }

    statsPorManguera = Array.from(mapMangueras.values()).map(item => {
      // Calcular racha actual de descuadres consecutivos no compensados (de más reciente hacia atrás)
      let rachaActual = 0;
      for (let i = item.registros.length - 1; i >= 0; i--) {
        if (item.registros[i].estado === 'descuadre') {
          rachaActual++;
        } else {
          break;
        }
      }

      let totalDescuadres = 0;
      let totalCompensados = 0;
      let acumuladoDesvio = 0;

      for (const r of item.registros) {
        if (r.estado === 'descuadre') {
          totalDescuadres++;
          acumuladoDesvio += r.dif;
        } else if (r.estado === 'compensado') {
          totalCompensados++;
        }
      }

      const ultimo = item.registros[item.registros.length - 1];
      return {
        ...item,
        rachaActual,
        totalDescuadres,
        totalCompensados,
        acumuladoDesvio,
        ultimo
      };
    });

    // Ordenar: primero las que tienen racha de descuadre >= 2, luego racha == 1, luego por calle
    statsPorManguera.sort((a, b) => {
      if (b.rachaActual !== a.rachaActual) return b.rachaActual - a.rachaActual;
      if (b.totalDescuadres !== a.totalDescuadres) return b.totalDescuadres - a.totalDescuadres;
      const numA = parseInt((a.calle || '').replace(/\D/g, ''), 10) || 0;
      const numB = parseInt((b.calle || '').replace(/\D/g, ''), 10) || 0;
      return numA - numB || a.producto.localeCompare(b.producto);
    });

    const alertas = statsPorManguera.filter(m => m.rachaActual >= 2);
    const puntuales = statsPorManguera.filter(m => m.rachaActual === 1);

    let alertasHtml = '';
    if (alertas.length > 0) {
      alertasHtml = `
        <div class="card" style="background: #fff5f5; border: 2px solid #ef5350; border-radius: 14px; padding: 1rem; margin-bottom: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.6rem;">
            <span style="font-size: 1.35rem;">🚨</span>
            <div>
              <strong style="color: #b71c1c; font-size: 0.95rem;">Posible Avería / Descalibración (${alertas.length})</strong>
              <div style="font-size: 0.75rem; color: #c62828;">Mangueras con 2 o más días seguidos sin autocorregirse</div>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.55rem;">
            ${alertas.map(a => {
              const ultimos = a.registros.slice(-5).map(r => {
                const f = new Date(r.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
                const s = r.dif >= 0 ? '+' : '';
                return `${f}: <strong>${s}${r.dif}L</strong>`;
              }).join(' ➔ ');
              return `
                <div style="background: #ffffff; border: 1px solid #ffcdd2; border-radius: 10px; padding: 0.7rem 0.85rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    <strong style="color: #002B49; font-size: 0.9rem;">🔧 ${a.calle} — ${a.producto}</strong>
                    <span style="background: #d32f2f; color: #fff; font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 999px;">
                      ${a.rachaActual} días seguidos
                    </span>
                  </div>
                  <div style="font-size: 0.78rem; color: #334155; margin-top: 4px;">
                    Evolución: ${ultimos}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    } else {
      alertasHtml = `
        <div class="card" style="background: #f1f8e9; border: 1.5px solid #81c784; border-radius: 14px; padding: 0.85rem 1rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-size: 1.5rem;">✅</span>
          <div>
            <strong style="color: #1b5e20; font-size: 0.92rem;">Sin averías continuadas detectadas</strong>
            <div style="font-size: 0.78rem; color: #2e7d32;">
              Ninguna manguera acumula 2 o más lecturas consecutivas con descuadre sin compensar (${sortedAsc.length} comprobaciones analizadas).
              ${puntuales.length > 0 ? ` Hay ${puntuales.length} descuadre(s) puntual(es) de 1 solo día en vigilancia.` : ''}
            </div>
          </div>
        </div>
      `;
    }

    const manguerasCardsHtml = statsPorManguera.map((m, idx) => {
      let badgeHtml = `<span style="background: #e8f5e9; color: #2e7d32; font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 6px;">✅ Estable</span>`;
      let borderCol = 'rgba(0, 43, 73, 0.12)';
      if (m.rachaActual >= 2) {
        badgeHtml = `<span style="background: #ffebee; color: #c62828; border: 1px solid #ef9a9a; font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 6px;">🚨 ${m.rachaActual} días seguidos</span>`;
        borderCol = '#ef5350';
      } else if (m.rachaActual === 1) {
        badgeHtml = `<span style="background: #fff3e0; color: #e65100; border: 1px solid #ffcc80; font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 6px;">⚠️ Descuadre hoy (${m.ultimo.dif >= 0 ? '+' : ''}${m.ultimo.dif} L)</span>`;
        borderCol = '#ffb74d';
      } else if (m.ultimo?.estado === 'compensado') {
        badgeHtml = `<span style="background: #e3f2fd; color: #0d47a1; border: 1px solid #90caf9; font-size: 0.72rem; font-weight: 800; padding: 2px 8px; border-radius: 6px;">🔄 Compensada ayer/hoy</span>`;
      }

      const rowsHtml = [...m.registros].reverse().slice(0, 15).map(r => {
        const dStr = new Date(r.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
        let estadoIcon = '✅';
        let rowBg = '#ffffff';
        let difTxt = `${r.dif >= 0 ? '+' : ''}${r.dif} L`;
        if (r.estado === 'compensado') {
          estadoIcon = '🔄';
          rowBg = '#f0f7ff';
          difTxt = `${r.dif >= 0 ? '+' : ''}${r.dif} L (Neto ${r.difNeto >= 0 ? '+' : ''}${r.difNeto} L)`;
        } else if (r.estado === 'descuadre') {
          estadoIcon = '🚨';
          rowBg = '#fff5f5';
        }
        return `
          <tr style="background: ${rowBg}; border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 6px 4px; font-weight: 600;">${dStr}</td>
            <td style="padding: 6px 4px; text-align: right;">${r.litrosApp}</td>
            <td style="padding: 6px 4px; text-align: right;">${r.litrosMagon}</td>
            <td style="padding: 6px 4px; text-align: right; font-weight: 700;">${difTxt}</td>
            <td style="padding: 6px 4px; text-align: center;">${estadoIcon}</td>
          </tr>
        `;
      }).join('');

      return `
        <div class="card maint-hose-card" style="background: #ffffff; border: 1.5px solid ${borderCol}; border-radius: 12px; overflow: hidden;">
          <div class="maint-hose-header" data-idx="${idx}" style="padding: 0.85rem 1rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; gap: 0.5rem;">
            <div>
              <strong style="color: #002B49; font-size: 0.92rem;">${m.calle} — ${m.producto}</strong>
              <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;">
                ${m.registros.length} días | ${m.totalDescuadres} descuadres | ${m.totalCompensados} compensados
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              ${badgeHtml}
              <span class="maint-arrow" style="color: var(--text-muted); font-size: 0.8rem;">▼</span>
            </div>
          </div>
          <div class="maint-hose-body" style="display: ${m.rachaActual >= 1 ? 'block' : 'none'}; padding: 0 0.85rem 0.85rem; border-top: 1px solid #f1f5f9;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.78rem; margin-top: 0.4rem;">
              <thead>
                <tr style="color: var(--text-muted); border-bottom: 1.5px solid #e2e8f0; text-align: left;">
                  <th style="padding: 5px 4px;">Fecha</th>
                  <th style="padding: 5px 4px; text-align: right;">App (L)</th>
                  <th style="padding: 5px 4px; text-align: right;">Magon (L)</th>
                  <th style="padding: 5px 4px; text-align: right;">Dif.</th>
                  <th style="padding: 5px 4px; text-align: center;">Est.</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }).join('');

    bodyHtml = `
      <div style="padding: 0.5rem 1rem 5.5rem; max-width: 720px; margin: 0 auto;">
        ${alertasHtml}
        <h3 style="font-size: 0.9rem; font-weight: 800; color: #002B49; margin: 1rem 0 0.6rem; text-transform: uppercase; letter-spacing: 0.4px;">
          Evolución por Manguera (${statsPorManguera.length})
        </h3>
        <div style="display: flex; flex-direction: column; gap: 0.65rem;">
          ${manguerasCardsHtml}
        </div>
      </div>
    `;
  }

  container.innerHTML = headerHtml + stationSelectorHtml + bodyHtml;

  const stationSelect = container.querySelector('#maintStationSelect');
  if (stationSelect) {
    stationSelect.addEventListener('change', (e) => {
      setActiveBusinessId(e.target.value);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
  }

  container.querySelectorAll('.maint-hose-header').forEach(hdr => {
    hdr.addEventListener('click', () => {
      const card = hdr.closest('.maint-hose-card');
      const body = card.querySelector('.maint-hose-body');
      const arrow = hdr.querySelector('.maint-arrow');
      const isHidden = body.style.display === 'none';
      body.style.display = isHidden ? 'block' : 'none';
      if (arrow) arrow.textContent = isHidden ? '▲' : '▼';
    });
  });

  const pdfBtn = container.querySelector('#btnMaintPdf');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', () => {
      if (statsPorManguera.length === 0) {
        showToast('No hay cuadres registrados para generar PDF', 'info');
        return;
      }
      const doc = new jsPDF({ orientation: 'portrait' });
      doc.setFillColor(0, 43, 73);
      doc.rect(0, 0, 210, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text(`Informe Mantenimiento y Descuadres - ${businessName}`, 14, 14);
      doc.setFontSize(9.5);
      doc.text(`Emitido: ${formatDateTime(new Date())} | Comprobaciones analizadas: ${sortedAsc.length}`, 14, 22);

      const rows = statsPorManguera.map(m => {
        const ult = m.ultimo;
        const estadoTxt = m.rachaActual >= 2
          ? `ALERTA (${m.rachaActual} dias seg.)`
          : m.rachaActual === 1
            ? 'Descuadre puntual'
            : ult?.estado === 'compensado' ? 'Compensada' : 'Estable';
        const ultimasDifs = m.registros.slice(-5).map(r => `${r.dif >= 0 ? '+' : ''}${r.dif}L`).join(' -> ');
        return [
          `${m.calle} - ${m.producto}`,
          estadoTxt,
          `${m.totalDescuadres}`,
          `${m.totalCompensados}`,
          ultimasDifs
        ];
      });

      autoTable(doc, {
        startY: 34,
        head: [['Manguera / Calle', 'Estado', 'Descuadres', 'Compens.', 'Ultimos dias']],
        body: rows,
        styles: { fontSize: 8.5, cellPadding: 3 },
        headStyles: { fillColor: [0, 43, 73], textColor: 255 }
      });

      doc.save(`mantenimiento_${activeBusiness.code || activeBusinessId}.pdf`);
      showToast('PDF de mantenimiento descargado', 'success');
    });
  }

  return container;
}
