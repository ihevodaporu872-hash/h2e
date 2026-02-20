function App() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: '#f1f5f9',
      fontFamily: 'Segoe UI, sans-serif'
    }}>
      <h1 style={{
        fontSize: '4rem',
        fontWeight: 700,
        color: '#3b82f6',
        marginBottom: '1rem'
      }}>
        H2E
      </h1>
      <p style={{
        fontSize: '1.25rem',
        color: '#94a3b8',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        Система управления строительной документацией
      </p>
    </div>
  );
}

export default App;
