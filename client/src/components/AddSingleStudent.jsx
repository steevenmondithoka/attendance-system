import React, { useState } from 'react';
import api from '../utils/api';

// --- A list of valid departments to populate the dropdown ---
// --- This should match the 'enum' in your Student Schema ---
const departmentOptions = ['CSE', 'ECE','EEE', 'MECH', 'CIVIL', 'CHEM', 'META'];

const AddSingleStudent = ({ classId, onStudentAdded }) => {
    // --- UPDATED: Add year and department to the initial state ---
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        rollNo: '',
        year: '',
        department: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // --- UPDATED: Destructure new fields ---
    const { name, email, rollNo, year, department } = formData;

    const onChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        // --- UPDATED: Validate all required fields ---
        if (!name || !email || !rollNo || !year || !department) {
            setError('All fields are required.');
            setIsLoading(false);
            return;
        }

        try {
            // --- UPDATED: Send the complete formData object in the request ---
            const response = await api.post(`/students/add/${classId}`, formData);

            setSuccess(`Student "${response.data.student.name}" was added successfully!`);
            // --- UPDATED: Reset all form fields ---
            setFormData({ name: '', email: '', rollNo: '', year: '', department: '' });

            if (onStudentAdded) {
                onStudentAdded();
            }

        } catch (err) {
            let errorMessage = 'An unexpected error occurred. Please try again.';
            if (err.response) {
                errorMessage = err.response.data.msg || err.response.data.error || `Server error: ${err.response.status}.`;
            } else if (err.request) {
                errorMessage = 'Cannot connect to the server. Please check your network.';
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
            setTimeout(() => setSuccess(''), 5000);
        }
    };

    return (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Add a Single Student</h3>
            <form onSubmit={handleSubmit}>
                {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
                {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">{success}</div>}

                {/* --- No changes to Name, Email, or Roll No inputs --- */}
                <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input type="text" id="name" name="name" value={name} onChange={onChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., Jane Doe" required />
                </div>
                <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input type="email" id="email" name="email" value={email} onChange={onChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., jane.doe@example.com" required />
                </div>
                <div className="mb-4">
                    <label htmlFor="rollNo" className="block text-sm font-medium text-gray-700">Roll Number</label>
                    <input type="text" id="rollNo" name="rollNo" value={rollNo} onChange={onChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., S101" required />
                </div>
                
                {/* --- NEW: Year and Department Inputs --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="year" className="block text-sm font-medium text-gray-700">Year</label>
                        <input
                            type="number"
                            id="year"
                            name="year"
                            value={year}
                            onChange={onChange}
                            min="1"
                            max="4"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., 3"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department</label>
                        <select
                            id="department"
                            name="department"
                            value={department}
                            onChange={onChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="" disabled>Select Department</option>
                            {departmentOptions.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <button type="submit" disabled={isLoading} className="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 disabled:bg-gray-400 transition-colors">
                    {isLoading ? 'Adding...' : 'Add Student'}
                </button>
            </form>
        </div>
    );
};

export default AddSingleStudent;