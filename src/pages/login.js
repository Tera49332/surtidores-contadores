import { BUSINESSES, ADMIN_PIN } from '../utils/constants.js';
import { setUserSession } from '../utils/session.js';

export function renderLoginPage(onSuccess) {
  const container = document.createElement('div');
  container.className = 'login-page';

  container.innerHTML = `
    <style>
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }
      .shake { animation: shake 0.5s; }
      .login-logo { 
        width: 120px; 
        height: auto; 
        margin: 1.5rem auto 0.5rem; 
        display: block;
        filter: drop-shadow(0 4px 10px rgba(0, 43, 73, 0.15));
      }
      .login-title { font-size: 1.7rem; font-weight: 900; color: #002B49; margin-bottom: 0.2rem; text-align: center; letter-spacing: 2px; }
      .login-subtitle { font-size: 0.9rem; color: #546e7a; margin-bottom: 2rem; text-align: center; }
      .pin-display { display: flex; justify-content: center; gap: 1rem; margin-bottom: 2.5rem; }
      .pin-dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid #ff6600; transition: all 0.2s; }
      .pin-dot.filled { background-color: #ff6600; }
      .pin-pad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; max-width: 290px; margin: 0 auto; }
      .pin-key { 
        background: #ffffff; 
        border: 1px solid rgba(0, 50, 80, 0.15); 
        border-radius: 50%; 
        width: 68px; 
        height: 68px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-size: 1.4rem; 
        font-weight: 600; 
        color: #002B49; 
        cursor: pointer; 
        transition: all 0.15s; 
        margin: 0 auto; 
        box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      }
      .pin-key:active { background: #fff3e0; transform: scale(0.95); }
      .pin-hint { text-align: center; margin-top: 1.5rem; font-size: 0.8rem; color: #90a4ae; }
    </style>
    <div style="text-align: center;">
      <img src="/repsol-logo.jpg" alt="Repsol" class="login-logo">
      <h1 class="login-title">CONTADORES</h1>
      <p class="login-subtitle">Introduce el código / PIN de la estación</p>
    </div>
    
    <div class="pin-display">
      <div class="pin-dot"></div>
      <div class="pin-dot"></div>
      <div class="pin-dot"></div>
      <div class="pin-dot"></div>
      <div class="pin-dot"></div>
    </div>

    <div class="pin-pad">
      <button class="pin-key">1</button>
      <button class="pin-key">2</button>
      <button class="pin-key">3</button>
      <button class="pin-key">4</button>
      <button class="pin-key">5</button>
      <button class="pin-key">6</button>
      <button class="pin-key">7</button>
      <button class="pin-key">8</button>
      <button class="pin-key">9</button>
      <button class="pin-key">C</button>
      <button class="pin-key">0</button>
      <button class="pin-key">⌫</button>
    </div>
  `;

  let currentPin = '';
  const dots = container.querySelectorAll('.pin-dot');
  const display = container.querySelector('.pin-display');

  async function handleInput(val) {
    if (val === 'C') {
      currentPin = '';
    } else if (val === '⌫') {
      currentPin = currentPin.slice(0, -1);
    } else if (currentPin.length < 5) {
      currentPin += val;
    }

    updateDots();

    if (currentPin.length === 5) {
      if (currentPin === ADMIN_PIN) {
        // Acceso Administrador con estación por defecto
        setUserSession(BUSINESSES[0].id, 'admin');
        window.location.hash = '#dashboard';
        if (typeof onSuccess === 'function') onSuccess();
      } else {
        const business = BUSINESSES.find(b => b.pin === currentPin);
        if (business) {
          // Acceso Operador / Punto de Venta directo a meter contadores
          setUserSession(business.id, 'operator');
          window.location.hash = '#register';
          if (typeof onSuccess === 'function') onSuccess();
        } else {
          display.classList.add('shake');
          setTimeout(() => {
            display.classList.remove('shake');
            currentPin = '';
            updateDots();
          }, 500);
        }
      }
    }
  }

  function updateDots() {
    dots.forEach((dot, index) => {
      if (index < currentPin.length) {
        dot.classList.add('filled');
      } else {
        dot.classList.remove('filled');
      }
    });
  }

  container.querySelectorAll('.pin-key').forEach(btn => {
    btn.addEventListener('click', (e) => {
      handleInput(e.target.textContent);
    });
  });

  return container;
}
