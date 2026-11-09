import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatDateTime } from './date-helpers.js';
import { getActiveBusinessName } from './constants.js';
import { calculateGasDailySales } from './gas-calculator.js';

export function generateGasPdfReport(gasReadings, gasDeliveries, startDate, endDate) {
  const doc = new jsPDF('landscape');
  const businessName = getActiveBusinessName();

  // Filter readings and deliveries if start/end dates specified
  let filteredReadings = [...gasReadings];
  let filteredDeliveries = [...gasDeliveries];

  if (startDate) {
    const sDate = new Date(startDate);
    sDate.setHours(0, 0, 0, 0);
    filteredReadings = filteredReadings.filter(r => new Date(r.date) >= sDate);
    filteredDeliveries = filteredDeliveries.filter(d => new Date(d.date) >= sDate);
  }

  if (endDate) {
    const eDate = new Date(endDate);
    eDate.setHours(23, 59, 59, 999);
    filteredReadings = filteredReadings.filter(r => new Date(r.date) <= eDate);
    filteredDeliveries = filteredDeliveries.filter(d => new Date(d.date) <= eDate);
  }

  const { intervals, totals, pendingDeliveries } = calculateGasDailySales(filteredReadings, filteredDeliveries);

  const PRIMARY_COLOR = [0, 43, 73];    // #002B49
  const ACCENT_COLOR = [255, 102, 0];   // #ff6600
  const GRAY_BG = [245, 247, 250];

  // 1. Header Banner
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, doc.internal.pageSize.width, 28, 'F');

  // Orange brand accent line
  doc.setFillColor(...ACCENT_COLOR);
  doc.rect(0, 26, doc.internal.pageSize.width, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${businessName} - Control de Butano y Propano`, doc.internal.pageSize.width / 2, 12, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const dateRangeStr = startDate && endDate 
    ? `Periodo: ${formatDate(startDate)} a ${formatDate(endDate)} | Emitido: ${formatDateTime(new Date())}`
    : `Histórico Completo (${filteredReadings.length} conteos matinales, ${filteredDeliveries.length} descargas) | Emitido: ${formatDateTime(new Date())}`;
  doc.text(dateRangeStr, doc.internal.pageSize.width / 2, 21, { align: 'center' });

  let finalY = 35;

  if (filteredReadings.length < 2) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text('Se necesitan al menos 2 conteos matinales consecutivos para calcular las ventas diarias.', 14, finalY);
    if (filteredDeliveries.length > 0) {
      doc.text(`(Se han registrado ${filteredDeliveries.length} descargas de mercancía en el periodo, pero faltan conteos de cierre de ciclo).`, 14, finalY + 7);
    }
    doc.save(`Informe_Butano_Propano_${businessName.replace(/\s+/g, '_')}.pdf`);
    return;
  }

  // 2. Summary KPI Cards
  const cardWidth = 65;
  const cardHeight = 18;
  const startX = 14;
  const gap = 6;

  // KPI 1: Ventas Butano
  doc.setFillColor(255, 243, 224); // light orange
  doc.roundedRect(startX, finalY, cardWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(...ACCENT_COLOR);
  doc.setLineWidth(0.5);
  doc.roundedRect(startX, finalY, cardWidth, cardHeight, 2, 2, 'D');

  doc.setTextColor(...ACCENT_COLOR);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('VENTAS BUTANO', startX + 6, finalY + 6);
  doc.setFontSize(14);
  doc.text(`${totals.butanoSold} uds`, startX + 6, finalY + 14);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Descargas: +${totals.butanoDelivered}`, startX + cardWidth - 6, finalY + 14, { align: 'right' });

  // KPI 2: Ventas Propano
  const x2 = startX + cardWidth + gap;
  doc.setFillColor(235, 245, 255); // light blue
  doc.roundedRect(x2, finalY, cardWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(...PRIMARY_COLOR);
  doc.roundedRect(x2, finalY, cardWidth, cardHeight, 2, 2, 'D');

  doc.setTextColor(...PRIMARY_COLOR);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('VENTAS PROPANO 11KG', x2 + 6, finalY + 6);
  doc.setFontSize(14);
  doc.text(`${totals.propanoSold} uds`, x2 + 6, finalY + 14);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Descargas: +${totals.propanoDelivered}`, x2 + cardWidth - 6, finalY + 14, { align: 'right' });

  // KPI 3: Total Bombonas Vendidas
  const x3 = x2 + cardWidth + gap;
  doc.setFillColor(...PRIMARY_COLOR);
  doc.roundedRect(x3, finalY, cardWidth, cardHeight, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL BOMBONAS VENDIDAS', x3 + 6, finalY + 6);
  doc.setFontSize(14);
  doc.setTextColor(255, 204, 128); // gold
  doc.text(`${totals.totalBottlesSold} unidades`, x3 + 6, finalY + 14);

  // KPI 4: Días contabilizados
  const x4 = x3 + cardWidth + gap;
  doc.setFillColor(...GRAY_BG);
  doc.roundedRect(x4, finalY, cardWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(x4, finalY, cardWidth, cardHeight, 2, 2, 'D');

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('JORNADAS AUDITADAS', x4 + 6, finalY + 6);
  doc.setFontSize(14);
  doc.text(`${intervals.length} días`, x4 + 6, finalY + 14);

  finalY += cardHeight + 8;

  // 3. Table of Daily Intervals & Sales
  const bodyRows = intervals.map(item => {
    return [
      item.dateLabel,
      // Butano
      `${item.butano.initial}`,
      item.butano.delivered > 0 ? `+${item.butano.delivered}` : '-',
      `${item.butano.final}`,
      `${item.butano.sold}`,
      // Propano
      `${item.propano.initial}`,
      item.propano.delivered > 0 ? `+${item.propano.delivered}` : '-',
      `${item.propano.final}`,
      `${item.propano.sold}`,
      // Jaula
      `B: ${item.butano.vacias}v / ${item.butano.huecos}h\nP: ${item.propano.vacias}v / ${item.propano.huecos}h`,
      // Albarán / Notas
      item.albaranes || item.notes || '-'
    ];
  });

  // Footer Totals Row
  const footRow = [
    'TOTALES',
    '-',
    `+${totals.butanoDelivered}`,
    '-',
    `${totals.butanoSold}`,
    '-',
    `+${totals.propanoDelivered}`,
    '-',
    `${totals.propanoSold}`,
    '-',
    `${totals.totalBottlesSold} bombonas vendidas`
  ];

  autoTable(doc, {
    startY: finalY,
    head: [
      [
        { content: 'Fecha / Día', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'BUTANO (Normal)', colSpan: 4, styles: { halign: 'center', fillColor: [230, 81, 0] } },
        { content: 'PROPANO (11 kg)', colSpan: 4, styles: { halign: 'center', fillColor: [13, 71, 161] } },
        { content: 'Jaula (Fin)', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'Albarán / Notas', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } }
      ],
      [
        // Subheaders for Butano
        { content: 'Ini.', styles: { halign: 'center' } },
        { content: '+Desc.', styles: { halign: 'center' } },
        { content: 'Fin.', styles: { halign: 'center' } },
        { content: 'VENTAS', styles: { halign: 'center', fillColor: [255, 102, 0], textColor: [255, 255, 255], fontStyle: 'bold' } },
        // Subheaders for Propano
        { content: 'Ini.', styles: { halign: 'center' } },
        { content: '+Desc.', styles: { halign: 'center' } },
        { content: 'Fin.', styles: { halign: 'center' } },
        { content: 'VENTAS', styles: { halign: 'center', fillColor: [0, 43, 73], textColor: [255, 255, 255], fontStyle: 'bold' } }
      ]
    ],
    body: bodyRows,
    foot: [footRow],
    theme: 'grid',
    headStyles: {
      fillColor: PRIMARY_COLOR,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    footStyles: {
      fillColor: [0, 43, 73],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center'
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      halign: 'center',
      valign: 'middle'
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 26 },
      4: { fontStyle: 'bold', textColor: [230, 81, 0], fillColor: [255, 248, 240] },
      8: { fontStyle: 'bold', textColor: [13, 71, 161], fillColor: [240, 248, 255] },
      9: { fontSize: 7.5, cellWidth: 32 },
      10: { halign: 'left', fontSize: 7.5 }
    },
    alternateRowStyles: {
      fillColor: [250, 252, 255]
    }
  });

  // Footer Explanatory Note
  const tableBottom = doc.lastAutoTable.finalY + 6;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(110, 110, 110);
  doc.text(
    '* Fórmula de Venta = Llenas Iniciales + Descarga Llenas - Llenas Finales. Los cascos vacíos y huecos auditan el estado físico de la jaula sin restar ventas.',
    14,
    tableBottom < 195 ? tableBottom : 195
  );

  doc.save(`Informe_Ventas_Bombonas_${businessName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
