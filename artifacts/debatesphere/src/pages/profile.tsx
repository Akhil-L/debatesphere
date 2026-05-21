import { useState } from "react";
import { useRoute, Link } from "wouter";
import { formatDistanceToNow, format } from "date-fns";
import { useGetUser, useGetUserDebates } from "@workspace/api-client-react";
import { TierBadge } from "@/components/ui/tier-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Users, Star, Calendar, Loader2, Award, Zap, Pencil, X, Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";

export default function Profile() {
  const [, params] = useRoute("/profile/:id");
  const userId = Number(params?.id);
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { data: user, isLoading: isUserLoading } = useGetUser(userId, {
    query: { enabled: !!userId, queryKey: ['getUser', userId] }
  });

  const { data: debates, isLoading: isDebatesLoading } = useGetUserDebates(userId, {
    query: { enabled: !!userId, queryKey: ['getUserDebates', userId] }
  });

  const isOwnProfile = currentUser?.id === userId;

  const handleEditStart = () => {
    setEditUsername(user?.username || "");
    setEditBio(user?.bio || "");
    setError("");
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: editUsername, bio: editBio }),
      });
      if (!res.ok) {
        const text = await res.text();
        let message = "Failed to update profile";
        try { message = JSON.parse(text).message || message; } catch {}
        throw new Error(message);
      }
      queryClient.invalidateQueries({ queryKey: ['getUser', userId] });
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (isUserLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return <div className="text-center py-20">User not found</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="relative pt-32 pb-8 px-8 rounded-xl bg-card border border-border/50 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary/20 via-secondary/20 to-background opacity-50 border-b border-border/50" />

        <div className="relative flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-20">
          <div className="w-32 h-32 rounded-xl bg-background border-4 border-card flex items-center justify-center text-6xl font-black uppercase shadow-xl text-primary">
            {user.username.charAt(0)}
          </div>

          <div className="flex-1 space-y-2">
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="Username"
                  className="text-2xl font-black max-w-xs"
                />
                <Textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Write something about yourself..."
                  className="max-w-md resize-none"
                  rows={3}
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                    <X className="w-4 h-4 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <h1 className="text-4xl font-black tracking-tight">{user.username}</h1>
                  <TierBadge tier={user.tier} className="w-fit" />
                  {isOwnProfile && (
                    <Button size="sm" variant="outline" onClick={handleEditStart} className="w-fit">
                      <Pencil className="w-3 h-3 mr-1" /> Edit Profile
                    </Button>
                  )}
                </div>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Joined {format(new Date(user.createdAt), "MMMM yyyy")}
                </p>
                {user.bio && <p className="mt-4 text-lg max-w-2xl">{user.bio}</p>}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4">
          <h3 className="font-bold text-lg mb-2">Combat Stats</h3>
          <Card className="bg-card border-border/50">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground font-bold uppercase tracking-wider">Reputation</div>
                <div className="text-3xl font-black font-mono">{user.reputation.toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground font-bold uppercase tracking-wider">Arguments</div>
                <div className="text-3xl font-black font-mono">{user.argumentCount.toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-foreground">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground font-bold uppercase tracking-wider">Debates Started</div>
                <div className="text-3xl font-black font-mono">{user.debateCount.toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <h3 className="font-bold text-lg border-b border-border/50 pb-2">Recent Debates</h3>
          {isDebatesLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : !debates?.length ? (
            <div className="text-center py-10 bg-card rounded-xl border border-border/50 text-muted-foreground">
              This user hasn't started any debates yet.
            </div>
          ) : (
            <div className="space-y-4">
              {debates.map((debate) => (
                <Link key={debate.id} href={`/debate/${debate.id}`}>
                  <div className="group bg-card border border-border hover:border-primary/50 transition-all rounded-xl p-5 cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary" className="bg-secondary/10 text-secondary">
                        {debate.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(debate.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <h4 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">
                      {debate.title}
                    </h4>
                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{debate.argumentCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{debate.participantCount}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}