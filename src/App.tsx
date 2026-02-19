import { useState } from 'react';

// Minimal test page - NO external components
function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{
      padding: '40px',
      fontFamily: 'Segoe UI, sans-serif',
      background: '#0f172a',
      color: '#f1f5f9',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#3b82f6', marginBottom: '20px' }}>
        H2E - Tender Analysis System
      </h1>
      <p style={{ marginBottom: '20px' }}>
        Если вы видите этот текст, React работает корректно!
      </p>
      <button
        onClick={() => setCount(c => c + 1)}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        Нажато: {count} раз
      </button>
      <div style={{ marginTop: '40px', padding: '20px', background: '#1e293b', borderRadius: '8px' }}>
        <h2 style={{ color: '#10b981', marginBottom: '16px' }}>Статус системы:</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '8px' }}>✅ React загружен</li>
          <li style={{ marginBottom: '8px' }}>✅ Vite build успешен</li>
          <li style={{ marginBottom: '8px' }}>✅ Vercel deployment работает</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
