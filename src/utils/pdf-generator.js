import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatDateTime } from './date-helpers.js';
import { getActiveBusinessName, getActiveServices } from './constants.js';

export function generateReport(readings, startDate, endDate) {
  const doc = new jsPDF('landscape');
  const businessName = getActiveBusinessName();
  const servicesDef = getActiveServices();

  // Sort readings oldest to newest
  const sortedReadings = [...readings].sort((a, b) => new Date(a.date) - new Date(b.date));

  const PRIMARY_COLOR = [13, 71, 161]; // #0d47a1 Deep Blue

  // Header Banner
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, doc.internal.pageSize.width, 28, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`${businessName} - Informe de Suministro por Calle`, doc.internal.pageSize.width / 2, 13, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const dateRangeStr = startDate && endDate 
    ? `Periodo: ${formatDate(startDate)} a ${formatDate(endDate)} (${sortedReadings.length} tomas registradas)`
    : `Todas las tomas registradas (${sortedReadings.length})`;
  doc.text(dateRangeStr, doc.internal.pageSize.width / 2, 22, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  let finalY = 36;

  if (sortedReadings.length < 2) {
    doc.setFontSize(12);
    doc.text('Se necesitan al menos 2 lecturas para calcular el volumen de litros suministrados.', 14, finalY);
    doc.save(`Informe_${businessName.replace(/\s+/g, '_')}.pdf`);
    return;
  }

  const firstReading = sortedReadings[0];
  const lastReading = sortedReadings[sortedReadings.length - 1];

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen de Litros Suministrados por Calle', 14, finalY);
  finalY += 6;

  const summaryData = [];
  let totalStationLiters = 0;

  servicesDef.forEach(service => {
    service.counters.forEach(counter => {
      const cntName = counter.short || counter.name;
      const initialVal = firstReading.data?.[service.name]?.[cntName] ?? 0;
      const finalVal = lastReading.data?.[service.name]?.[cntName] ?? 0;
      const diff = finalVal - initialVal;
      totalStationLiters += diff;

      summaryData.push([
        service.name,
        service.product || '',
        cntName,
        `${initialVal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} L`,
        `${finalVal.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} L`,
        `+${diff.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} L`
      ]);
    });
  });

  autoTable(doc, {
    startY: finalY,
    head: [['Calle', 'Producto', 'Totalizador', 'Lectura Inicial', 'Lectura Final', 'Litros Suministrados']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: PRIMARY_COLOR, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3.5 },
    alternateRowStyles: { fillColor: [245, 248, 252] }
  });

  finalY = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text(`TOTAL SUMINISTRADO EN LA ESTACIÓN: +${totalStationLiters.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} L`, 14, finalY);

  doc.save(`Informe_${businessName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
