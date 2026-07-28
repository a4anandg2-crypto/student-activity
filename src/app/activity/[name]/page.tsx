"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

const ADMIN_EMAIL = "a4anandg2@gmail.com";

export default function ActivityTracker() {
  const params = useParams();
  const router = useRouter();
  
  const activityName = decodeURIComponent(params.name as string);

  const [user, setUser] = useState<User | null>(null);
  const isAdmin = user && user.email === ADMIN_EMAIL;

  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any>({});
  
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedClass, setSelectedClass] = useState("10th");
  const [selectedSection, setSelectedSection] = useState("A");
  const [genderFilter, setGenderFilter] = useState("Boy");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Read class query param if passed from Class Page
    const urlParams = new URLSearchParams(window.location.search);
    const cls = urlParams.get("class");
    if (cls) setSelectedClass(cls);

    fetchStudents();
  }, []);

  useEffect(() => {
    fetchAttendanceForDate(date);
  }, [date]);

  const fetchStudents = async () => {
    const querySnapshot = await getDocs(collection(db, "students"));
    const stds = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    stds.sort((a: any, b: any) => a.roll - b.roll);
    setStudents(stds);
  };

  const fetchAttendanceForDate = async (selectedDate: string) => {
    const querySnapshot = await getDocs(collection(db, `attendance_${selectedDate}`));
    const records: any = {};
    querySnapshot.forEach((doc) => {
      records[doc.id] = doc.data().tasks?.[activityName];
    });
    setAttendance(records);
  };

  const handleStatusChange = (studentId: string, status: boolean) => {
    if (!isAdmin) return; 
    setAttendance((prev: any) => ({
      ...prev,
      [studentId]: status
    }));
  };

  const saveAttendance = async () => {
    if (!isAdmin) return alert("Unauthorized!");
    for (const studentId of Object.keys(attendance)) {
      if (attendance[studentId] !== undefined) {
        const recordRef = doc(db, `attendance_${date}`, studentId);
        await setDoc(recordRef, {
          studentId,
          tasks: {
            [activityName]: attendance[studentId]
          }
        }, { merge: true });
      }
    }
    alert(`${activityName} Record Saved Successfully for ${date}!`);
  };

  const filteredStudents = students.filter(s => 
    (s.className || "10th") === selectedClass && 
    s.section === selectedSection && 
    s.gender === genderFilter
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-3 sm:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden border border-slate-100 p-4 sm:p-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8 pb-4 border-b">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <img src="/logo.svg" alt="AS Logo" className="w-7 h-7 rounded-lg shadow-sm" />
              <button onClick={() => router.push(`/class/${encodeURIComponent(selectedClass)}`)} className="text-indigo-600 font-bold text-sm hover:underline">
                &larr; Back  {selectedClass}
              </button>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-slate-800 break-words">Tracker: <span className="text-indigo-600">{activityName}</span></h1>
          </div>
          <div className="w-full sm:w-auto text-left sm:text-right">
            {!isAdmin && <p className="text-orange-500 font-bold text-xs mb-1">View Only Mode</p>}
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border p-2 rounded-lg font-bold text-sm text-slate-700 shadow-sm outline-none w-full sm:w-auto" />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 sm:gap-4 mb-6 bg-slate-50 p-3 sm:p-4 rounded-lg border items-center">
          <div className="w-[45%] sm:w-auto">
            <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">Class</label>
            <input type="text" value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="border p-2 rounded-lg font-bold text-sm w-full sm:w-28 bg-white" />
          </div>
          <div className="w-[45%] sm:w-auto">
            <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">Section</label>
            <input type="text" value={selectedSection} onChange={e => setSelectedSection(e.target.value.toUpperCase())} className="border p-2 rounded-lg font-bold text-sm w-full sm:w-20 bg-white" maxLength={1} />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto pt-2 sm:pt-0">
            <button onClick={() => setGenderFilter("Boy")} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition shadow-sm ${genderFilter === "Boy" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 border"}`}>Boys</button>
            <button onClick={() => setGenderFilter("Girl")} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition shadow-sm ${genderFilter === "Girl" ? "bg-pink-500 text-white" : "bg-white text-slate-600 border"}`} >Girls</button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
          <table className="w-full text-left border-collapse bg-white text-sm">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="p-3 sm:p-4 font-semibold text-xs sm:text-sm w-14">Roll</th>
                <th className="p-3 sm:p-4 font-semibold text-xs sm:text-sm">Name</th>
                <th className="p-3 sm:p-4 font-semibold text-xs sm:text-sm text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr><td colSpan={3} className="p-6 text-center text-slate-400 text-sm">No students found in Class {selectedClass} - Sec {selectedSection} ({genderFilter}s).</td></tr>
              ) : (
                filteredStudents.map((s, index) => (
                  <tr key={s.id} className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-indigo-50 transition border-b border-slate-100`}>
                    <td className="p-3 sm:p-4 font-bold text-slate-600 text-xs sm:text-sm">{s.roll}</td>
                    <td className="p-3 sm:p-4 font-bold text-slate-800 text-xs sm:text-sm break-words">{s.name}</td>
                    <td className="p-3 sm:p-4">
                      <div className="flex justify-center gap-3">
                        <button
                          disabled={!isAdmin}
                          onClick={() => handleStatusChange(s.id, true)}
                          className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 text-base sm:text-xl font-bold transition-all ${
                            attendance[s.id] === true
                              ? "bg-green-500 border-green-500 text-white shadow-md shadow-green-500/40"
                              : "bg-white border-gray-300 text-gray-300 hover:border-green-400 hover:text-green-400"
                          } ${!isAdmin && "cursor-not-allowed opacity-60"}`}
                          title="Yes"
                        >
                          ✔
                        </button>
                        <button
                          disabled={!isAdmin}
                          onClick={() => handleStatusChange(s.id, false)}
                          className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 text-base sm:text-xl font-bold transition-all ${
                            attendance[s.id] === false
                              ? "bg-red-500 border-red-500 text-white shadow-md shadow-red-500/40"
                              : "bg-white border-gray-300 text-gray-300 hover:border-red-400 hover:text-red-400"
                          } ${!isAdmin && "cursor-not-allowed opacity-60"}`}
                          title="No"
                        >
                          ✖
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {isAdmin && (
          <button onClick={saveAttendance} className="mt-6 sm:mt-8 w-full bg-indigo-600 text-white font-extrabold text-base sm:text-lg py-3.5 sm:py-4 rounded-xl shadow-lg hover:bg-indigo-700 transition-all duration-300">
            Save Class {selectedClass} Sec {selectedSection} - {genderFilter}s Record
          </button>
        )}
      </div>
    </div>
  );
}