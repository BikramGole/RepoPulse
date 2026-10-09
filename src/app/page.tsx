import { Suspense } from 'react';
import { fetchGitHubFollowingStats } from '@/lib/github';
import { sortAndRankUsers } from '@/lib/ranking';
import { Trophy, Github, Star, GitFork, Users, Activity } from 'lucide-react';

export const revalidate = 3600;

async function LeaderboardData() {
  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    return (
      <div className="p-8 rounded-lg border border-red-900/50 bg-red-950/20 text-red-200 text-center">
        <h2 className="text-xl font-bold mb-2">Missing Configuration</h2>
        <p>Please provide a GITHUB_TOKEN in your environment variables to fetch real data.</p>
      </div>
    );
  }

  try {
    // We fetch stats for accounts followed by the user. 
    // You can also change 'BikramGole' to any specific username if needed.
    const users = await fetchGitHubFollowingStats('NeoXBikram', token);
    const rankedUsers = sortAndRankUsers(users, 'score', 'desc');

    return (
      <div className="w-full overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-900/50">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-neutral-400 uppercase bg-neutral-900/80 border-b border-neutral-800">
            <tr>
              <th className="px-6 py-4 font-semibold">Rank</th>
              <th className="px-6 py-4 font-semibold">Developer</th>
              <th className="px-6 py-4 font-semibold text-right">Score</th>
              <th className="px-6 py-4 font-semibold text-right">Commits/Yr</th>
              <th className="px-6 py-4 font-semibold text-right">Followers</th>
              <th className="px-6 py-4 font-semibold text-right">Stars</th>
              <th className="px-6 py-4 font-semibold text-right">Repos</th>
            </tr>
          </thead>
          <tbody>
            {rankedUsers.map((user, idx) => (
              <tr 
                key={user.login} 
                className="border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap font-medium text-neutral-300">
                  <div className="flex items-center gap-2">
                    {idx === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                    {idx === 1 && <Trophy className="w-4 h-4 text-gray-400" />}
                    {idx === 2 && <Trophy className="w-4 h-4 text-amber-600" />}
                    {idx > 2 && <span className="w-4 inline-block text-center">{user.rank}</span>}
                  </div>
                </td>
                <td className="px-6 py-4 font-medium flex items-center gap-3">
                  <img src={user.avatarUrl} alt={user.login} className="w-8 h-8 rounded-full border border-neutral-700" />
                  <div>
                    <a href={`https://github.com/${user.login}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                      {user.name || user.login}
                    </a>
                    {user.name && <div className="text-xs text-neutral-500">{user.login}</div>}
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-mono text-emerald-400">{user.score.toFixed(1)}</td>
                <td className="px-6 py-4 text-right font-mono">{user.totalContributions.toLocaleString()}</td>
                <td className="px-6 py-4 text-right font-mono">{user.followers.toLocaleString()}</td>
                <td className="px-6 py-4 text-right font-mono">{user.starsReceived.toLocaleString()}</td>
                <td className="px-6 py-4 text-right font-mono">{user.publicRepos}</td>
              </tr>
            ))}
            {rankedUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-neutral-500">
                  No followed accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  } catch (err: any) {
    return (
      <div className="p-8 rounded-lg border border-red-900/50 bg-red-950/20 text-red-200 text-center">
        <h2 className="text-xl font-bold mb-2">Error Fetching Data</h2>
        <p>{err.message || 'Unknown error occurred'}</p>
      </div>
    );
  }
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-neutral-200 p-8 md:p-24 selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-center gap-3 text-blue-500 mb-2">
            <Github className="w-8 h-8" />
            <span className="font-mono text-sm tracking-widest uppercase">CommitRank</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            Classmate Leaderboard
          </h1>
          <p className="text-neutral-400 max-w-2xl text-lg leading-relaxed">
            Ranking the most active developers from your GitHub following list. 
            Scores are calculated based on public contributions, stars, followers, and repository activity.
          </p>
        </header>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/30 flex flex-col gap-2 relative overflow-hidden">
            <Activity className="w-5 h-5 text-emerald-500 mb-2" />
            <h3 className="text-neutral-400 text-sm font-medium">Data Freshness</h3>
            <p className="text-2xl font-semibold text-white">Real-time API</p>
            <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/10 blur-3xl rounded-full translate-x-8 translate-y-8" />
          </div>
          <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/30 flex flex-col gap-2 relative overflow-hidden">
            <Star className="w-5 h-5 text-yellow-500 mb-2" />
            <h3 className="text-neutral-400 text-sm font-medium">Scoring Metric</h3>
            <p className="text-2xl font-semibold text-white">Contributions + Stars</p>
            <div className="absolute right-0 bottom-0 w-24 h-24 bg-yellow-500/10 blur-3xl rounded-full translate-x-8 translate-y-8" />
          </div>
          <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/30 flex flex-col gap-2 relative overflow-hidden">
            <Users className="w-5 h-5 text-blue-500 mb-2" />
            <h3 className="text-neutral-400 text-sm font-medium">Data Source</h3>
            <p className="text-2xl font-semibold text-white">GitHub Following</p>
            <div className="absolute right-0 bottom-0 w-24 h-24 bg-blue-500/10 blur-3xl rounded-full translate-x-8 translate-y-8" />
          </div>
        </div>

        {/* Leaderboard Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Top Developers
            </h2>
          </div>
          
          <Suspense fallback={
            <div className="w-full h-64 rounded-lg border border-neutral-800 bg-neutral-900/50 flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-neutral-500">Fetching GitHub API data...</p>
              </div>
            </div>
          }>
            <LeaderboardData />
          </Suspense>
        </section>

      </div>
    </main>
  );
}
