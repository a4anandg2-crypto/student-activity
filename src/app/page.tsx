"use client";

import { useState, useEffect } from "react";
import { db, auth, googleProvider } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import Link from "next/link";

const ADMIN_EMAIL = "a4anandg2@gmail.com";

export default function HomeDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const isAdmin = user && user.email === ADMIN_EMAIL;

  const [activeTab, setActiveTab] = useState("classes");
  const [students, setStudents] = useState<any[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  
  const [newActivity, setNewActivity] = useState("");
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [className, setClassName] = useState("10th");
  const [section, setSection] = useState("A");
  const [gender, setGender] = useState("Boy");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRoll, setEditRoll] = useState<number | "">("");
  const [editClass, setEditClass] = useState("");
  const [editSection, setEditSection] = useState("");
  const [editGender, setEditGender] = useState("");

  const [filterClass, setFilterClass] = useState("All");
  const [filterSection, setFilterSection] = useState("All");
  const [filterGender, setFilterGender] = useState("All");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchActivities();
  }, []);

  const login = () => signInWithPopup(auth, googleProvider);
  const logout = () => signOut(auth);

  const fetchStudents = async () => {
    const querySnapshot = await getDocs(collection(db, "students"));
    const stds = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    stds.sort((a: any, b: any) => a.roll - b.roll);
    setStudents(stds);
  };

  const fetchActivities = async () => {
    const docSnap = await getDoc(doc(db, "settings", "activities"));
    if (docSnap.exists()) {
      setActivities(docSnap.data().list || []);
    }
  };

  const addStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return alert("Unauthorized! Only Admin can add students.");
    await addDoc(collection(db, "students"), { name, roll: Number(roll), className, section, gender });
    setName(""); setRoll(""); fetchStudents(); alert("Student Added!");
  };

  const deleteStudent = async (id: string) => {
    if (!isAdmin) return;
    if (confirm("Are you sure you want to delete this student?")) {
      await deleteDoc(doc(db, "students", id));
      fetchStudents();
    }
  };

  const startEditing = (s: any) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditRoll(s.roll);
    setEditClass(s.className || "10th");
    setEditSection(s.section);
    setEditGender(s.gender || "Boy");
  };

  const saveEdit = async (id: string) => {
    if (!isAdmin) return;
    await updateDoc(doc(db, "students", id), {
      name: editName,
      roll: Number(editRoll),
      className: editClass,
      section: editSection,
      gender: editGender
    });
    setEditingId(null);
    fetchStudents();
    alert("Student Updated Successfully!");
  };

  const addNewActivity = async () => {
    if (!isAdmin) return alert("Unauthorized!");
    if (!newActivity.trim()) return;
    const updatedList = [...activities, newActivity.trim()];
    await setDoc(doc(db, "settings", "activities"), { list: updatedList });
    setActivities(updatedList);
    setNewActivity("");
  };

  const deleteActivity = async (actToDelete: string) => {
    if (!isAdmin) return;
    if (confirm(`Delete activity "${actToDelete}"?`)) {
      const updatedList = activities.filter(act => act !== actToDelete);
      await setDoc(doc(db, "settings", "activities"), { list: updatedList });
      setActivities(updatedList);
    }
  };

  const uniqueClasses = Array.from(new Set(students.map(s => s.className || "10th")));
  if (uniqueClasses.length === 0) uniqueClasses.push("10th");
  const uniqueSections = Array.from(new Set(students.map(s => s.section))).sort();

  const displayedStudents = students.filter(s => {
    const matchClass = filterClass === "All" || (s.className || "10th") === filterClass;
    const matchSection = filterSection === "All" || s.section === filterSection;
    const matchGender = filterGender === "All" || s.gender === filterGender;
    return matchClass && matchSection && matchGender;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-10">
      <header className="bg-white shadow-sm p-3 sm:p-4 flex flex-wrap justify-between items-center gap-3 mb-6 sm:mb-8 border-b">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="AS Logo" className="w-9 h-9 rounded-xl shadow-sm" />
        </div>
        <div>
          {user ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <span className={`text-xs sm:text-sm font-semibold px-2.5 sm:px-3 py-1 rounded-full ${isAdmin ? "text-green-600 bg-green-100" : "text-orange-600 bg-orange-100"}`}>
                {isAdmin ? "Admin" : "Not Admin"}
              </span>
              <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium">Logout</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm font-semibold text-gray-500 bg-gray-100 px-2.5 sm:px-3 py-1 rounded-full">View Only</span>
              <button onClick={login} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium">Admin</button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden border border-slate-100 mx-3 sm:mx-auto">
        <div className="flex bg-slate-800 text-white text-sm sm:text-lg">
          <button className={`flex-1 p-3 sm:p-4 font-semibold transition ${activeTab === "classes" ? "bg-indigo-600" : "hover:bg-slate-700"}`} onClick={() => setActiveTab("classes")}>
            Select Class
          </button>
          <button className={`flex-1 p-3 sm:p-4 font-semibold transition ${activeTab === "students" ? "bg-indigo-600" : "hover:bg-slate-700"}`} onClick={() => setActiveTab("students")}>
            Manage Students
          </button>
        </div>

        <div className="p-4 sm:p-8">
          {activeTab === "classes" && (
            <div>
              {isAdmin && (
                <div className="mb-8 bg-slate-50 p-4 rounded-lg border">
                  <h3 className="text-sm font-bold text-slate-700 mb-2">Global Activity Manager</h3>
                  <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <input type="text" placeholder="New Activity Name (e.g. Nails)" value={newActivity} onChange={e => setNewActivity(e.target.value)} className="border p-2.5 rounded-lg flex-1 text-sm outline-none" />
                    <button onClick={addNewActivity} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-md">+ Add Activity</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activities.map((act, i) => (
                      <span key={i} className="bg-white border px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm">
                        {act}
                        <button onClick={() => deleteActivity(act)} className="text-red-500 hover:text-red-700 font-extrabold">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <h2 className="text-lg sm:text-xl font-bold mb-4 text-slate-700 border-b pb-2">Select Class</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {uniqueClasses.map((cls, idx) => (
                  <Link key={idx} href={`/class/${encodeURIComponent(cls)}`}>
                    <div className="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer text-center font-bold text-xl h-32 flex flex-col items-center justify-center">
                      <span>Class {cls}</span>
                      <span className="text-xs font-normal opacity-80 mt-1">Click to view activities</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {activeTab === "students" && (
            <div>
              {isAdmin && (
                <div className="mb-8 bg-slate-50 p-4 sm:p-6 rounded-lg border border-slate-200">
                  <h2 className="text-lg sm:text-xl font-bold mb-4 text-slate-700">Add New Student</h2>
                  <form onSubmit={addStudent} className="flex flex-wrap gap-3 sm:gap-4 items-end">
                    <div className="w-full sm:flex-1 min-w-[180px]">
                      <input required type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="w-full border p-2.5 sm:p-3 rounded-lg text-sm" />
                    </div>
                    <div className="w-[48%] sm:w-24">
                      <input required type="number" placeholder="Roll" value={roll} onChange={e => setRoll(e.target.value)} className="w-full border p-2.5 sm:p-3 rounded-lg text-sm" />
                    </div>
                    <div className="w-[48%] sm:w-28">
                      <input required type="text" placeholder="Class" value={className} onChange={e => setClassName(e.target.value)} className="w-full border p-2.5 sm:p-3 rounded-lg text-sm" />
                    </div>
                    <div className="w-[48%] sm:w-24">
                      <input required type="text" placeholder="Sec" value={section} onChange={e => setSection(e.target.value.toUpperCase())} className="w-full border p-2.5 sm:p-3 rounded-lg text-sm" maxLength={1} />
                    </div>
                    <div className="w-[48%] sm:w-32">
                      <select value={gender} onChange={e => setGender(e.target.value)} className="w-full border p-2.5 sm:p-3 rounded-lg text-sm">
                        <option value="Boy">Boy</option>
                        <option value="Girl">Girl</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full sm:w-auto bg-indigo-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-bold text-sm">Add Student</button>
                  </form>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 border-b pb-2">
                <h3 className="text-lg sm:text-xl font-bold text-slate-800">Registered Students ({displayedStudents.length})</h3>
              </div>

              <div className="flex flex-wrap gap-3 mb-6 bg-indigo-50 p-3 sm:p-4 rounded-lg border border-indigo-100 items-center shadow-sm">
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-[10px] sm:text-xs font-bold text-indigo-500 uppercase mb-1">Class</label>
                  <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="w-full border p-2 rounded-lg font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="All">All</option>
                    {uniqueClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                  </select>
                </div>
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-[10px] sm:text-xs font-bold text-indigo-500 uppercase mb-1">Section</label>
                  <select value={filterSection} onChange={e => setFilterSection(e.target.value)} className="w-full border p-2 rounded-lg font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="All">All</option>
                    {uniqueSections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                  </select>
                </div>
                <div className="flex-1 min-w-[130px]">
                  <label className="block text-[10px] sm:text-xs font-bold text-indigo-500 uppercase mb-1">Gender</label>
                  <select value={filterGender} onChange={e => setFilterGender(e.target.value)} className="w-full border p-2 rounded-lg font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="All">All (Both)</option>
                    <option value="Boy">Boys</option>
                    <option value="Girl">Girls</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {displayedStudents.map(s => (
                  <div key={s.id} className="border p-4 rounded-lg bg-white shadow-sm flex flex-col justify-between">
                    {editingId === s.id ? (
                      <div className="space-y-3">
                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full border p-2 rounded text-sm" placeholder="Name" />
                        <div className="flex gap-2">
                          <input type="number" value={editRoll} onChange={e => setEditRoll(Number(e.target.value))} className="w-1/2 border p-2 rounded text-sm" placeholder="Roll" />
                          <input type="text" value={editClass} onChange={e => setEditClass(e.target.value)} className="w-1/2 border p-2 rounded text-sm" placeholder="Class" />
                        </div>
                        <div className="flex gap-2">
                          <input type="text" value={editSection} onChange={e => setEditSection(e.target.value.toUpperCase())} className="w-1/2 border p-2 rounded text-sm" placeholder="Sec" maxLength={1} />
                          <select value={editGender} onChange={e => setEditGender(e.target.value)} className="w-1/2 border p-2 rounded text-sm">
                            <option value="Boy">Boy</option>
                            <option value="Girl">Girl</option>
                          </select>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button onClick={() => saveEdit(s.id)} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold flex-1">Save</button>
                          <button onClick={() => setEditingId(null)} className="bg-gray-400 text-white px-3 py-1.5 rounded text-xs font-bold flex-1">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          {/* Yahan se bracket wala section hata diya hai taaki UI clean rahe */}
                          <span className="font-bold text-base text-slate-800 break-words">{s.name}</span>
                          {isAdmin && (
                            <div className="flex gap-1 shrink-0">
                              <button onClick={() => startEditing(s)} className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded text-xs font-bold border border-indigo-200">Edit</button>
                              <button onClick={() => deleteStudent(s.id)} className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold border border-red-200">Del</button>
                            </div>
                          )}
                        </div>
                        {/* Section yahan bottom tags me clearly dikh hi raha hai! */}
                        <div className="text-xs text-slate-500 mt-3 flex flex-wrap gap-2 justify-between border-t pt-2">
                          <span className="bg-slate-100 px-2 py-0.5 rounded">Roll: {s.roll}</span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded">Class: {s.className || "10th"} ({s.section})</span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded">{s.gender}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {displayedStudents.length === 0 && <p className="text-slate-500 col-span-full">No students found matching these filters.</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}