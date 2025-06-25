import { useState, useEffect } from 'react'
import Login from './components/Login'
import PatientIntake from './components/PatientIntake'
import PatientDashboard from './components/PatientDashboard'
import PatientDetail from './components/PatientDetail'

interface User {
  id: number;
  username: string;
  role: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<'dashboard' | 'intake' | 'patient-detail'>('dashboard')
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)

  const handleLogin = (authToken: string, userData: User) => {
    setToken(authToken)
    setUser(userData)
    localStorage.setItem('token', authToken)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
    setCurrentView('dashboard')
    setSelectedPatientId(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatientId(patientId)
    setCurrentView('patient-detail')
  }

  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
    setSelectedPatientId(null)
  }

  // Check for existing token on app load
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
  }, [])

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  const userRoles = user.role.split(',').map(r => r.trim());
  const canAccessIntake = userRoles.includes('Clinician');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold">Kyros Dino</h1>
              <div className="flex space-x-4">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'dashboard'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Dashboard
                </button>
                {canAccessIntake && (
                  <button
                    onClick={() => setCurrentView('intake')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      currentView === 'intake'
                       ? 'bg-indigo-100 text-indigo-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Patient Intake
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user.username} ({user.role})
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {currentView === 'dashboard' && token && (
            <PatientDashboard 
              token={token} 
              onPatientSelect={handlePatientSelect}
            />
          )}
          
          {currentView === 'patient-detail' && selectedPatientId && token && (
            <PatientDetail 
              patientId={selectedPatientId}
              token={token}
              onBack={handleBackToDashboard}
            />
          )}
          
          {currentView === 'intake' && canAccessIntake && token && (
            <PatientIntake 
              token={token} 
              onSuccess={() => setCurrentView('dashboard')} 
            />
          )}
          
          {currentView === 'intake' && !canAccessIntake && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong>Unauthorized:</strong> You must have Clinician role to access the Patient Intake form.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
