import { useState, useEffect } from 'react'

interface Patient {
  id: string;
  full_name: string;
  date_of_birth: string;
  ssn: string;
  symptoms?: string;
  clinical_notes?: string;
  created_at: string;
  updated_at: string;
}

interface PatientDashboardProps {
  token: string;
  onPatientSelect: (patientId: string) => void;
}

export default function PatientDashboard({ token, onPatientSelect }: PatientDashboardProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPatients();
  }, [token]);

  const fetchPatients = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/patients', {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }
      const data = await response.json();
      setPatients(data.patients || []);
    } catch (err) {
      console.dir(err)
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Patients</h2>
        <p className="text-gray-600">Click on a patient to view their details</p>
      </div>

      {patients.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No patients found</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {patients.map((patient) => (
              <li key={patient.id}>
                <button
                  onClick={() => onPatientSelect(patient.id)}
                  className="block hover:bg-gray-50 px-4 py-4 w-full text-left transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-600 font-medium text-sm">
                            {patient.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {patient.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          DOB: {new Date(patient.date_of_birth).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}