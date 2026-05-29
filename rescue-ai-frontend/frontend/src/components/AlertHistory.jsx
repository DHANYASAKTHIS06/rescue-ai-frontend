function AlertHistory({ history }) {
  return (
    <div className="history-card">
      <h3>Alert History</h3>
      {history.length === 0 ? (
        <p className="no-history">No emergencies detected yet.</p>
      ) : (
        <ul className="history-list">
          {history.map(item => (
            <li key={item.id} className="history-item">
              <span className="hi-icon">
                {item.source === 'speech' ? '🎙️' : '🚨'}
              </span>
              <div className="hi-content">
                <span className="hi-label">
                  {item.source === 'speech'
                    ? `Keyword: "${item.keyword}"`
                    : item.label}
                </span>
                <span className="hi-source">
                  {item.source === 'speech' ? 'Speech' : 'Gesture'}
                </span>
              </div>
              <span className="hi-time">{item.time}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default AlertHistory
