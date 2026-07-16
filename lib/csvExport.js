// toCsv() dipisah dari downloadCsv() supaya logika escaping-nya bisa
// dites langsung (lihat lib/__tests__/csvExport.test.js) tanpa perlu
// lingkungan browser sama sekali.

// rows: array of array (baris pertama dianggap header). Setiap sel
// di-escape sesuai aturan CSV standar: kalau mengandung koma, tanda
// kutip, atau baris baru, dibungkus tanda kutip dan tanda kutip di
// dalamnya digandakan.
export function toCsv(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const str = cell === null || cell === undefined ? '' : String(cell);
          if (/[",\n]/.test(str)) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\r\n');
}

// Cuma jalan di browser (butuh document/Blob). Menambahkan BOM (\uFEFF)
// di depan supaya Excel di Windows/Android otomatis kenali encoding
// UTF-8 dan tidak merusak karakter non-ASCII (mis. nama negara).
export function downloadCsv(filename, csvString) {
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
