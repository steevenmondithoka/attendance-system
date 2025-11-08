import React, { useState } from 'react';
import api from '../utils/api';

const BulkAddStudents = ({ classId, onUploadComplete }) => {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);

    const handleFileChange = (e) => {
        setUploadResult(null);
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            alert('Please select a file first.');
            return;
        }
        setIsUploading(true);
        setUploadResult(null);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post(`/students/bulk-register/${classId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setUploadResult(res.data);
            if (res.data.success && onUploadComplete) {
                onUploadComplete();
            }
        } catch (err) {
            console.error("Upload Error Response:", err.response);
            const errorMsg = err.response?.data?.msg || err.response?.data?.error || 'An unexpected error occurred during upload.';
            setUploadResult({ success: false, msg: errorMsg, errors: err.response?.data?.errors || [] });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mt-8">
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Bulk Add Students via CSV</h3>

            {/* --- UPDATED: Instructions for the new CSV format --- */}
            <p className="text-sm text-gray-600 mb-2">
                Upload a CSV file with columns: <strong>name, email, rollNo, year, department</strong>
            </p>

            <a href="/students_template.csv" download className="text-sm text-blue-600 hover:underline font-medium mb-4 block">
                Download CSV Template
            </a>

            <div className="flex items-center space-x-4">
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                <button
                    onClick={handleUpload}
                    disabled={isUploading || !file}
                    className="px-4 py-2 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isUploading ? 'Uploading...' : 'Upload'}
                </button>
            </div>

            {uploadResult && (
                <div className="mt-4 p-4 rounded-md bg-gray-50 border border-gray-200">
                    <p className={`font-semibold ${uploadResult.success ? 'text-green-700' : 'text-red-700'}`}>
                        {uploadResult.msg || uploadResult.summary}
                    </p>
                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                        <div className="mt-2">
                            <h4 className="font-bold text-gray-700">Import Errors:</h4>
                            <ul className="list-disc list-inside text-sm text-red-600 mt-1 space-y-1">
                                {uploadResult.errors.map((err, index) => (
                                    <li key={index}>
                                        <span className="font-semibold">{err.email || `Row ${err.row}` || 'Invalid Row'}:</span> {err.reason}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BulkAddStudents;