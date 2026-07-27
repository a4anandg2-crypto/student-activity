"use client";

import { useState, useEffect } from "react";
import { db, auth, googleProvider } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import Link from "next/link";

const ADMIN_EMAIL = "a4Anandg2@gmail.com"; // <-- Yahan apna real Gmail daal dein

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
      <header className="bg-white shadow-sm p-4 flex justify-between items-center mb-8 border-b">
        <h1 className="text-2xl font-extrabold text-indigo-600">AS</h1>
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${isAdmin ? "text-green-600 bg-green-100" : "text-orange-600 bg-orange-100"}`}>
                {isAdmin ? "Admin Access" : "Logged In (Not Admin)"}
              </span>
              <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium">Logout</button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">View Only</span>
              <button onClick={login} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium">Admin Login</button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden border border-slate-100">
        <div className="flex bg-slate-800 text-white">
          <button className={`flex-1 p-4 font-semibold text-lg transition ${activeTab === "activities" ? "bg-indigo-600" : "hover:bg-slate-700"}`} onClick={() => setActiveTab("activities")}>
            Activities Dashboard
          </button>
          <button className={`flex-1 p-4 font-semibold text-lg transition ${activeTab === "students" ? "bg-indigo-600" : "hover:bg-slate-700"}`} onClick={() => setActiveTab("students")}>
            Manage Students
          </button>
        </div>

        <div className="p-8">
          {activeTab === "activities" && (
            <div>
              {isAdmin && (
                <div className="flex gap-2 mb-8 bg-slate-50 p-4 rounded-lg border">
                  <input type="text" placeholder="New Activity Name (e.g. Nails)" value={newActivity} onChange={e => setNewActivity(e.target.value)} className="border p-2 rounded-lg flex-1 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button onClick={addNewActivity} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow-md transition">+ Create Activity</button>
                </div>
              )}

              <h2 className="text-xl font-bold mb-4 text-slate-700 border-b pb-2">Select Activity to Track</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {activities.map((act, idx) => (
                  <Link key={idx} href={`/activity/${encodeURIComponent(act)}`}>
                    <div className="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer text-center font-bold text-xl h-full flex items-center justify-center">
                      {act}
                    </div>
                  </Link>
                ))}
                {activities.length === 0 && <p className="text-slate-400">No activities added yet.</p>}
              </div>
            </div>
          )}

          {activeTab === "students" && (
            <div>
              {isAdmin && (
                <div className="mb-10 bg-slate-50 p-6 rounded-lg border border-slate-200">
                  <h2 className="text-xl font-bold mb-4 text-slate-700">Add New Student</h2>
                  <form onSubmit={addStudent} className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[180px]">
                      <input required type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="w-full border p-3 rounded-lg" />
                    </div>
                    <div className="w-24">
                      <input required type="number" placeholder="Roll" value={roll} onChange={e => setRoll(e.target.value)} className="w-full border p-3 rounded-lg" />
                    </div>
                    <div className="w-28">
                      <input required type="text" placeholder="Class" value={className} onChange={e => setClassName(e.target.value)} className="w-full border p-3 rounded-lg" />
                    </div>
                    <div className="w-24">
                      <input required type="text" placeholder="Sec" value={section} onChange={e => setSection(e.target.value.toUpperCase())} className="w-full border p-3 rounded-lg" maxLength={1} />
                    </div>
                    <div className="w-32">
                      <select value={gender} onChange={e => setGender(e.target.value)} className="w-full border p-3 rounded-lg">
                        <option value="Boy">Boy</option>
                        <option value="Girl">Girl</option>
                      </select>
                    </div>
                    <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold">Add</button>
                  </form>
                </div>
              )}
              <h3 className="text-xl font-bold mb-4 text-slate-800 border-b pb-2">Registered Students ({students.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {students.map(s => (
                  <div key={s.id} className="border p-4 rounded-lg bg-white shadow-sm">
                    <span className="font-bold text-lg">{s.name}</span>
                    <div className="text-sm text-slate-500 mt-2 flex justify-between">
                      <span>Roll: {s.roll}</span><span>Class: {s.className || "10th"} ({s.section})</span><span>{s.gender}</span>
                    </div>
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