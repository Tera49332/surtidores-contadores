import { formatDate, formatDateTime } from './date-helpers.js';

/**
 * Calculates daily sales for Butane and Propane based on:
 * Ventas = Llenas Iniciales (T) + Descargas Llenas (T a T+1) - Llenas Finales (T+1)
 *
 * @param {Array} readings - Array of morning cage counts
 * @param {Array} deliveries - Array of truck deliveries
 * @returns {Object} { intervals, totals, pendingDeliveries }
 */
export function calculateGasDailySales(readings = [], deliveries = []) {
  const sortedReadings = [...readings].sort((a, b) => new Date(a.date) - new Date(b.date));
  const sortedDeliveries = [...deliveries].sort((a, b) => new Date(a.date) - new Date(b.date));

  const intervals = [];

  for (let i = 0; i < sortedReadings.length - 1; i++) {
    const startCount = sortedReadings[i];
    const endCount = sortedReadings[i + 1];
    const startDate = new Date(startCount.date);
    const endDate = new Date(endCount.date);

    // Matching deliveries: between startCount (inclusive) and endCount (inclusive)
    const matchingDeliveries = sortedDeliveries.filter(d => {
      const dDate = new Date(d.date);
      return dDate >= startDate && dDate <= endDate;
    });

    const butanoDelivered = matchingDeliveries.reduce((sum, d) => sum + (Number(d.butanoLlenas) || 0), 0);
    const propanoDelivered = matchingDeliveries.reduce((sum, d) => sum + (Number(d.propanoLlenas) || 0), 0);

    // Counts are stored under reading.data.{butano|propano} (fallback to top-level for safety)
    const sB = startCount.data?.butano || startCount.butano || {};
    const eB = endCount.data?.butano || endCount.butano || {};
    const sP = startCount.data?.propano || startCount.propano || {};
    const eP = endCount.data?.propano || endCount.propano || {};

    const butanoInitial = Number(sB.llenas) || 0;
    const butanoFinal = Number(eB.llenas) || 0;
    // Sales formula: initial full + delivered full - final full
    const butanoSold = Math.max(0, (butanoInitial + butanoDelivered) - butanoFinal);

    const propanoInitial = Number(sP.llenas) || 0;
    const propanoFinal = Number(eP.llenas) || 0;
    const propanoSold = Math.max(0, (propanoInitial + propanoDelivered) - propanoFinal);

    intervals.push({
      startDate,
      endDate,
      startCount,
      endCount,
      matchingDeliveries,
      dateLabel: formatDate(startCount.date),
      fullDateLabel: `${formatDate(startCount.date)} al ${formatDate(endCount.date)}`,
      butano: {
        initial: butanoInitial,
        delivered: butanoDelivered,
        final: butanoFinal,
        sold: butanoSold,
        vacias: Number(eB.vacias) || 0,
        huecos: Number(eB.huecos) || 0,
        totalJaula: Number(eB.total) || 0
      },
      propano: {
        initial: propanoInitial,
        delivered: propanoDelivered,
        final: propanoFinal,
        sold: propanoSold,
        vacias: Number(eP.vacias) || 0,
        huecos: Number(eP.huecos) || 0,
        totalJaula: Number(eP.total) || 0
      },
      albaranes: matchingDeliveries.map(d => d.albaran).filter(Boolean).join(', '),
      notes: [endCount.notes || endCount.observaciones, ...matchingDeliveries.map(d => d.observaciones)].filter(Boolean).join(' | ')
    });
  }

  // Any deliveries after the latest reading (pending next morning count)
  let pendingDeliveries = [];
  if (sortedReadings.length > 0) {
    const latestReadingDate = new Date(sortedReadings[sortedReadings.length - 1].date);
    pendingDeliveries = sortedDeliveries.filter(d => new Date(d.date) > latestReadingDate);
  } else {
    pendingDeliveries = [...sortedDeliveries];
  }

  const totals = intervals.reduce((acc, row) => {
    acc.butanoSold += row.butano.sold;
    acc.propanoSold += row.propano.sold;
    acc.butanoDelivered += row.butano.delivered;
    acc.propanoDelivered += row.propano.delivered;
    acc.totalBottlesSold += (row.butano.sold + row.propano.sold);
    return acc;
  }, { 
    butanoSold: 0, 
    propanoSold: 0, 
    butanoDelivered: 0, 
    propanoDelivered: 0, 
    totalBottlesSold: 0 
  });

  return {
    intervals,
    totals,
    pendingDeliveries,
    sortedReadings,
    sortedDeliveries
  };
}
