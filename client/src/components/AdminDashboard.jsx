import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { io } from 'socket.io-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaUsers, FaChalkboardTeacher, FaUserGraduate, FaSchool, FaTimes, FaFilter } from 'react-icons/fa';
import { MdOutlineDoNotDisturbAlt } from 'react-icons/md';
import CreateTeacherForm from './CreateTeacherForm';
import api from '../utils/api'; 

// --- Shadcn UI Imports ---
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button'; 
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"; 
// ---
// --- Lucide Icon Import for Loader ---
import { Loader2 } from 'lucide-react'; 
// ---

// --- CONFIGURATION ---
const API_BASE_URL = 'http://localhost:5000'; // Match your server's port

// --- Reusable Spinner Component ---
const Spinner = ({ text = "Loading dashboard data..." }) => (
    <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-3 text-lg font-medium">{text}</p>
    </div>
);
// -------------------------------------

// --- REUSABLE UI COMPONENTS ---

const Modal = ({ children, isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
            onClick={onClose}
        >
            <div 
                className="bg-background p-6 rounded-xl shadow-2xl relative w-full max-w-4xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Close modal"
                >
                    <FaTimes size={20} />
                </button>
                {children}
            </div>
        </div>
    );
};

const DetailsModal = ({ isOpen, onClose, title, data, isLoading, onDataRefetch }) => { 
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState(''); 
    
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [teacherToDelete, setTeacherToDelete] = useState(null);

    // --- Delete Handlers ---
    const confirmDeleteTeacher = (teacher) => {
        setTeacherToDelete(teacher);
        setIsConfirmOpen(true);
    };

    const executeDeleteTeacher = async () => {
        if (!teacherToDelete) return;

        setIsConfirmOpen(false); 
        
        try {
            await api.delete(`/admin/teachers/${teacherToDelete._id}`); 
            
            setTeacherToDelete(null);
            // This triggers the refetch in the parent component
            onDataRefetch('teachers'); 
        } catch (error) {
            console.error("Failed to delete teacher:", error);
            alert(`Failed to delete teacher: ${teacherToDelete.name}. Check server logs.`);
            setTeacherToDelete(null);
        }
    };
    // --- END Delete Handlers ---


    const renderTeacherItem = (item) => (
        <div className="flex justify-between items-start w-full">
            <div className="flex flex-col space-y-1">
                <p className="font-semibold text-foreground">{item.name}</p>
                <p className="text-sm font-semibold text-muted-foreground">Email: {item.email}</p>
                <p className="text-sm font-medium text-foreground mt-2">Classes Taught ({item.classes.length}):</p>
                <ul className="list-disc list-inside ml-4 text-xs text-muted-foreground">
                    {item.classes.map(c => <li key={c._id}>{c.name} - {c.subject}</li>)}
                </ul>
            </div>
            <Button 
                variant="destructive" 
                size="sm" 
                className="h-8 shrink-0 text-xs" 
                onClick={() => confirmDeleteTeacher(item)}
            >
                Delete
            </Button>
        </div>
    );

    const renderStudentItem = (item) => {
        const percentage = parseFloat(item.overallPercentage);
        const isDetained = percentage < 75.0; 
        
        return (
            <div className="flex flex-col space-y-1">
                <p className="font-semibold text-foreground">{item.name}</p>
                <p className="text-sm font-semibold text-muted-foreground">Roll No: {item.rollNo}</p>
                <p className="text-sm font-medium text-foreground">Dept: {item.department} ({item.year} Year)</p>
                <div className="mt-2 text-sm font-bold">
                    <span className="text-muted-foreground">Overall %: </span>
                    <span className={isDetained ? 'text-destructive' : 'text-green-500'}>
                        {item.overallPercentage || 'N/A'}%
                    </span>
                    <span className={isDetained ? 'text-destructive ml-2' : 'text-muted-foreground ml-2'}>({isDetained ? 'Detained' : 'Allowed'})</span>
                </div>
            </div>
        );
    };

    const renderClassItem = (item) => (
        <div className="flex flex-col space-y-1">
            <p className="font-semibold text-foreground">{item.name}</p>
            <p className="text-sm font-semibold text-muted-foreground">Subject: {item.subject}</p>
            <p className="text-sm font-medium text-foreground">Teacher: {item.teacherName || 'N/A'}</p>
            <p className="text-sm text-muted-foreground">Enrolled: {item.studentCount || 0} Students</p>
        </div>
    );


    const filteredData = useMemo(() => {
        let currentData = data;
        
        // 1. Status Filter (Students Only)
        if (title.includes('Students') && statusFilter === 'detained') {
            currentData = currentData.filter(s => parseFloat(s.overallPercentage) < 75.0);
        }

        // 2. Search Term Filter
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            currentData = currentData.filter(item => {
                const nameMatch = item.name && item.name.toLowerCase().includes(lowerSearch);
                const rollNoMatch = item.rollNo ? item.rollNo.toLowerCase().includes(lowerSearch) : false;
                
                if (title.includes('Students')) {
                    return nameMatch || rollNoMatch;
                }
                return nameMatch;
            });
        }
        
        return currentData;
    }, [data, title, statusFilter, searchTerm]);

    const detainedCount = useMemo(() => {
        if (!data || !data.length || !title.includes('Students')) return 0;
        return data.filter(s => parseFloat(s.overallPercentage) < 75.0).length;
    }, [data, title]);

    const renderItemByTitle = (item) => {
        if (title === 'Teachers & Classes') return renderTeacherItem(item);
        if (title.includes('Students')) return renderStudentItem(item);
        if (title.includes('Classes')) return renderClassItem(item);
        return <div className="text-muted-foreground">Details not available</div>;
    };


    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose}>
                <h2 className="text-2xl font-bold text-foreground mb-5">{title}</h2>
                
                {/* --- Filters and Search Section --- */}
                <div className="mb-4 flex flex-col sm:flex-row gap-4">
                    <Input 
                        placeholder={`Search by name or ${title.includes('Students') ? 'roll no' : 'details'}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-2/3 text-foreground" 
                    />

                    {title.includes('Students') && (
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-1/3">
                                <FaFilter className="mr-2 h-3 w-3 text-muted-foreground" />
                                <SelectValue placeholder="Filter Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Students ({data.length})</SelectItem>
                                <SelectItem value="detained">Detained Only ({detainedCount})</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                </div>
                {/* --- END Filters and Search Section --- */}


                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        {/* Loader for inside the modal */}
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="flex-grow max-h-[60vh] overflow-y-auto pr-2">
                        <ul className="space-y-3">
                            {filteredData.length > 0 ? (
                                filteredData.map((item, index) => (
                                    <li 
                                        key={item._id || index} 
                                        className="bg-muted p-4 rounded-lg border border-border hover:bg-accent transition-colors flex items-center justify-between"
                                    >
                                        {renderItemByTitle(item)} 
                                    </li>
                                ))
                            ) : (
                                <p className="text-muted-foreground text-center py-10">No {title.toLowerCase().replace('all ', '').replace('teachers & classes', 'teachers/students')} found matching your criteria.</p>
                            )}
                        </ul>
                    </div>
                )}
            </Modal>
            
            {/* --- Confirmation Dialog --- */}
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will permanently delete the teacher: <span className="font-semibold">{teacherToDelete?.name}</span>. This includes their user account and removes them from all assigned classes. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={executeDeleteTeacher}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Yes, Delete Teacher
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {/* --- END Confirmation Dialog --- */}
        </>
    );
};

const StatCard = ({ Icon, title, value, color, onClick }) => (
    <div 
        onClick={onClick} 
        className={`bg-card p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-border flex items-center justify-between ${onClick ? 'cursor-pointer' : ''}`}
    >
        <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className="bg-muted p-4 rounded-full">
            <Icon className={`h-7 w-7 ${color}`} />
        </div>
    </div>
);


// --- MAIN DASHBOARD COMPONENT ---

const AdminDashboard = () => {
    const [stats, setStats] = useState({ totalUsers: 0, totalTeachers: 0, totalStudents: 0, totalClasses: 0 });
    const [detainedCount, setDetainedCount] = useState(0); 
    const [activity, setActivity] = useState([]);
    const [isConnected, setIsConnected] = useState(false); 
    // State to track if the *initial* data fetch is complete (for the full screen spinner)
    const [isInitialLoad, setIsInitialLoad] = useState(true); 
    const [isTeacherFormOpen, setIsTeacherFormOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [modalData, setModalData] = useState({ title: '', data: [] });
    // This isLoading is for the data fetch *inside* the modal (DetailsModal)
    const [isLoading, setIsLoading] = useState(false); 
    
    // State to track which modal list is currently open
    const [openModalType, setOpenModalType] = useState(null); 
    
    // --- FETCHING DETAILED DATA (Uses your 'api' utility) ---
    const fetchList = async (endpoint) => {
        try {
            const res = await api.get(endpoint);
            return res.data; 
        } catch (error) {
            console.error(`Could not fetch data from ${endpoint}:`, error);
            if (error.response && error.response.status === 404) {
                 console.warn(`API endpoint ${endpoint} not found. Please create it on the backend.`);
            }
            return []; 
        }
    };

    // --- Refetcher passed to Modal (Memoized with useCallback) ---
    const fetchAndSetModalData = useCallback(async (type) => {
        setIsLoading(true); // Start modal loader
        let title = '';
        let endpoint = '';
        
        switch (type) {
            case 'teachers':
                title = 'Teachers & Classes';
                endpoint = '/admin/teachers/list'; 
                break;
            case 'students':
            case 'detained': 
                title = 'All Students (with Attendance %)';
                endpoint = '/admin/students/list'; 
                break;
            case 'classes':
                title = 'All Classes';
                endpoint = '/admin/classes/list';
                break;
            default:
                setIsLoading(false);
                return;
        }

        const data = await fetchList(endpoint);
        setModalData({ title, data });
        setIsLoading(false); // End modal loader
    }, []); 

    
    // Initial data fetch for detained count and initial stats
    useEffect(() => {
        const fetchInitialStats = async () => {
            try {
                // Fetch detained count
                const detainedRes = await api.get('/admin/report/detained-count'); 
                setDetainedCount(detainedRes.data.count || 0);
            } catch (err) {
                 console.warn("Failed to fetch detained count. Check /admin/report/detained-count endpoint.", err);
                 setDetainedCount(0); 
            } finally {
                // *** END INITIAL LOAD HERE ***
                setIsInitialLoad(false); 
            }
        };
        fetchInitialStats();
    }, []);

    // --- REAL-TIME DATA WITH SOCKET.IO FIX ---
    useEffect(() => {
        // 1. Initialize socket connection
        const newSocket = io(API_BASE_URL);

        // 2. Define Handlers
        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => setIsConnected(false);
        
        const onDashboardUpdate = (data) => {
            console.log("Socket.IO: dashboard_update received.");
            
            // a. Update main dashboard stats
            setStats(data.stats);
            setActivity(prev => [data.latestActivity, ...prev].slice(0, 5));
            if (data.detainedCount !== undefined) setDetainedCount(data.detainedCount);
            
            // b. Conditional refetch for open modal list
            if (isDetailsModalOpen && openModalType) {
               console.log(`Socket.IO update: Refetching ${openModalType} list...`);
               // Call the memoized fetcher
               fetchAndSetModalData(openModalType); 
            }
        };

        // 3. Set up listeners
        newSocket.on('connect', onConnect);
        newSocket.on('disconnect', onDisconnect);
        newSocket.on('dashboard_update', onDashboardUpdate);

        // 4. Cleanup function: runs on unmount
        return () => {
            newSocket.off('connect', onConnect);
            newSocket.off('disconnect', onDisconnect);
            newSocket.off('dashboard_update', onDashboardUpdate);
            newSocket.disconnect(); // CRITICAL: Disconnect the socket on unmount
        };
    // Include dependencies for the inner logic to access the latest state/props
    }, [isDetailsModalOpen, openModalType, fetchAndSetModalData]); 

    // --- MODAL CLICK HANDLER (Fetches REAL Data) ---
    const handleStatCardClick = async (type) => {
        setIsDetailsModalOpen(true);
        setOpenModalType(type); // Set the open modal type
        fetchAndSetModalData(type);
    };

    // Handler to clear state on modal close
    const handleDetailsModalClose = () => {
        setIsDetailsModalOpen(false);
        setOpenModalType(null); // Clear the open modal type
        setModalData({ title: '', data: [] }); 
    };

    // Data formatted for the user distribution bar chart
    const chartData = [
        { name: 'Teachers', count: stats.totalTeachers },
        { name: 'Students', count: stats.totalStudents },
        { name: 'Classes', count: stats.totalClasses },
    ];
    
    // --- CONDITIONAL RENDER FOR INITIAL LOAD ---
    if (isInitialLoad) {
        return <div className="min-h-screen bg-background"><Spinner /></div>;
    }

    return (
        <>
            <div className="min-h-screen bg-background">
                <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
                    
                    <header className="flex flex-wrap justify-between items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground tracking-tight">Management Dashboard</h1>
                            <p className="text-muted-foreground mt-2">Live overview of RGUKT ONGOLE activity.</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Button
                                onClick={() => setIsTeacherFormOpen(true)}
                                className="shadow hover:opacity-90 transition-colors duration-300 flex items-center space-x-2 font-semibold"
                            >
                                <FaUsers className="h-4 w-4" />
                                <span>Add Teacher</span>
                            </Button>
                            <div className="flex items-center space-x-2 bg-card px-3 py-2 rounded-lg shadow-sm border border-border">
                                <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-destructive'}`}></div>
                                <span className="text-sm font-medium text-muted-foreground">{isConnected ? 'Live' : 'Disconnected'}</span>
                            </div>
                        </div>
                    </header>

                    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                        <StatCard Icon={FaUsers} title="Total Users" value={stats.totalUsers} color="text-primary" />
                        <StatCard Icon={FaChalkboardTeacher} title="Teachers" value={stats.totalTeachers} color="text-green-500" onClick={() => handleStatCardClick('teachers')}/>
                        <StatCard Icon={FaUserGraduate} title="Students" value={stats.totalStudents} color="text-indigo-500" onClick={() => handleStatCardClick('students')}/>
                        <StatCard Icon={FaSchool} title="Active Classes" value={stats.totalClasses} color="text-purple-500" onClick={() => handleStatCardClick('classes')}/>
                        <StatCard 
                            Icon={MdOutlineDoNotDisturbAlt} 
                            title="Detained Students" 
                            value={detainedCount} 
                            color="text-destructive" 
                            onClick={() => handleStatCardClick('detained')}
                        />
                    </section>

                    <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-2 bg-card p-6 rounded-xl shadow-md border border-border">
                            <h3 className="text-xl font-semibold text-foreground mb-4">User Distribution</h3>
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                                    <YAxis allowDecimals={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                                    <Legend />
                                    <Bar dataKey="count" fill="hsl(var(--primary))" barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="lg:col-span-1 bg-card p-6 rounded-xl shadow-md border border-border">
                            <h3 className="text-xl font-semibold text-foreground mb-4">Live Activity</h3>
                            <ul className="space-y-4">
                                {activity.length > 0 ? activity.map((act, index) => (
                                    <li key={index} className="flex items-start space-x-3">
                                        <div className="flex-shrink-0 h-2.5 w-2.5 bg-primary rounded-full mt-1.5"></div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{act.action}</p>
                                            <p className="text-xs text-muted-foreground">{act.user} at {act.time}</p>
                                        </div>
                                    </li>
                                )) : (
                                    <p className="text-sm text-muted-foreground text-center py-10">Waiting for system events...</p>
                                )}
                            </ul>
                        </div>
                    </main>
                </div>
            </div>

            <Modal isOpen={isTeacherFormOpen} onClose={() => setIsTeacherFormOpen(false)}>
                <h2 className="text-2xl font-bold text-foreground mb-4">Create New Teacher Account</h2>
                <CreateTeacherForm />
            </Modal>

            <DetailsModal
                isOpen={isDetailsModalOpen}
                onClose={handleDetailsModalClose}
                title={modalData.title}
                data={modalData.data}
                isLoading={isLoading}
                onDataRefetch={fetchAndSetModalData} 
            />
        </>
    );
};

export default AdminDashboard;