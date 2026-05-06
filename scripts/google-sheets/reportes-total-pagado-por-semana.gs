/**
 * Copiar este archivo al editor de Apps Script del spreadsheet (Extensiones > Apps Script).
 *
 * En la hoja «Reportes», donde hoy suman por semana, usar por ejemplo:
 *   =TOTAL_PAGADO_SEMANA(A2)
 * siendo A2 el número de semana ISO (columna Semana de Agenda).
 *
 * Reglas:
 * - Solo suma filas cuyo «Estado» sea exactamente «Pagado» (ignora Reservado, Cancelado, Disponible).
 * - Suma la columna «Cotización».
 * - No filtra por fecha: la semana 20 suma aunque el calendario actual sea la 19.
 *
 * Fórmula nativa equivalente (verificar letras si Agenda no va de A:N fijo):
 *   =SUMIFS(Agenda!$L:$L, Agenda!$N:$N, A2, Agenda!$J:$J, "Pagado")
 * con J=Estado, L=Cotización, N=Semana según cabeceras estándar del proyecto (sin columnas opcionales entre medias).
 */

function TOTAL_PAGADO_SEMANA(semanaNum) {
  if (semanaNum === "" || semanaNum === null) {
    return "";
  }
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName("Agenda");
  if (!sh) {
    return 0;
  }
  var data = sh.getDataRange().getValues();
  if (data.length < 2) {
    return 0;
  }
  var headers = data[0].map(function (h) {
    return String(h).trim();
  });
  var idxSemana = headers.indexOf("Semana");
  var idxEstado = headers.indexOf("Estado");
  var idxCot = headers.indexOf("Cotización");
  if (idxSemana < 0 || idxEstado < 0 || idxCot < 0) {
    throw new Error("Agenda debe tener columnas: Semana, Estado, Cotización");
  }
  var targetSem = Number(semanaNum);
  if (!isFinite(targetSem)) {
    return 0;
  }
  var sum = 0;
  for (var r = 1; r < data.length; r++) {
    var row = data[r];
    var est = String(row[idxEstado] || "").trim();
    if (est !== "Pagado") {
      continue;
    }
    var sem = Number(row[idxSemana]);
    if (!isFinite(sem) || sem !== targetSem) {
      continue;
    }
    var val = row[idxCot];
    var num = typeof val === "number" ? val : parseFloat(String(val).replace(/[$,]/g, "").trim());
    if (isFinite(num)) {
      sum += num;
    }
  }
  return sum;
}
