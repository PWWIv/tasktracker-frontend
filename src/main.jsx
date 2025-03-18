import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'  // Убедитесь, что путь и расширение соответствуют вашему файлу

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App className="w-full h-full"/>
    </AuthProvider>
  </StrictMode>,
)
