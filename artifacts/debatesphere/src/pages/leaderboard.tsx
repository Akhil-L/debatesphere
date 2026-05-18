import { useGetLeaderboard } from "@workspace/api-client-react";
import { Link } from "wouter";
import { TierBadge } from "@/components/ui/tier-badge";
import { Trophy, Medal, Star, Flame, Loader2 } from "lucide-react";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard({ limit: 50 });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-[#CD7F32]" />;
    return <span className="font-bold text-muted-foreground w-6 text-center">{rank}</span>;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black tracking-tight mb-4 inline-flex items-center gap-3">
          <Flame className="w-8 h-8 text-primary" /> 
          Hall of Fame
          <Flame className="w-8 h-8 text-primary" />
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          The most persuasive minds on the platform. Climb the ranks by crafting compelling arguments and earning votes.
        </p>
      </div>

      <div className="bg-card rounded-xl border border-border/50 overflow-hidden shadow-lg">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-muted/20 font-bold text-xs uppercase tracking-wider text-muted-foreground">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-5">Debater</div>
          <div className="col-span-3">Tier</div>
          <div className="col-span-3 text-right">Reputation</div>
        </div>
        
        <div className="divide-y divide-border/50">
          {leaderboard?.map((entry) => (
            <Link key={entry.user.id} href={`/profile/${entry.user.id}`}>
              <div className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors cursor-pointer ${
                entry.rank <= 3 ? 'bg-muted/10' : ''
              }`}>
                <div className="col-span-1 flex justify-center">
                  {getRankIcon(entry.rank)}
                </div>
                
                <div className="col-span-5 font-bold flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary uppercase">
                    {entry.user.username.charAt(0)}
                  </div>
                  <span className="truncate group-hover:text-primary transition-colors">
                    {entry.user.username}
                  </span>
                </div>
                
                <div className="col-span-3">
                  <TierBadge tier={entry.tier} />
                </div>
                
                <div className="col-span-3 text-right flex items-center justify-end gap-1 font-mono font-bold text-lg text-primary">
                  {entry.reputation.toLocaleString()}
                  <Star className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
          
          {leaderboard?.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No entries yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
