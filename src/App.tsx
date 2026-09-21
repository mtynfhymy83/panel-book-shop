import { useAuth } from './AuthContext'
import { LoginPage } from './LoginPage'
import { Dashboard } from './Dashboard'

export function App() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Dashboard /> : <LoginPage />
}
