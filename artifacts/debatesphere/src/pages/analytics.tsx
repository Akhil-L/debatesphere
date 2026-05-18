import { 
  useGetAnalyticsDashboard, 
  useGetTrendingCategories,
  useGetActivityTimeline
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Users, MessageSquare, Target, Activity, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Analytics() {
  const { data: dashboard, isLoading: isDashboardLoading } = useGetAnalyticsDashboard();
  const { data: trendingCategories, isLoading: isCategoriesLoading } = useGetTrendingCategories();
  const { data: activityTimeline, isLoading: isTimelineLoading } = useGetActivityTimeline();

  if (isDashboardLoading || isCategoriesLoading || isTimelineLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!dashboard || !trendingCategories || !activityTimeline) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight mb-2">Platform Pulse</h1>
        <p className="text-muted-foreground">Real-time vitals from the arena.</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalUsers.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Debates</CardTitle>
            <Target className="w-4 h-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.activeDebates.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">out of {dashboard.totalDebates} total</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Arguments Posted</CardTitle>
            <MessageSquare className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalArguments.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Votes Cast</CardTitle>
            <Activity className="w-4 h-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalVotes.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activity Chart */}
        <Card className="bg-card border-border/50 col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityTimeline} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Line type="monotone" dataKey="arguments" name="Arguments" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="debates" name="Debates" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Trending Categories */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle>Trending Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendingCategories} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                  />
                  <Bar dataKey="engagementScore" name="Engagement" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Most Controversial */}
        <Card className="bg-card border-border/50">
          <CardHeader>
            <CardTitle>Most Controversial Debates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboard.controversialTopics.map((debate) => (
                <Link key={debate.id} href={`/debate/${debate.id}`}>
                  <div className="group block p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                    <div className="flex justify-between items-start mb-1">
                      <Badge variant="secondary" className="bg-secondary/10 text-secondary text-[10px]">
                        {debate.category}
                      </Badge>
                      <span className="text-xs font-bold text-destructive">Controversial</span>
                    </div>
                    <h4 className="font-bold line-clamp-1 group-hover:text-primary transition-colors">{debate.title}</h4>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {debate.argumentCount}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {debate.participantCount}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
