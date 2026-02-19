import { TenderAnalysis } from './pages/TenderAnalysis';
import { Component, type ReactNode, type ErrorInfo } from 'react';

// Error boundary to catch runtime errors
class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
          <h1 style={{ color: '#ef4444' }}>Ошибка загрузки</h1>
          <p>Произошла ошибка при загрузке компонента:</p>
          <pre style={{ background: '#1e293b', color: '#f1f5f9', padding: '20px', borderRadius: '8px', overflow: 'auto' }}>
            {this.state.error?.message}
          </pre>
          <pre style={{ background: '#1e293b', color: '#94a3b8', padding: '20px', borderRadius: '8px', overflow: 'auto', fontSize: '12px' }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <TenderAnalysis />
    </ErrorBoundary>
  );
}

export default App;
