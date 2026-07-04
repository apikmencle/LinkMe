export default function TrafficFilterBar({
  startDate, endDate, searchPath,
  onStartDateChange, onEndDateChange, onSearchPathChange,
  onApply, onReset,
}) {
  return (
    <form className="card filter-bar" onSubmit={onApply}>
      <div className="field">
        <label>Dari Tanggal</label>
        <input type="date" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} />
      </div>
      <div className="field">
        <label>Sampai Tanggal</label>
        <input type="date" value={endDate} onChange={(e) => onEndDateChange(e.target.value)} />
      </div>
      <div className="field">
        <label>Cari Path</label>
        <input
          type="text"
          value={searchPath}
          onChange={(e) => onSearchPathChange(e.target.value)}
          placeholder="/2026/02/BioMe-001.html"
        />
      </div>
      <div className="filter-actions">
        <button className="btn-primary" type="submit">Terapkan</button>
        <button className="btn-ghost" type="button" onClick={onReset}>Hari Ini</button>
      </div>
    </form>
  );
}
