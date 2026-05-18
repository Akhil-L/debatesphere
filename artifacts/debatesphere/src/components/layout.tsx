import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { MessageSquareShare, BarChart3, Trophy, User as UserIcon, LogOut, Loader2 } from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout, setUser, token } = useAuth();
  const [location] = useLocation();

  const { data: user, isLoading } = useGetMe({
    query: {
      enabled: isAuthenticated && !!token,
      staleTime: 5 * 60 * 1000,
    }
  });

  useEffect(() => {
    if (user) {
      setUser(user);
    }
  }, [user, setUser]);

  const navLinks = [
    { href: "/", label: "Feed", icon: <MessageSquareShare className="w-4 h-4 mr-2" /> },
    { href: "/analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4 mr-2" /> },
    { href: "/leaderboard", label: "Leaderboard", icon: <Trophy className="w-4 h-4 mr-2" /> },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary selection:text-primary-foreground text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto h-16 flex items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-black text-xl tracking-tighter">
                D
              </div>
              <span className="font-bold text-xl tracking-tight hidden sm:inline-block">
                DebateSphere
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted/50 ${
                    location === link.href ? "bg-muted text-primary" : "text-muted-foreground"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-4">
                <Link href={`/profile/${user.id}`} className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <span className="hidden sm:inline-block">{user.username}</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => logout()} title="Logout">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-sm font-medium px-4 py-2 hover:text-primary transition-colors">
                  Login
                </Link>
                <Link href="/register">
                  <Button variant="default" className="font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90">
                    Join the Fray
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur px-4 py-3 flex justify-around">
         {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center p-2 rounded-lg ${
                location === link.href ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.icon}
            </Link>
          ))}
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
        {children}
      </main>
    </div>
  );
}
