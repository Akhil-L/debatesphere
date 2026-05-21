import { useState } from "react";
import { Link, useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { 
  useListDebates, 
  useGetTrendingDebates, 
  useGetCategories,
  useCreateDebate
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { TierBadge } from "@/components/ui/tier-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Filter, 
  Plus, 
  Search,
  Loader2,
  Share2,
  Check
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Textarea } from "@/components/ui/textarea";

const debateSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().min(1, "Category is required"),
  tags: z.string().optional(),
});

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<"latest" | "trending" | "most_active">("latest");
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: debatesData, isLoading: isDebatesLoading } = useListDebates({
    category: activeCategory,
    search: searchQuery || undefined,
    sort,
    limit: 20
  });

  const { data: trendingDebates, isLoading: isTrendingLoading } = useGetTrendingDebates({ limit: 5 });
  const { data: categories, isLoading: isCategoriesLoading } = useGetCategories();
  
  const createDebateMutation = useCreateDebate();
  
  const form = useForm<z.infer<typeof debateSchema>>({
    resolver: zodResolver(debateSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      tags: "",
    },
  });

  const handleShare = (e: React.MouseEvent, debateId: number) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/debate/${debateId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(debateId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const onSubmit = (values: z.infer<typeof debateSchema>) => {
    const tagsArray = values.tags ? values.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
    
    createDebateMutation.mutate({
      data: {
        title: values.title,
        description: values.description,
        category: values.category,
        tags: tagsArray
      }
    }, {
      onSuccess: (data) => {
        setIsDialogOpen(false);
        form.reset();
        setLocation(`/debate/${data.id}`);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Main Feed */}
      <div className="lg:col-span-3 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-4xl font-black tracking-tight">The Arena</h1>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search debates..." 
                className="pl-9 bg-background/50 border-border/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="font-bold shrink-0">
                  <Plus className="w-4 h-4 mr-2" />
                  New Debate
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Start a New Debate</DialogTitle>
                  <DialogDescription>
                    Throw a topic into the arena and let the arguments begin.
                  </DialogDescription>
                </DialogHeader>
                {isAuthenticated ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Proposition</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Remote work is better than office work" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Context & Rules</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Provide background information and define the scope of the debate..." 
                                className="resize-none h-24" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Technology" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="tags"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tags (comma separated)</FormLabel>
                              <FormControl>
                                <Input placeholder="remote, wfh, future" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={createDebateMutation.isPending}>
                        {createDebateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Open Arena
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <div className="text-center py-6">
                    <p className="mb-4">You must be logged in to start a debate.</p>
                    <Button onClick={() => setLocation("/login")}>Sign In</Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button 
            variant={sort === "latest" ? "default" : "outline"} 
            size="sm"
            onClick={() => setSort("latest")}
            className="shrink-0"
          >
            Latest
          </Button>
          <Button 
            variant={sort === "trending" ? "default" : "outline"} 
            size="sm"
            onClick={() => setSort("trending")}
            className="shrink-0"
          >
            <TrendingUp className="w-4 h-4 mr-1" /> Trending
          </Button>
          <Button 
            variant={sort === "most_active" ? "default" : "outline"} 
            size="sm"
            onClick={() => setSort("most_active")}
            className="shrink-0"
          >
            Most Active
          </Button>
          <div className="h-6 w-px bg-border mx-2 shrink-0" />
          <Button 
            variant={activeCategory === undefined ? "default" : "outline"} 
            size="sm"
            onClick={() => setActiveCategory(undefined)}
            className="shrink-0"
          >
            All Categories
          </Button>
          {categories?.map((cat) => (
            <Button
              key={cat.name}
              variant={activeCategory === cat.name ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat.name)}
              className="shrink-0"
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Feed List */}
        <div className="space-y-4">
          {isDebatesLoading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-40 rounded-xl bg-card border border-border/50 animate-pulse" />
            ))
          ) : debatesData?.debates.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-xl border border-border/50">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">No debates found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or start a new one.</p>
            </div>
          ) : (
            debatesData?.debates.map((debate) => (
              <Link key={debate.id} href={`/debate/${debate.id}`}>
                <div className="group bg-card hover:bg-card/80 border border-border hover:border-primary/50 transition-all rounded-xl p-5 cursor-pointer hover-elevate">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-secondary/10 text-secondary hover:bg-secondary/20">
                        {debate.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(debate.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {debate.status === 'active' ? (
                        <Badge variant="outline" className="text-primary border-primary/30">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Closed</Badge>
                      )}
                      <button
                        onClick={(e) => handleShare(e, debate.id)}
                        className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        title="Share debate"
                      >
                        {copiedId === debate.id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Share2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <h2 className="text-xl sm:text-2xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {debate.title}
                  </h2>
                  <p className="text-muted-foreground line-clamp-2 mb-4 text-sm">
                    {debate.description}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-sm">{debate.author.username}</div>
                      <TierBadge tier={debate.author.tier} />
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <div className="bg-card border border-border/50 rounded-xl p-5">
          <div className="flex items-center gap-2 font-bold text-lg mb-4 text-primary">
            <TrendingUp className="w-5 h-5" />
            Trending Now
          </div>
          
          <div className="space-y-4">
            {isTrendingLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-16 bg-muted/50 rounded-md animate-pulse" />
              ))
            ) : trendingDebates?.map((debate) => (
              <Link key={debate.id} href={`/debate/${debate.id}`}>
                <div className="group block">
                  <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {debate.title}
                  </h4>
                  <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                    <span>{debate.category}</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> {debate.argumentCount}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-xl p-5">
          <div className="flex items-center gap-2 font-bold text-lg mb-4">
            <Filter className="w-5 h-5 text-secondary" />
            Top Categories
          </div>
          
          <div className="flex flex-wrap gap-2">
            {isCategoriesLoading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="w-20 h-6 bg-muted/50 rounded-full animate-pulse" />
              ))
            ) : categories?.map((cat) => (
              <Badge 
                key={cat.name} 
                variant="outline" 
                className="cursor-pointer hover:bg-secondary/10 hover:text-secondary hover:border-secondary/50 transition-colors"
                onClick={() => setActiveCategory(cat.name)}
              >
                {cat.name} <span className="ml-1 opacity-50">{cat.count}</span>
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}