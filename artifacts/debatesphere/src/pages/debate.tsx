import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { formatDistanceToNow } from "date-fns";
import {
  useGetDebate,
  useListArguments,
  useCreateArgument,
  useVoteArgument,
  useJoinDebate,
  getListArgumentsQueryKey,
  useListReplies,
  useCreateReply
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { TierBadge } from "@/components/ui/tier-badge";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Users, 
  Send,
  Loader2,
  AlertCircle
} from "lucide-react";
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

const argumentSchema = z.object({
  content: z.string().min(10, "Argument must be at least 10 characters"),
  stance: z.enum(["for", "against", "neutral"]),
});

const replySchema = z.object({
  content: z.string().min(1, "Reply cannot be empty"),
});

export default function Debate() {
  const [, params] = useRoute("/debate/:id");
  const debateId = Number(params?.id);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<"all" | "for" | "against" | "neutral">("all");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const { data: debate, isLoading: isDebateLoading, error: debateError } = useGetDebate(debateId, {
    query: { enabled: !!debateId, queryKey: ['getDebate', debateId] }
  });

  const { data: argumentsData, isLoading: isArgsLoading } = useListArguments(debateId, {
    query: { enabled: !!debateId, queryKey: getListArgumentsQueryKey(debateId) }
  });

  const joinDebateMutation = useJoinDebate();
  const createArgumentMutation = useCreateArgument();
  const voteArgumentMutation = useVoteArgument();

  // Join debate on load if authenticated
  useEffect(() => {
    if (isAuthenticated && debateId) {
      joinDebateMutation.mutate({ id: debateId }, {
        onError: () => {
          // Already joined or failed, ignore silently
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, debateId]);

  // WebSocket Connection
  useEffect(() => {
    if (!debateId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/ws?debateId=${debateId}`;
    let ws: WebSocket;

    const connect = () => {
      ws = new WebSocket(wsUrl);
      
      ws.onmessage = (event) => {
        // Any message means we should refresh arguments
        queryClient.invalidateQueries({ queryKey: getListArgumentsQueryKey(debateId) });
      };

      ws.onclose = () => {
        // Optional reconnect logic could go here
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
    };
  }, [debateId, queryClient]);

  const form = useForm<z.infer<typeof argumentSchema>>({
    resolver: zodResolver(argumentSchema),
    defaultValues: {
      content: "",
      stance: "neutral",
    },
  });

  const onArgumentSubmit = (values: z.infer<typeof argumentSchema>) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "You must be logged in to post an argument.",
        variant: "destructive"
      });
      return;
    }

    createArgumentMutation.mutate({
      id: debateId,
      data: values
    }, {
      onSuccess: () => {
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListArgumentsQueryKey(debateId) });
        toast({ title: "Argument posted!" });
      }
    });
  };

  const handleVote = (argumentId: number, voteType: "up" | "down" | "none") => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "You must be logged in to vote.",
        variant: "destructive"
      });
      return;
    }
    voteArgumentMutation.mutate({
      id: argumentId,
      data: { vote: voteType }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListArgumentsQueryKey(debateId) });
      }
    });
  };

  if (isDebateLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (debateError || !debate) {
    return (
      <div className="text-center py-20 bg-card rounded-xl border border-destructive/50">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Debate not found</h3>
        <p className="text-muted-foreground">The debate you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  const filteredArguments = argumentsData?.filter(arg => activeTab === "all" || arg.stance === activeTab) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Debate Header */}
      <div className="bg-card rounded-xl p-6 sm:p-8 border border-primary/20 shadow-[0_0_40px_-15px_hsl(var(--primary))]">
        <div className="flex justify-between items-start mb-4">
          <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20">
            {debate.category}
          </Badge>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" /> {debate.participantCount}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" /> {debate.argumentCount}
            </span>
          </div>
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight leading-tight">
          {debate.title}
        </h1>
        
        <p className="text-muted-foreground whitespace-pre-wrap text-lg mb-6">
          {debate.description}
        </p>
        
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Started by {debate.author.username}</span>
            <TierBadge tier={debate.author.tier} />
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(debate.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Argument Input */}
      {debate.status === 'active' && (
        <div className="bg-card border border-border/50 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">Add Your Voice</h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onArgumentSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="stance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Stance</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant={field.value === "for" ? "default" : "outline"} 
                          onClick={() => field.onChange("for")}
                          className={field.value === "for" ? "bg-primary text-primary-foreground" : ""}
                        >
                          For
                        </Button>
                        <Button 
                          type="button" 
                          variant={field.value === "against" ? "default" : "outline"} 
                          onClick={() => field.onChange("against")}
                          className={field.value === "against" ? "bg-destructive text-destructive-foreground" : ""}
                        >
                          Against
                        </Button>
                        <Button 
                          type="button" 
                          variant={field.value === "neutral" ? "default" : "outline"} 
                          onClick={() => field.onChange("neutral")}
                          className={field.value === "neutral" ? "bg-secondary text-secondary-foreground" : ""}
                        >
                          Neutral
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder="Construct a well-reasoned argument..." 
                        className="resize-none min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={createArgumentMutation.isPending} className="font-bold">
                  {createArgumentMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Post Argument
                </Button>
              </div>
            </form>
          </Form>
        </div>
      )}

      {/* Arguments Feed */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border/50 pb-2">
          <h2 className="text-2xl font-bold">Arguments</h2>
          <div className="flex gap-2">
            {(["all", "for", "against", "neutral"] as const).map(tab => (
              <Button 
                key={tab} 
                variant={activeTab === tab ? "default" : "ghost"} 
                size="sm"
                onClick={() => setActiveTab(tab)}
                className="capitalize"
              >
                {tab}
              </Button>
            ))}
          </div>
        </div>

        {isArgsLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : filteredArguments.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No arguments posted yet in this category. Be the first!
          </div>
        ) : (
          <div className="space-y-4">
            {filteredArguments.map((arg) => (
              <div key={arg.id} className={`bg-card border-l-4 rounded-xl p-5 ${
                arg.stance === 'for' ? 'border-l-primary' : 
                arg.stance === 'against' ? 'border-l-destructive' : 'border-l-secondary'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{arg.author.username}</span>
                    <TierBadge tier={arg.author.tier} />
                    <span className="text-xs text-muted-foreground ml-2">
                      {formatDistanceToNow(new Date(arg.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <Badge variant="outline" className={`uppercase text-[10px] ${
                    arg.stance === 'for' ? 'text-primary border-primary/30' : 
                    arg.stance === 'against' ? 'text-destructive border-destructive/30' : 'text-secondary border-secondary/30'
                  }`}>
                    {arg.stance}
                  </Badge>
                </div>
                
                <p className="whitespace-pre-wrap mb-4">
                  {arg.content}
                </p>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleVote(arg.id, arg.userVote === 'up' ? 'none' : 'up')}
                      className={arg.userVote === 'up' ? 'text-primary bg-primary/10' : ''}
                    >
                      <ThumbsUp className="w-4 h-4 mr-1.5" />
                      {arg.upvotes}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleVote(arg.id, arg.userVote === 'down' ? 'none' : 'down')}
                      className={arg.userVote === 'down' ? 'text-destructive bg-destructive/10' : ''}
                    >
                      <ThumbsDown className="w-4 h-4 mr-1.5" />
                      {arg.downvotes}
                    </Button>
                  </div>
                  
                  <Button variant="ghost" size="sm" onClick={() => setReplyingTo(replyingTo === arg.id ? null : arg.id)}>
                    <MessageSquare className="w-4 h-4 mr-1.5" />
                    Reply ({arg.replyCount})
                  </Button>
                </div>

                {replyingTo === arg.id && (
                  <RepliesSection argumentId={arg.id} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RepliesSection({ argumentId }: { argumentId: number }) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: replies, isLoading } = useListReplies(argumentId, {
    query: { enabled: !!argumentId, queryKey: ['listReplies', argumentId] }
  });
  
  const createReplyMutation = useCreateReply();

  const form = useForm<z.infer<typeof replySchema>>({
    resolver: zodResolver(replySchema),
    defaultValues: { content: "" },
  });

  const onSubmit = (values: z.infer<typeof replySchema>) => {
    if (!isAuthenticated) {
      toast({ title: "Login Required", variant: "destructive" });
      return;
    }
    createReplyMutation.mutate({
      id: argumentId,
      data: values
    }, {
      onSuccess: () => {
        form.reset();
        queryClient.invalidateQueries({ queryKey: ['listReplies', argumentId] });
      }
    });
  };

  return (
    <div className="mt-4 pt-4 border-t border-border/30 pl-4 border-l-2 border-l-border/30 ml-2 space-y-4">
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      ) : replies?.map((reply) => (
        <div key={reply.id} className="text-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold">{reply.author.username}</span>
            <TierBadge tier={reply.author.tier} className="scale-75 origin-left" />
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-muted-foreground">{reply.content}</p>
        </div>
      ))}

      {isAuthenticated && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="Add a reply..." className="h-8 text-sm" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" size="sm" className="h-8" disabled={createReplyMutation.isPending}>
              {createReplyMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}
