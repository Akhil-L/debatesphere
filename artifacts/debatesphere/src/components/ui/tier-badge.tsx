import { Badge } from "@/components/ui/badge";

type TierBadgeProps = {
  tier: string;
  className?: string;
};

export function TierBadge({ tier, className = "" }: TierBadgeProps) {
  let colorClass = "bg-muted text-muted-foreground";
  
  if (tier === "Bronze Debater") {
    colorClass = "bg-[#CD7F32]/20 text-[#CD7F32] border-[#CD7F32]/50";
  } else if (tier === "Silver Debater") {
    colorClass = "bg-gray-300/20 text-gray-300 border-gray-300/50";
  } else if (tier === "Gold Debater") {
    colorClass = "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
  } else if (tier === "Diamond Debater") {
    colorClass = "bg-cyan-400/20 text-cyan-400 border-cyan-400/50";
  }

  return (
    <Badge variant="outline" className={`font-bold tracking-wider uppercase text-[10px] ${colorClass} ${className}`}>
      {tier}
    </Badge>
  );
}
