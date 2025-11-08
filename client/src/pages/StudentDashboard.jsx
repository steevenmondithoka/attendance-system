import React, { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import jwtDecode from 'jwt-decode';
import _ from 'lodash';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLocation } from 'react-router-dom';

// Import your logo from the `public` folder
import logo from '/rgukt-ongole-logo.jpeg';

// --- Component & UI Imports ---
import ChangePasswordForm from '../components/ChangePasswordForm';
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertCircle, CheckCircle, Clock, Percent, User, XCircle, Download, Mail, Hash, Calendar, Building2, FileCheck2, UserX, Loader2 } from 'lucide-react';

// --- New Loader Component ---
const Spinner = ({ text = "Loading data..." }) => (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-md">{text}</p>
    </div>
);
// ----------------------------

// --- Professional PDF Generation Utility ---
const generateAttendanceReportPdf = (logoImage, student, tableData, summary, title, fileName) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Header
    doc.addImage(logoImage, 'JPEG', 12, 15, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('Rajiv Gandhi University of Knowledge Technologies', pageWidth / 2, 22, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Ongole Campus, Andhra Pradesh', pageWidth / 2, 30, { align: 'center' });
    doc.setLineWidth(0.5);
    doc.line(14, 40, pageWidth - 14, 40);

    // Student Details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Student Attendance Report', 14, 50);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report For: ${title}`, 14, 56);
    doc.text(`Student: ${student.name} (${student.rollNo})`, 14, 62);
    doc.text(`Department: ${student.department}`, 14, 68);
    doc.text(`Year: ${student.year}`, 80, 68);

    // Attendance Table
    autoTable(doc, {
        head: tableData.head,
        body: tableData.body,
        startY: 75,
        theme: 'grid',
        headStyles: { fillColor: [22, 77, 99], textColor: 255, fontStyle: 'bold' },
        willDrawCell: (data) => {
            if (data.column.dataKey === 5) {
                const status = data.cell.raw;
                let textColor = [0, 0, 0];
                if (status === 'Absent') {
                    doc.setFillColor(255, 235, 238);
                    textColor = [199, 44, 65];
                } else if (status === 'Present') { textColor = [34, 139, 34]; }
                else if (status === 'Late') { textColor = [245, 158, 11]; }
                doc.setTextColor(...textColor);
            }
        },
        didDrawCell: () => doc.setTextColor(0, 0, 0),
        didDrawPage: (data) => {
            const pageStr = `Page ${data.pageNumber}`;
            doc.setFontSize(8);
            doc.text(pageStr, data.settings.margin.left, pageHeight - 10);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth - data.settings.margin.right, pageHeight - 10, { align: 'right' });
        }
    });

    // Summary and Signature
    const finalY = doc.lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Attendance Summary', 14, finalY + 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Present: ${summary.present}`, 14, finalY + 22);
    doc.text(`Total Absent: ${summary.absent}`, 14, finalY + 28);
    doc.text(`Total Late: ${summary.late}`, 14, finalY + 34);
    doc.setFont('helvetica', 'bold');
    doc.text(`Overall Percentage: ${summary.percentage}%`, 14, finalY + 40);
    doc.setLineWidth(0.2);
    doc.line(pageWidth - 60, finalY + 40, pageWidth - 14, finalY + 40);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Authorized Signature', pageWidth - 60, finalY + 45);

    doc.save(`${fileName}.pdf`);
};


const StudentDashboard = () => {
    // --- State Management ---
    const [allAttendance, setAllAttendance] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [availableMonths, setAvailableMonths] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('all');
    const [timeFilter, setTimeFilter] = useState('all');
    const [userDetails, setUserDetails] = useState({ name: '', email: '', rollNo: '', year: '', department: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const location = useLocation();

    // --- Data Fetching ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error("Authentication token not found.");
                const decoded = jwtDecode(token);

                const [attendanceRes, profileRes] = await Promise.all([
                    api.get(`/attendance/student/${decoded.id}`),
                    api.get(`/students/me`)
                ]);

                setAllAttendance(attendanceRes.data);
                setUserDetails({
                    name: decoded.name,
                    email: decoded.email,
                    rollNo: profileRes.data.data.rollNo,
                    year: profileRes.data.data.year,
                    department: profileRes.data.data.department
                });

                const uniqueSubjects = [...new Set(attendanceRes.data.map(item => item.classId?.subject).filter(Boolean))];
                setSubjects(uniqueSubjects);
                const uniqueMonths = [...new Set(attendanceRes.data.map(item => item.date.substring(0, 7)))];
                const monthOptions = uniqueMonths.map(monthStr => {
                    const date = new Date(monthStr + '-02');
                    return { value: monthStr, label: date.toLocaleString('default', { month: 'long', year: 'numeric' }) };
                }).sort((a, b) => b.value.localeCompare(a.value));
                setAvailableMonths(monthOptions);
            } catch (err) {
                console.error("Error fetching student data:", err);
                setError("Failed to load dashboard data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [location]);

    // --- Memoized Data Processing ---
    const filteredAttendance = useMemo(() => {
        return allAttendance.filter(record => {
            const subjectMatch = selectedSubject === 'all' || record.classId?.subject === selectedSubject;

            if (timeFilter === 'all') return subjectMatch;

            // Timezone-Aware Filtering Logic
            const recordDate = new Date(record.date);
            const [filterYear, filterMonth] = timeFilter.split('-').map(Number);
            // Date.getMonth() is 0-indexed, so we compare with month - 1
            const timeMatch = recordDate.getFullYear() === filterYear && (recordDate.getMonth() + 1) === filterMonth;

            return subjectMatch && timeMatch;
        });
    }, [allAttendance, selectedSubject, timeFilter]);

    const summary = useMemo(() => {
        let present = 0, absent = 0, late = 0;
        // ONLY calculate overall summary on ALL subjects
        const recordsToSummarize = selectedSubject === 'all' ? allAttendance : filteredAttendance;

        recordsToSummarize.forEach(record => {
            const status = record.records[0]?.status;
            if (status === 'Present') present++; else if (status === 'Absent') absent++; else if (status === 'Late') late++;
        });
        const total = recordsToSummarize.length;
        // The overall percentage for the dashboard stats should use ALL attendance records if selectedSubject is 'all'.
        // If a subject is selected, it uses the filteredAttendance.
        const percentage = total > 0 ? (((present + late) / total) * 100).toFixed(1) : 0;
        return { present, absent, late, percentage, total };
    }, [allAttendance, filteredAttendance, selectedSubject]);


    // Determine exam eligibility status
    const isAllowedForExams = useMemo(() => {
        // Must use the summary calculated over ALL attendance records
        const overallTotal = allAttendance.length;
        if (overallTotal === 0) return true; // No records, default to allowed or handle as per policy

        let overallPresent = 0, overallLate = 0;
        allAttendance.forEach(record => {
            const status = record.records[0]?.status;
            if (status === 'Present') overallPresent++; else if (status === 'Late') overallLate++;
        });
        const overallPercentage = ((overallPresent + overallLate) / overallTotal) * 100;
        
        return overallPercentage >= 75;
    }, [allAttendance]);

    const processedChartData = useMemo(() => {
        if (!filteredAttendance) return [];
        const processData = (records) => {
            const pieData = [
                { name: 'Present', value: _.filter(records, r => r.records[0]?.status === 'Present').length, fill: 'hsl(var(--chart-1))' },
                { name: 'Absent', value: _.filter(records, r => r.records[0]?.status === 'Absent').length, fill: 'hsl(var(--chart-2))' },
                { name: 'Late', value: _.filter(records, r => r.records[0]?.status === 'Late').length, fill: 'hsl(var(--chart-3))' }
            ].filter(item => item.value > 0);
            let barData;
            if (timeFilter !== 'all' && timeFilter.includes('-')) {
                // Group by Day for Month-specific view
                const groupedByDay = _.groupBy(records, r => new Date(r.date).getDate());
                barData = Object.keys(groupedByDay).map(day => ({ name: `Day ${day}`, Present: _.filter(groupedByDay[day], d => d.records[0]?.status === 'Present').length, Absent: _.filter(groupedByDay[day], d => d.records[0]?.status === 'Absent').length, Late: _.filter(groupedByDay[day], d => d.records[0]?.status === 'Late').length }));
            } else {
                // Group by Month for All Time view
                const groupedByMonth = _.groupBy(records, r => r.date.substring(0, 7));
                barData = Object.keys(groupedByMonth).map(monthStr => ({ name: new Date(monthStr + '-02').toLocaleString('default', { month: 'short' }), Present: _.filter(groupedByMonth[monthStr], d => d.records[0]?.status === 'Present').length, Absent: _.filter(groupedByMonth[monthStr], d => d.records[0]?.status === 'Absent').length, Late: _.filter(groupedByMonth[monthStr], d => d.records[0]?.status === 'Late').length }));
            }
            return { pieData, barData };
        };
        if (selectedSubject === 'all') {
            const groupedBySubject = _.groupBy(filteredAttendance.filter(r => r.classId?.subject), r => r.classId.subject);
            return Object.keys(groupedBySubject).map(subject => ({ subjectName: subject, ...processData(groupedBySubject[subject]) }));
        }
        return [{ subjectName: selectedSubject, ...processData(filteredAttendance) }];
    }, [filteredAttendance, selectedSubject, timeFilter]);

    // --- Event Handler for PDF Generation ---
    const handleDownloadPdf = () => {
        try {
            if (filteredAttendance.length === 0) {
                alert("No attendance data to export for the selected filters.");
                return;
            }
            // Calculate summary for the currently filtered data
            const currentSummary = (() => {
                let present = 0, absent = 0, late = 0;
                filteredAttendance.forEach(record => {
                    const status = record.records[0]?.status;
                    if (status === 'Present') present++; else if (status === 'Absent') absent++; else if (status === 'Late') late++;
                });
                const total = filteredAttendance.length;
                const percentage = total > 0 ? (((present + late) / total) * 100).toFixed(1) : 0;
                return { present, absent, late, percentage, total };
            })();
            
            const subjectName = selectedSubject === 'all' ? 'All Subjects' : selectedSubject;
            const monthLabel = availableMonths.find(m => m.value === timeFilter)?.label || 'All Time';
            const reportTitle = `${subjectName} (${monthLabel})`;
            const fileName = `Attendance-Report-${userDetails.name.replace(' ', '_')}-${monthLabel.replace(' ', '-')}`;
            const tableHead = [['S.No.', 'Date', 'Class Name', 'Subject', 'Teacher', 'Status']];
            const tableBody = filteredAttendance.map((record, index) => [
                index + 1,
                new Date(record.date).toLocaleDateString(),
                record.classId?.name || 'N/A',
                record.classId?.subject || 'N/A',
                record.classId?.teacherId?.name || 'N/A',
                record.records[0]?.status || 'N/A'
            ]);
            generateAttendanceReportPdf(logo, userDetails, { head: tableHead, body: tableBody }, currentSummary, reportTitle, fileName);
        } catch (error) {
            console.error("CRITICAL ERROR during PDF generation:", error);
            alert("Sorry, there was an error creating the PDF report. Please check the console for details.");
        }
    };

    // --- Conditional Render: Loader/Error ---
    if (loading) return <div className="container mx-auto p-4"><Spinner text="Loading student attendance data and profile..." /></div>;
    if (error) return (<div className="container max-w-lg mx-auto mt-10"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert></div>);

    return (
        <div className="container mx-auto p-4 space-y-6">
            <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
                    <p className="text-muted-foreground">An overview of your attendance records.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    {/* --- Exam Eligibility Popover Button (Conditional Render) --- */}
                    {selectedSubject === 'all' && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={isAllowedForExams ? 'default' : 'destructive'}
                                    className="w-full sm:w-auto shrink-0"
                                >
                                    {isAllowedForExams ? (
                                        <><FileCheck2 className="mr-2 h-4 w-4" />Allowed for Exams</>
                                    ) : (
                                        <><UserX className="mr-2 h-4 w-4" />Detained</>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4" align="end">
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-lg border-b pb-2">Overall Exam Eligibility</h4>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Overall Percentage:</span>
                                        <span className={`font-bold text-xl ${isAllowedForExams ? 'text-green-600' : 'text-destructive'}`}>{summary.percentage}%</span>
                                    </div>
                                    <div className="pt-2">
                                        {isAllowedForExams ? (
                                            <Alert className="bg-green-50 dark:bg-green-950 border-green-500 text-green-700 dark:text-green-300">
                                                <CheckCircle className="h-4 w-4" />
                                                <AlertTitle>Allowed</AlertTitle>
                                                <AlertDescription>Your attendance meets the minimum requirement of 75%.</AlertDescription>
                                            </Alert>
                                        ) : (
                                            <Alert variant="destructive">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertTitle>Detained</AlertTitle>
                                                <AlertDescription>Your attendance is below the minimum 75% requirement.</AlertDescription>
                                            </Alert>
                                        )}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}

                    {/* --- Existing: User Profile Popover --- */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Card className="p-3 w-full sm:w-auto shrink-0 cursor-pointer hover:bg-accent transition-colors">
                                <div className="flex items-center space-x-3">
                                    <User className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-semibold text-sm">{userDetails.name}</p>
                                        <p className="text-xs text-muted-foreground">{userDetails.email}</p>
                                    </div>
                                </div>
                            </Card>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="end">
                            <div className="grid gap-4">
                                <div className="space-y-1">
                                    <h4 className="font-medium leading-none">Student Profile</h4>
                                    <p className="text-sm text-muted-foreground">Your academic details.</p>
                                </div>
                                <div className="grid gap-2 text-sm">
                                    <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span className="font-semibold">Name: {userDetails.name}</span></div>
                                    <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span>Mail: {userDetails.email}</span></div>
                                    <div className="flex items-center gap-2"><Hash className="h-4 w-4 text-muted-foreground" /><span>ID: {userDetails.rollNo}</span></div>
                                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>Year: {userDetails.year}</span></div>
                                    <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /><span>Dept: {userDetails.department}</span></div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </header>

            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Present</CardTitle><CheckCircle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{summary?.present || 0}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Absent</CardTitle><XCircle className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{summary?.absent || 0}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Late</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{summary?.late || 0}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Overall %</CardTitle><Percent className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-primary">{summary?.percentage || 0}%</div></CardContent></Card>
            </section>

            <Card>
                <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                        <CardTitle className="text-lg">Filter Records</CardTitle>
                        <CardDescription>Select filters to view specific records and generate a report.</CardDescription>
                    </div>
                    <Button onClick={handleDownloadPdf} className="w-full mt-4 sm:w-auto sm:mt-0">
                        <Download className="mr-2 h-4 w-4" />
                        Download Report
                    </Button>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-4">
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}><SelectTrigger className="w-full md:w-[280px]"><SelectValue placeholder="Select a subject" /></SelectTrigger><SelectContent><SelectItem value="all">All Subjects</SelectItem>{subjects?.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent></Select>
                    <Select value={timeFilter} onValueChange={setTimeFilter}><SelectTrigger className="w-full md:w-[280px]"><SelectValue placeholder="Select a month" /></SelectTrigger><SelectContent><SelectItem value="all">All Time</SelectItem>{availableMonths?.map(m => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}</SelectContent></Select>
                </CardContent>
            </Card>

            <main className="space-y-8">
                {summary?.total > 0 && processedChartData?.map((data) => (
                    <div key={data.subjectName} className="space-y-6 border-t pt-8">
                        <h2 className="text-2xl font-bold tracking-tight text-center md:text-left">{data.subjectName}</h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                            <Card className="lg:col-span-2"><CardHeader><CardTitle>Attendance Breakdown</CardTitle></CardHeader><CardContent className="pl-2"><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={data.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{data.pieData.map((e, i) => (<Cell key={`cell-${i}`} fill={e.fill} />))}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></CardContent></Card>
                            <Card className="lg:col-span-3"><CardHeader><CardTitle>{timeFilter === 'all' ? 'Monthly' : 'Daily'} Summary</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={250}><BarChart data={data.barData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="Present" stackId="a" fill="hsl(var(--chart-1))" /><Bar dataKey="Absent" stackId="a" fill="hsl(var(--chart-2))" /><Bar dataKey="Late" stackId="a" fill="hsl(var(--chart-3))" /></BarChart></ResponsiveContainer></CardContent></Card>
                        </div>
                    </div>
                ))}
                {summary?.total === 0 && !loading && <div className="text-center text-muted-foreground py-10">No attendance records found for the selected filters.</div>}
            </main>

            <Card>
                <CardHeader>
                    <CardTitle>Attendance History</CardTitle>
                    <CardDescription>A log of your attendance records matching the current filters.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>S.No.</TableHead><TableHead>Date</TableHead><TableHead>Class Name</TableHead><TableHead>Subject</TableHead><TableHead>Teacher</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {filteredAttendance.length > 0 ? filteredAttendance.map((r, index) => (
                                <TableRow key={r._id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell className="font-medium">{new Date(r.date).toLocaleDateString()}</TableCell>
                                    <TableCell>{r.classId?.name || 'N/A'}</TableCell>
                                    <TableCell>{r.classId?.subject || 'N/A'}</TableCell>
                                    <TableCell>{r.classId?.teacherId?.name || 'N/A'}</TableCell>
                                    <TableCell className="text-right"><Badge variant={r.records[0]?.status === 'Present' ? 'success' : r.records[0]?.status === 'Absent' ? 'destructive' : 'secondary'}>{r.records[0]?.status || 'N/A'}</Badge></TableCell>
                                </TableRow>
                            )) : (
                                <TableRow><TableCell colSpan={6} className="h-24 text-center">No records found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                {showPasswordForm ? (<ChangePasswordForm onCancel={() => setShowPasswordForm(false)} />) : (<><CardHeader><CardTitle>Account Settings</CardTitle></CardHeader><CardContent><Button onClick={() => setShowPasswordForm(true)}>Change My Password</Button></CardContent></>)}
            </Card>
        </div>
    );
};

export default StudentDashboard;