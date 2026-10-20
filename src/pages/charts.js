import { createHeader } from '../components/header.js';
import { getServicesSchema, getReadings } from '../db.js';
import Chart from 'chart.js/auto';

export async function renderChartsPage() {
  const container = document.createElement('div');
  container.className = 'page-content charts-page';

  const headerHtml = createHeader('Evolución');
  const servicesSchema = await getServicesSchema();
  const readings = await getReadings();
  // Sort readings by date asc for charts
  readings.sort((a, b) => new Date(a.date) - new Date(b.date));

  let pillsHtml = `
    <div class="chart-filter pills-scroll" style="display: flex; gap: 0.5rem; padding: 1rem; overflow-x: auto; -webkit-overflow-scrolling: touch;">
  `;
  
  Object.keys(servicesSchema).forEach((service, index) => {
    const isActive = index === 0;
    const bg = isActive ? 'rgba(0, 91, 142, 0.1)' : 'transparent';
    const col = isActive ? '#005B8E' : '#64748b';
    const border = isActive ? '#005B8E' : 'rgba(0,0,0,0.1)';
    pillsHtml += `<button class="pill ${isActive ? 'active' : ''}" data-service="${service}" style="background: ${bg}; color: ${col}; border: 1px solid ${border}; padding: 0.5rem 1rem; border-radius: 20px; white-space: nowrap; cursor: pointer; font-weight: 500;">${service}</button>`;
  });
  pillsHtml += `</div>`;

  let chartHtml = `
    <div style="padding: 0 1rem; margin-bottom: 5rem;">
      <div class="chart-container" style="height: 400px; background: white; margin-top: 0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <canvas id="evolutionChart"></canvas>
      </div>
    </div>
  `;

  container.innerHTML = headerHtml + pillsHtml + chartHtml;
  
  let currentChart = null;

  function renderChart(service) {
    const canvas = container.querySelector('#evolutionChart');
    if (!canvas) return;

    if (currentChart) {
      currentChart.destroy();
    }

    if (readings.length === 0) {
      // Empty state handled visually by chart.js or container
      return;
    }

    const counters = servicesSchema[service] || [];
    const labels = readings.map(r => {
      const d = new Date(r.date);
      return `${d.getDate()}/${d.getMonth()+1}`;
    });

    const colors = ['#00BCD4', '#4CAF50', '#FFC107', '#E91E63', '#9C27B0'];
    
    const datasets = counters.map((counter, idx) => {
      const data = readings.map(r => r.data[service]?.[counter] || null);
      return {
        label: counter,
        data: data,
        borderColor: colors[idx % colors.length],
        backgroundColor: colors[idx % colors.length] + '33',
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 3
      };
    });

    currentChart = new Chart(canvas, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#1e293b' } }
        },
        scales: {
          y: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { color: '#64748b' }
          },
          x: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { color: '#64748b' }
          }
        }
      }
    });
  }

  // Use setTimeout to ensure canvas is in DOM before rendering chart
  setTimeout(() => {
    const firstService = Object.keys(servicesSchema)[0];
    if (firstService) renderChart(firstService);

    container.querySelectorAll('.pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        container.querySelectorAll('.pill').forEach(p => {
          p.style.background = 'transparent';
          p.style.color = '#64748b';
          p.style.border = '1px solid rgba(0,0,0,0.1)';
          p.classList.remove('active');
        });
        e.target.style.background = 'rgba(0, 91, 142, 0.1)';
        e.target.style.color = '#005B8E';
        e.target.style.border = '1px solid #005B8E';
        e.target.classList.add('active');

        renderChart(e.target.dataset.service);
      });
    });
  }, 0);

  return container;
}
