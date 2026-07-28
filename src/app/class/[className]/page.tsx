"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";

export default function ClassActivitiesPage() {
  const params = useParams();
  const router = useRouter();
  const className = decodeURIComponent(params.className as string);

  const [activities, setActivities] = useState<string[]>([]);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    const docSnap = await getDoc(doc(db, "settings", "activities"));
    if (docSnap.exists()) {
      setActivities(docSnap.data().list || []);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 sm:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden border border-slate-100 p-6 sm:p-8">
        
        <div className="flex items-center gap-3 mb-6 pb-4 border-b">
          <img src="/logo.svg" alt="AS Logo" className="w-8 h-8 rounded-lg shadow-sm" />
          <button onClick={() => router.push("/")} className="text-indigo-600 font-bold text-sm hover:underline">
            &larr; Back to Classes
          </button>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
            Class: <span className="text-indigo-600">{className}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Select an activity card to track attendance for this class.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {activities.map((act, idx) => (
            <Link key={idx} href={`/activity/${encodeURIComponent(act)}?class=${encodeURIComponent(className)}`}>
              <div className="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer text-center font-bold text-lg h-28 flex items-center justify-center">
                {act}
              </div>
            </Link>
          ))}
          {activities.length === 0 && <p className="text-slate-400 text-sm">No activities available.</p>}
        </div>
      </div>
    </div>
  );
}