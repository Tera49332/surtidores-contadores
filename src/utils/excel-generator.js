import * as XLSX from 'xlsx';
import { formatDate, formatDateTime } from './date-helpers.js';
import { getActiveBusinessName, getActiveServices } from './constants.js';

/**
 * Genera y descarga un informe en formato Excel (.xlsx) para un periodo de lecturas
 */
export function generateExcelReport(readings, startDate, endDate) {
  const businessName = getActiveBusinessName();
  const servicesDef = getActiveServices();
  const sortedReadings = [...readings].sort((a, b) => new Date(a.date) - new Date(b.date));

  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // HOJA 1: RESUMEN POR CALLE (Consumo total en el periodo)
  // -------------------------------------------------------------
  const dateRangeStr = startDate && endDate 
    ? `${formatDate(startDate)} a ${formatDate(endDate)}`
    : `Todas las tomas registradas (${sortedReadings.length})`;

  const resumenRows = [
    [`REPSOL CONTADORES - ${businessName}`],
    [`Informe de Suministro por Calle | Periodo: ${dateRangeStr}`],
    [`Fecha de generación: ${formatDateTime(new Date())}`],
    [], // fila vacía
    ['Calle', 'Producto', 'Totalizador', 'Lectura Inicial (L)', 'Lectura Final (L)', 'Litros Suministrados (L)']
  ];

  let totalStationLiters = 0;

  if (sortedReadings.length >= 2) {
    const firstReading = sortedReadings[0];
    const lastReading = sortedReadings[sortedReadings.length - 1];

    servicesDef.forEach(service => {
      service.counters.forEach(counter => {
        const cntName = counter.short || counter.name;
        const initialVal = Number(firstReading.data?.[service.name]?.[cntName] ?? 0);
        const finalVal = Number(lastReading.data?.[service.name]?.[cntName] ?? 0);
        const diff = finalVal - initialVal;
        totalStationLiters += diff;

        resumenRows.push([
          service.name,
          counter.product || service.product || '',
          cntName,
          initialVal,
          finalVal,
          diff
        ]);
      });
    });

    resumenRows.push([]);
    resumenRows.push(['', '', '', '', 'TOTAL ESTACIÓN (L):', totalStationLiters]);
  } else if (sortedReadings.length === 1) {
    resumenRows.push(['Solo hay 1 lectura registrada. Se necesitan al menos 2 para calcular consumo.']);
  }

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenRows);
  wsResumen['!cols'] = [
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
    { wch: 20 },
    { wch: 20 },
    { wch: 24 }
  ];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen por Calle');

  // -------------------------------------------------------------
  // HOJA 2: DETALLE CRONOLÓGICO DE TODAS LAS TOMAS
  // -------------------------------------------------------------
  const headerCols = ['Fecha y Hora'];
  const detalleCols = [{ wch: 22 }];

  servicesDef.forEach(s => {
    s.counters.forEach(cnt => {
      const pName = cnt.product || s.product || cnt.short;
      headerCols.push(`${s.name} - ${pName}`);
      detalleCols.push({ wch: 20 });
    });
  });
  headerCols.push('Total Tomas (L)');
  detalleCols.push({ wch: 18 });

  const detalleRows = [
    [`REPSOL CONTADORES - Histórico Detallado de Tomas (${businessName})`],
    [],
    headerCols
  ];

  sortedReadings.forEach(reading => {
    const row = [formatDateTime(reading.date)];
    let sumToma = 0;
    servicesDef.forEach(s => {
      s.counters.forEach(cnt => {
        const cntName = cnt.short || cnt.name;
        const val = Number(reading.data?.[s.name]?.[cntName] ?? 0);
        row.push(val);
        sumToma += val;
      });
    });
    row.push(sumToma);
    detalleRows.push(row);
  });

  const wsDetalle = XLSX.utils.aoa_to_sheet(detalleRows);
  wsDetalle['!cols'] = detalleCols;
  XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle de Tomas');

  // -------------------------------------------------------------
  // DESCARGA DEL ARCHIVO
  // -------------------------------------------------------------
  const fileDate = new Date().toISOString().slice(0, 10);
  const cleanName = businessName.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(wb, `Repsol_Contadores_${cleanName}_${fileDate}.xlsx`);
}

/**
 * Genera y descarga un Excel para una lectura puntual comparada con su anterior
 */
export function exportSingleReadingExcel(curr, prev, servicesDef, businessName) {
  const wb = XLSX.utils.book_new();
  const dateStr = formatDateTime(curr.date);
  const prevDateStr = prev ? formatDateTime(prev.date) : 'Lectura inicial';

  const rows = [
    [`REPSOL CONTADORES - ${businessName}`],
    [`Toma de lectura: ${dateStr}`],
    [`Referencia anterior: ${prevDateStr}`],
    [],
    ['Calle', 'Producto', 'Totalizador', 'Lectura Anterior (L)', 'Lectura Actual (L)', 'Litros Suministrados (L)']
  ];

  let totalStationLiters = 0;

  servicesDef.forEach(srv => {
    srv.counters.forEach(cntObj => {
      const cnt = cntObj.short || cntObj.name;
      const currVal = Number(curr.data?.[srv.name]?.[cnt] ?? 0);
      const prevVal = prev ? Number(prev.data?.[srv.name]?.[cnt] ?? currVal) : currVal;
      const diff = prev ? (currVal - prevVal) : 0;
      totalStationLiters += diff;

      rows.push([
        srv.name,
        cntObj.product || srv.product || '',
        cnt,
        prev ? prevVal : '-',
        currVal,
        prev ? diff : 'Base inicial'
      ]);
    });
  });

  if (prev) {
    rows.push([]);
    rows.push(['', '', '', '', 'TOTAL SUMINISTRADO (L):', totalStationLiters]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
    { wch: 22 },
    { wch: 22 },
    { wch: 24 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Lectura');

  const dateObj = curr.date instanceof Date ? curr.date : new Date(curr.date);
  const fileDate = !isNaN(dateObj.getTime()) ? dateObj.toISOString().slice(0, 10) : 'fecha';
  const cleanName = businessName.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(wb, `Lectura_Repsol_${cleanName}_${fileDate}.xlsx`);
}

/**
 * Genera y descarga un Excel con el histórico o periodo de recuentos de Bombonas
 */
export function exportGasExcelReport(readings, startDate, endDate) {
  const businessName = getActiveBusinessName();
  const sortedReadings = [...readings].sort((a, b) => new Date(a.date) - new Date(b.date));
  const wb = XLSX.utils.book_new();

  const dateRangeStr = startDate && endDate 
    ? `${formatDate(startDate)} a ${formatDate(endDate)}`
    : `Todas las tomas registradas (${sortedReadings.length})`;

  const rows = [
    [`REPSOL CONTADORES - ${businessName}`],
    [`Control de Butano y Propano | Periodo: ${dateRangeStr}`],
    [`Fecha de generación: ${formatDateTime(new Date())}`],
    [],
    [
      'Fecha y Hora', 
      'Butano Llenas', 'Butano Vacías', 'Butano Huecos', 'Butano Total', 
      'Propano Llenas', 'Propano Vacías', 'Propano Huecos', 'Propano Total', 
      'Observaciones'
    ]
  ];

  sortedReadings.forEach(r => {
    const b = r.data?.butano || { llenas: 0, vacias: 0, huecos: 0, total: 0 };
    const p = r.data?.propano || { llenas: 0, vacias: 0, huecos: 0, total: 0 };
    rows.push([
      formatDateTime(r.date),
      b.llenas,
      b.vacias,
      b.huecos,
      b.total,
      p.llenas,
      p.vacias,
      p.huecos,
      p.total,
      r.notes || ''
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Bombonas');

  const fileDate = new Date().toISOString().slice(0, 10);
  const cleanName = businessName.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(wb, `Bombonas_Repsol_${cleanName}_${fileDate}.xlsx`);
}

/**
 * Genera y descarga un Excel para un único recuento matinal de bombonas
 */
export function exportSingleGasReadingExcel(reading, businessName) {
  const wb = XLSX.utils.book_new();
  const dateStr = formatDateTime(reading.date);
  const b = reading.data?.butano || { llenas: 0, vacias: 0, huecos: 0, total: 0, capacity: '-' };
  const p = reading.data?.propano || { llenas: 0, vacias: 0, huecos: 0, total: 0, capacity: '-' };

  const rows = [
    [`REPSOL CONTADORES - ${businessName}`],
    [`Conteo matinal de Butano y Propano`],
    [`Fecha y Hora: ${dateStr}`],
    [],
    ['Producto', 'Llenas', 'Vacías', 'Huecos', 'Total Contado', 'Capacidad Jaula'],
    ['Butano (normal)', b.llenas, b.vacias, b.huecos, b.total, b.capacity || '-'],
    ['Propano (11kg)', p.llenas, p.vacias, p.huecos, p.total, p.capacity || '-']
  ];

  if (reading.notes) {
    rows.push([]);
    rows.push(['Observaciones / Incidencias:', reading.notes]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
    { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Conteo');

  const dateObj = reading.date instanceof Date ? reading.date : new Date(reading.date);
  const fileDate = !isNaN(dateObj.getTime()) ? dateObj.toISOString().slice(0, 10) : 'fecha';
  const cleanName = businessName.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(wb, `Conteo_Bombonas_${cleanName}_${fileDate}.xlsx`);
}
