import { useState } from 'react';

interface PatientIntakeProps {
  token: string;
  onSuccess: () => void;
}

interface PatientData {
  full_name: string;
  date_of_birth: string;
  ssn: string;
  symptoms: string;
  clinical_notes: string;
}

export default function PatientIntake({ token, onSuccess }: PatientIntakeProps) {
  const [formData, setFormData] = useState<PatientData>({
    full_name: '',
    date_of_birth: '',
    ssn: '',
    symptoms: '',
    clinical_notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/patients/intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Patient intake completed successfully!');
        setFormData({
          full_name: '',
          date_of_birth: '',
          ssn: '',
          symptoms: '',
          clinical_notes: ''
        });
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setError(data.error || 'Failed to create patient record');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Patient Intake Form</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
            Full Name *
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            required
            value={formData.full_name}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">
            Date of Birth *
          </label>
          <input
            type="date"
            id="date_of_birth"
            name="date_of_birth"
            required
            value={formData.date_of_birth}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="ssn" className="block text-sm font-medium text-gray-700">
            Social Security Number *
          </label>
          <input
            type="text"
            id="ssn"
            name="ssn"
            required
            value={formData.ssn}
            onChange={handleInputChange}
            placeholder="XXX-XX-XXXX"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700">
            Symptoms
          </label>
          <textarea
            id="symptoms"
            name="symptoms"
            rows={4}
            value={formData.symptoms}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Describe patient's current symptoms..."
          />
        </div>

        <div>
          <label htmlFor="clinical_notes" className="block text-sm font-medium text-gray-700">
            Clinical Notes
          </label>
          <textarea
            id="clinical_notes"
            name="clinical_notes"
            rows={4}
            value={formData.clinical_notes}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Additional clinical observations..."
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Patient Record...' : 'Submit Patient Intake'}
          </button>
        </div>
      </form>
    </div>
  );
}