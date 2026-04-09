import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { classApi, type ClassData, type LeaderboardEntry } from '../lib/api';

const WORLD_COLORS: Record<string, string> = {
  'Number Kingdom': '#FF6B6B',
  'Shape Realm': '#4ECDC4',
  'Fractions Fortress': '#45B7D1',
  'Algebra Jungle': '#96CEB4',
  'Ratio Ruins': '#FFEAA7',
  'Graph Galaxy': '#DDA0DD',
  'Data City': '#F0E68C',
};

interface DashboardProps {
  classId: string;
}

function StudentRow({ student, rank }: { student: ClassData['students'][number]; rank: number }) {
  const totalProgress = student.worldProgress.reduce((sum, wp) => sum + wp.percentComplete, 0);
  const avgProgress = student.worldProgress.length > 0 ? totalProgress / student.worldProgress.length : 0;

  return (
    <motion.tr
      className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
    >
      <td className="py-3 px-4">
        <span className="text-gray-500 text-sm">#{rank}</span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-mq-purple/30 flex items-center justify-center text-sm font-bold text-purple-300">
            {student.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-white font-medium">{student.name}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className="text-mq-gold font-bold">{student.xp.toLocaleString()}</span>
          <span className="text-xs text-gray-500">XP</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="bg-mq-purple/20 text-purple-300 px-2 py-0.5 rounded-full text-sm">
          Lv. {student.level}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className={`text-sm ${student.streakDays >= 3 ? 'text-orange-400' : 'text-gray-400'}`}>
          {student.streakDays > 0 ? `🔥 ${student.streakDays}d` : '—'}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="flex gap-1">
          {student.worldProgress.map((wp) => (
            <div
              key={wp.world.id}
              className="w-6 h-6 rounded flex items-center justify-center text-xs"
              style={{ backgroundColor: `${wp.world.color}33`, title: wp.world.name }}
              title={`${wp.world.name}: ${Math.round(wp.percentComplete)}%`}
            >
              {wp.world.iconEmoji}
            </div>
          ))}
          {student.worldProgress.length === 0 && <span className="text-gray-600 text-sm">No attempts</span>}
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden w-20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-mq-purple to-emerald-400"
              style={{ width: `${Math.round(avgProgress)}%` }}
            />
          </div>
          <span className="text-xs text-gray-400">{Math.round(avgProgress)}%</span>
        </div>
      </td>
    </motion.tr>
  );
}

export function Dashboard({ classId }: DashboardProps) {
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'progress'>('overview');

  useEffect(() => {
    Promise.all([
      classApi.getClass(classId),
      classApi.getLeaderboard(classId).catch(() => ({ data: { leaderboard: [] } })),
    ])
      .then(([classRes, lbRes]) => {
        setClassData(classRes.data);
        setLeaderboard(lbRes.data.leaderboard);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [classId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading class data...
      </div>
    );
  }

  if (!classData) {
    return <div className="text-red-400 p-8">Failed to load class data.</div>;
  }

  // World progress chart data
  const worldChartData = Array.from({ length: 7 }, (_, i) => {
    const worldName = Object.keys(WORLD_COLORS)[i];
    const studentsWithProgress = classData.students.filter((s) =>
      s.worldProgress.some((wp) => wp.world.orderIndex === i + 1),
    );
    const avgPct =
      studentsWithProgress.length > 0
        ? studentsWithProgress.reduce((sum, s) => {
            const wp = s.worldProgress.find((w) => w.world.orderIndex === i + 1);
            return sum + (wp?.percentComplete ?? 0);
          }, 0) / studentsWithProgress.length
        : 0;
    return { name: worldName?.replace(' ', '\n') ?? `World ${i + 1}`, avg: Math.round(avgPct), color: Object.values(WORLD_COLORS)[i] };
  });

  const sortedStudents = [...classData.students].sort((a, b) => b.xp - a.xp);
  const atRiskStudents = classData.students.filter((s) => s.streakDays === 0 && s.xp < 50);

  return (
    <div className="min-h-screen bg-gray-950 text-white font-body">
      {/* Top bar */}
      <header className="bg-gray-900 border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">📊 {classData.name}</h1>
          <p className="text-sm text-gray-400">{classData.students.length} students</p>
        </div>
        <div className="flex gap-2">
          {(['overview', 'leaderboard', 'progress'] as const).map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                activeTab === tab ? 'bg-mq-purple text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Students', value: classData.students.length, icon: '👥' },
                { label: 'Avg XP', value: Math.round(classData.students.reduce((s, st) => s + st.xp, 0) / (classData.students.length || 1)).toLocaleString(), icon: '⭐' },
                { label: 'Active Streaks', value: classData.students.filter((s) => s.streakDays >= 3).length, icon: '🔥' },
                { label: 'At Risk', value: atRiskStudents.length, icon: '⚠️' },
              ].map((stat) => (
                <div key={stat.label} className="bg-gray-900 rounded-xl p-4 border border-white/5">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* World progress chart */}
            <div className="bg-gray-900 rounded-xl p-5 border border-white/5">
              <h2 className="text-lg font-bold mb-4">Class Average Progress by World</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={worldChartData} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                  <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: 8 }}
                    formatter={(val: number) => [`${val}%`, 'Avg completion']}
                  />
                  <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
                    {worldChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* At-risk students */}
            {atRiskStudents.length > 0 && (
              <div className="bg-red-950/40 border border-red-500/20 rounded-xl p-4">
                <h3 className="text-red-400 font-bold mb-2">⚠️ Students who may need support</h3>
                <div className="flex flex-wrap gap-2">
                  {atRiskStudents.map((s) => (
                    <span key={s.id} className="bg-red-900/40 text-red-200 px-3 py-1 rounded-full text-sm">
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="bg-gray-900 rounded-xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h2 className="font-bold text-lg">Weekly XP Leaderboard</h2>
              <span className="text-xs text-gray-500">Resets every Monday</span>
            </div>
            {leaderboard.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No weekly XP data yet</div>
            ) : (
              <div className="divide-y divide-gray-800">
                {leaderboard.map((entry) => (
                  <div key={entry.userId} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-800/40">
                    <span className={`text-lg font-bold w-8 ${entry.rank <= 3 ? 'text-mq-gold' : 'text-gray-500'}`}>
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                    </span>
                    <div className="flex-1">
                      <span className="text-white font-medium">{entry.name}</span>
                      <span className="ml-2 text-xs text-gray-500">Lv.{entry.level}</span>
                    </div>
                    <span className="text-mq-gold font-bold">{entry.weeklyXp} XP</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="bg-gray-900 rounded-xl border border-white/5 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-left">
                  {['#', 'Student', 'XP', 'Level', 'Streak', 'Worlds', 'Avg Progress'].map((h) => (
                    <th key={h} className="py-3 px-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedStudents.map((student, i) => (
                  <StudentRow key={student.id} student={student} rank={i + 1} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
