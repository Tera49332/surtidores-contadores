import { createHeader } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { saveGasDelivery } from '../db.js';
import { getActiveBusinessName } from '../utils/constants.js';
import { isAdmin } from '../utils/session.js';

export async function renderGasDeliveryPage() {
  const container = document.createElement('div');
  container.className = 'page-content gas-delivery-page';

  const businessName = getActiveBusinessName();
  const headerHtml = createHeader('Descarga de Butano', true);

  // Current local datetime
  const now = new Date();
  const localIsoDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  container.innerHTML = `
    ${headerHtml}
    <div style="padding: 1rem 1rem 5rem; max-width: 540px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem;">
      
      <!-- NAVEGACIÓN RÁPIDA / VOLVER -->
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <button type="button" onclick="window.location.hash='#menu'" 
                style="background: rgba(0, 43, 73, 0.05); border: 1px solid rgba(0, 43, 73, 0.15); border-radius: 8px; padding: 6px 12px; font-size: 0.85rem; font-weight: 700; color: #002B49; cursor: pointer; display: inline-flex; align-items: center; gap: 0.4rem;">
          <span>←</span> Menú de tareas
        </button>
        <span style="font-size: 0.8rem; font-weight: 800; color: #107c41; text-transform: uppercase; letter-spacing: 0.5px;">
          🚚 Entrada Camión Repsol
        </span>
      </div>

      <div class="card" style="background: linear-gradient(135deg, #002B49, #004b7c); color: #ffffff; border-radius: 14px; padding: 1.1rem; box-shadow: 0 4px 12px rgba(0, 43, 73, 0.2); border-left: 5px solid #107c41;">
        <h2 style="font-size: 1.25rem; font-weight: 800; margin: 0 0 0.3rem 0;">
          Registro de Descarga de Butano
        </h2>
        <p style="margin: 0; font-size: 0.85rem; opacity: 0.9; line-height: 1.35;">
          Anota las <strong>bombonas llenas</strong> que el transportista descarga en las jaulas de <strong>${businessName}</strong>.
        </p>
      </div>

      <form id="deliveryForm" novalidate style="display: flex; flex-direction: column; gap: 1rem;">
        
        <!-- DATOS DEL ALBARÁN: FECHA Y NÚMERO -->
        <div class="card" style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem; box-shadow: 0 2px 6px rgba(0,0,0,0.03); display: flex; flex-direction: column; gap: 0.8rem;">
          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.35rem;">
              📅 Fecha y Hora de Descarga
            </label>
            <input type="datetime-local" id="deliveryDateTime" value="${localIsoDate}" 
                   style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; font-size: 1rem; font-weight: 600; color: var(--text-main); box-sizing: border-box;">
          </div>

          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.35rem;">
              📄 Nº Albarán / Documento de Entrega (opcional)
            </label>
            <input type="text" id="deliveryAlbaran" placeholder="Ej: ALB-2026-94812" 
                   style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.95rem; font-weight: 600; color: var(--text-main); box-sizing: border-box;">
          </div>
        </div>

        <!-- PRODUCTO 1: BUTANO NORMAL -->
        <div class="card" style="background: #ffffff; border: 2px solid rgba(255, 102, 0, 0.3); border-radius: 14px; padding: 1.1rem; box-shadow: 0 3px 10px rgba(255, 102, 0, 0.06);">
          <div style="display: flex; align-items: center; gap: 0.9rem; margin-bottom: 1rem;">
            <div style="width: 52px; height: 52px; min-width: 52px; border-radius: 12px; background: rgba(255, 102, 0, 0.1); display: flex; align-items: center; justify-content: center; padding: 4px; box-sizing: border-box;">
              <img src="/images/butano.png" alt="Butano" style="height: 44px; width: auto; object-fit: contain;">
            </div>
            <div style="flex: 1;">
              <h3 style="margin: 0; font-size: 1.1rem; font-weight: 800; color: #002B49;">
                Butano (Normal)
              </h3>
              <span style="display: inline-block; font-size: 0.75rem; font-weight: 700; color: #e65100; background: #fff3e0; padding: 2px 8px; border-radius: 6px; margin-top: 2px;">
                Cilindro 12.5 kg naranja
              </span>
            </div>
          </div>

          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #002B49; margin-bottom: 0.4rem;">
              Botellas LLENAS Descargadas:
            </label>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <button type="button" class="btn-step" data-target="butanoLlenas" data-step="-5"
                      style="flex: 1; padding: 0.65rem 0; background: #f1f5f9; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.9rem; font-weight: 700; cursor: pointer;">-5</button>
              <button type="button" class="btn-step" data-target="butanoLlenas" data-step="-1"
                      style="flex: 1; padding: 0.65rem 0; background: #f1f5f9; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.95rem; font-weight: 700; cursor: pointer;">-1</button>
              <input type="number" id="butanoLlenas" min="0" value="0" 
                     style="width: 85px; text-align: center; font-size: 1.35rem; font-weight: 800; color: #002B49; padding: 0.6rem; border: 2px solid #ff6600; border-radius: 8px;">
              <button type="button" class="btn-step" data-target="butanoLlenas" data-step="1"
                      style="flex: 1; padding: 0.65rem 0; background: #fff3e0; border: 1px solid #ffb74d; color: #e65100; border-radius: 8px; font-size: 0.95rem; font-weight: 700; cursor: pointer;">+1</button>
              <button type="button" class="btn-step" data-target="butanoLlenas" data-step="5"
                      style="flex: 1; padding: 0.65rem 0; background: #fff3e0; border: 1px solid #ffb74d; color: #e65100; border-radius: 8px; font-size: 0.9rem; font-weight: 700; cursor: pointer;">+5</button>
              <button type="button" class="btn-step" data-target="butanoLlenas" data-step="10"
                      style="flex: 1; padding: 0.65rem 0; background: #ff6600; border: none; color: #ffffff; border-radius: 8px; font-size: 0.9rem; font-weight: 800; cursor: pointer;">+10</button>
            </div>
          </div>
        </div>

        <!-- PRODUCTO 2: PROPANO 11KG -->
        <div class="card" style="background: #ffffff; border: 2px solid rgba(0, 43, 73, 0.2); border-radius: 14px; padding: 1.1rem; box-shadow: 0 3px 10px rgba(0, 43, 73, 0.05);">
          <div style="display: flex; align-items: center; gap: 0.9rem; margin-bottom: 1rem;">
            <div style="width: 52px; height: 52px; min-width: 52px; border-radius: 12px; background: rgba(0, 43, 73, 0.06); display: flex; align-items: center; justify-content: center; padding: 4px; box-sizing: border-box;">
              <img src="/images/propano.png" alt="Propano" style="height: 44px; width: auto; object-fit: contain;">
            </div>
            <div style="flex: 1;">
              <h3 style="margin: 0; font-size: 1.1rem; font-weight: 800; color: #002B49;">
                Propano (11 kg)
              </h3>
              <span style="display: inline-block; font-size: 0.75rem; font-weight: 700; color: #0d47a1; background: #e3f2fd; padding: 2px 8px; border-radius: 6px; margin-top: 2px;">
                Cilindro con franja negra
              </span>
            </div>
          </div>

          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #002B49; margin-bottom: 0.4rem;">
              Botellas LLENAS Descargadas:
            </label>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <button type="button" class="btn-step" data-target="propanoLlenas" data-step="-5"
                      style="flex: 1; padding: 0.65rem 0; background: #f1f5f9; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.9rem; font-weight: 700; cursor: pointer;">-5</button>
              <button type="button" class="btn-step" data-target="propanoLlenas" data-step="-1"
                      style="flex: 1; padding: 0.65rem 0; background: #f1f5f9; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.95rem; font-weight: 700; cursor: pointer;">-1</button>
              <input type="number" id="propanoLlenas" min="0" value="0" 
                     style="width: 85px; text-align: center; font-size: 1.35rem; font-weight: 800; color: #002B49; padding: 0.6rem; border: 2px solid #002B49; border-radius: 8px;">
              <button type="button" class="btn-step" data-target="propanoLlenas" data-step="1"
                      style="flex: 1; padding: 0.65rem 0; background: #e3f2fd; border: 1px solid #90caf9; color: #0d47a1; border-radius: 8px; font-size: 0.95rem; font-weight: 700; cursor: pointer;">+1</button>
              <button type="button" class="btn-step" data-target="propanoLlenas" data-step="5"
                      style="flex: 1; padding: 0.65rem 0; background: #002B49; border: none; color: #ffffff; border-radius: 8px; font-size: 0.9rem; font-weight: 800; cursor: pointer;">+5</button>
            </div>
          </div>
        </div>

        <!-- OBSERVACIONES -->
        <div class="card" style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
          <label style="display: block; font-size: 0.85rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.35rem;">
            📝 Observaciones / Cascos Retirados
          </label>
          <textarea id="deliveryNotes" rows="2" placeholder="Ej: Camión retiró 14 cascos vacíos de butano y dejó 15 llenas..."
                    style="width: 100%; padding: 0.65rem; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.9rem; font-family: inherit; box-sizing: border-box; resize: vertical;"></textarea>
        </div>

        <!-- RESUMEN EN VIVO Y BOTÓN GUARDAR -->
        <div class="card" style="background: #f8fafc; border: 1.5px solid rgba(16, 124, 65, 0.3); border-radius: 14px; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.95rem; font-weight: 700; color: #002B49;">Total botellas a ingresar:</span>
            <span id="deliveryTotalBadge" style="font-size: 1.3rem; font-weight: 900; color: #107c41;">0 uds</span>
          </div>

          <button type="submit" id="btnSaveDelivery" 
                  style="width: 100%; padding: 1rem; background: #107c41; color: #ffffff; border: none; border-radius: 12px; font-size: 1.1rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.6rem; box-shadow: 0 4px 14px rgba(16, 124, 65, 0.3);">
            <span>📦</span> Guardar Albarán de Descarga
          </button>
        </div>

      </form>
    </div>
  `;

  // Step buttons listener
  const form = container.querySelector('#deliveryForm');
  const butanoInput = container.querySelector('#butanoLlenas');
  const propanoInput = container.querySelector('#propanoLlenas');
  const totalBadge = container.querySelector('#deliveryTotalBadge');

  function updateTotal() {
    const b = Math.max(0, parseInt(butanoInput.value, 10) || 0);
    const p = Math.max(0, parseInt(propanoInput.value, 10) || 0);
    totalBadge.textContent = `${b + p} uds`;
  }

  container.querySelectorAll('.btn-step').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const step = parseInt(btn.dataset.step, 10);
      const input = container.querySelector(`#${targetId}`);
      if (input) {
        let val = parseInt(input.value, 10) || 0;
        val = Math.max(0, val + step);
        input.value = val;
        updateTotal();
      }
    });
  });

  butanoInput.addEventListener('input', updateTotal);
  propanoInput.addEventListener('input', updateTotal);

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const dateVal = container.querySelector('#deliveryDateTime').value;
    const albaranVal = container.querySelector('#deliveryAlbaran').value.trim();
    const notesVal = container.querySelector('#deliveryNotes').value.trim();
    const butano = Math.max(0, parseInt(butanoInput.value, 10) || 0);
    const propano = Math.max(0, parseInt(propanoInput.value, 10) || 0);
    const total = butano + propano;

    if (total <= 0) {
      showToast('Introduce al menos una bombona descargada (Butano o Propano)', 'warning');
      return;
    }

    const confirmMsg = `¿Confirmas el registro del albarán de descarga?\n\n- Butano Llenas: ${butano} uds\n- Propano Llenas: ${propano} uds\n- Total descargado: ${total} uds${albaranVal ? `\n- Albarán: ${albaranVal}` : ''}`;
    if (!confirm(confirmMsg)) return;

    const btnSubmit = container.querySelector('#btnSaveDelivery');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Guardando albarán...';

    try {
      const deliveryData = {
        date: dateVal ? new Date(dateVal).toISOString() : new Date().toISOString(),
        albaran: albaranVal,
        butanoLlenas: butano,
        propanoLlenas: propano,
        totalLlenas: total,
        observaciones: notesVal,
        createdBy: isAdmin() ? 'admin' : 'operador'
      };

      await saveGasDelivery(deliveryData);
      showToast('Albarán de descarga guardado correctamente', 'success');

      // Success screen
      container.innerHTML = `
        ${headerHtml}
        <div style="padding: 2.5rem 1rem; max-width: 480px; margin: 0 auto; text-align: center;">
          <div style="width: 72px; height: 72px; background: #e8f5e9; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin: 0 auto 1.5rem; color: #2e7d32;">
            ✓
          </div>
          <h2 style="font-size: 1.4rem; font-weight: 800; color: #002B49; margin: 0 0 0.5rem 0;">
            ¡Descarga Registrada con Éxito!
          </h2>
          <p style="font-size: 0.95rem; color: var(--text-muted); margin: 0 0 1.5rem 0; line-height: 1.4;">
            Se han añadido <strong>${butano}</strong> bombonas de Butano y <strong>${propano}</strong> de Propano al flujo del día de <strong>${businessName}</strong>.
          </p>

          <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem; margin-bottom: 1.5rem; text-align: left; font-size: 0.9rem;">
            ${albaranVal ? `<div style="margin-bottom: 0.4rem;"><strong>Nº Albarán:</strong> ${albaranVal}</div>` : ''}
            <div style="margin-bottom: 0.4rem;"><strong>Butano Llenas:</strong> +${butano} uds</div>
            <div style="margin-bottom: 0.4rem;"><strong>Propano Llenas:</strong> +${propano} uds</div>
            <div><strong>Fecha:</strong> ${new Date(dateVal).toLocaleString('es-ES')}</div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <button onclick="window.location.hash='#menu'" class="btn btn-primary" 
                    style="padding: 0.9rem; font-size: 1rem; font-weight: 700; background: #002B49; border: none; border-radius: 10px; color: #fff; cursor: pointer;">
              📋 Ir al Menú de Tareas
            </button>
            <button onclick="window.location.reload()" class="btn btn-secondary" 
                    style="padding: 0.75rem; font-size: 0.9rem; font-weight: 600; background: transparent; border: 1px solid var(--border-color); border-radius: 10px; color: var(--text-muted); cursor: pointer;">
              + Registrar otra descarga
            </button>
          </div>
        </div>
      `;
    } catch (err) {
      console.error('Error al guardar descarga:', err);
      showToast(`Error al guardar: ${err.message}`, 'error');
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<span>📦</span> Guardar Albarán de Descarga';
    }
  });

  return container;
}
