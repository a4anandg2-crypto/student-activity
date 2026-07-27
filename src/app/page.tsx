"use client";

import { useState, useEffect } from "react";
import { db, auth, googleProvider } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import Link from "next/link";

const ADMIN_EMAIL = "a4anandg2@gmail.com"; // <-- Yahan apna real Gmail daal dein

export default function HomeDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const isAdmin = user && user.email === ADMIN_EMAIL;

  const [activeTab, setActiveTab] = useState("activities");
  const [students, setStudents] = useState<any[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  
  const [newActivity, setNewActivity] = useState("");
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [className, setClassName] = useState("10th");
  const [section, setSection] = useState("A");
  const [gender, setGender] = useState("Boy");

  // Edit Student States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRoll, setEditRoll] = useState<number | "">("");
  const [editClass, setEditClass] = useState("");
  const [editSection, setEditSection] = useState("");
  const [editGender, setEditGender] = useState("");

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
    alert("Student Details Updated Successfully!");
  };

  const addNewActivity = async () => {
    if (!isAdmin) return alert("Unauthorized! Only Admin can add activities.");
    if (!newActivity.trim()) return;
    const updatedList = [...activities, newActivity.trim()];
    await setDoc(doc(db, "settings", "activities"), { list: updatedList });
    setActivities(updatedList);
    setNewActivity("");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-10">
      <header className="bg-white shadow-sm p-3 sm:p-4 flex flex-wrap justify-between items-center gap-3 mb-6 sm:mb-8 border-b">
        <h1 className="text-xl sm:text-2xl font-extrabold text-indigo-600">AS</h1>
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
              <button onClick={login} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium">Admin Login</button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden border border-slate-100 mx-3 sm:mx-auto">
        <div className="flex bg-slate-800 text-white text-sm sm:text-lg">
          <button className={`flex-1 p-3 sm:p-4 font-semibold transition ${activeTab === "activities" ? "bg-indigo-600" : "hover:bg-slate-700"}`} onClick={() => setActiveTab("activities")}>
            Activities
          </button>
          <button className={`flex-1 p-3 sm:p-4 font-semibold transition ${activeTab === "students" ? "bg-indigo-600" : "hover:bg-slate-700"}`} onClick={() => setActiveTab("students")}>
            Students
          </button>
        </div>

        <div className="p-4 sm:p-8">
          {activeTab === "activities" && (
            <div>
              {isAdmin && (
                <div className="flex flex-col sm:flex-row gap-2 mb-6 sm:mb-8 bg-slate-50 p-3 sm:p-4 rounded-lg border">
                  <input type="text" placeholder="New Activity Name (e.g. Nails)" value={newActivity} onChange={e => setNewActivity(e.target.value)} className="border p-2.5 rounded-lg flex-1 text-sm sm:text-base outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button onClick={addNewActivity} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-md transition">+ Create</button>
                </div>
              )}

              <h2 className="text-lg sm:text-xl font-bold mb-4 text-slate-700 border-b pb-2">Select Activity to Track</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {activities.map((act, idx) => (
                  <Link key={idx} href={`/activity/${encodeURIComponent(act)}`}>
                    <div className="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 p-5 sm:p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer text-center font-bold text-lg sm:text-xl h-full flex items-center justify-center">
                      {act}
                    </div>
                  </Link>
                ))}
                {activities.length === 0 && <p className="text-slate-400 text-sm">No activities added yet.</p>}
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
                    <div className="w-[48%]: sm:w-24">
                      <input required type="number" placeholder="Roll" value={roll} onChange={e => setRoll(e.target.value)} className="w-full border p-2.5 sm:p-3 rounded-lg text-sm" />
                    </div>
                    <div className="w-[48%]: sm:w-28">
                      <input required type="text" placeholder="Class" value={className} onChange={e => setClassName(e.target.value)} className="w-full border p-2.5 sm:p-3 rounded-lg text-sm" />
                    </div>
                    <div className="w-[48%]: sm:w-24">
                      <input required type="text" placeholder="Sec" value={section} onChange={e => setSection(e.target.value.toUpperCase())} className="w-full border p-2.5 sm:p-3 rounded-lg text-sm" maxLength={1} />
                    </div>
                    <div className="w-[48%]: sm:w-32">
                      <select value={gender} onChange={e => setGender(e.target.value)} className="w-full border p-2.5 sm:p-3 rounded-lg text-sm">
                        <option value="Boy">Boy</option>
                        <option value="Girl">Girl</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full sm:w-auto bg-indigo-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-bold text-sm">Add Student</button>
                  </form>
                </div>
              )}
              
              <h3 className="text-lg sm:text-xl font-bold mb-4 text-slate-800 border-b pb-2">Registered Students ({students.length})</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {students.map(s => (
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
                          <span className="font-bold text-base sm:text-lg text-slate-800 break-words">{s.name}</span>
                          {isAdmin && (
                            <button onClick={() => startEditing(s)} className="text-indigo-600 hover:text-indigo-800 text-xs font-bold bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200 shrink-0">
                              Edit
                            </button>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-500 mt-3 flex flex-wrap gap-2 justify-between border-t pt-2">
                          <span className="bg-slate-100 px-2 py-0.5 rounded">Roll: {s.roll}</span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded">Class: {s.className || "10th"} ({s.section})</span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded">{s.gender}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}