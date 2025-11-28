import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { MessageWithSender } from "@shared/schema";
import { format } from "date-fns";

interface ChatBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
}

export function ChatBubble({ message, isOwn }: ChatBubbleProps) {
  const sender = message.sender;
  
  return (
    <div
      className={cn(
        "flex gap-2 max-w-[80%]",
        isOwn ? "ml-auto flex-row-reverse" : ""
      )}
      data-testid={`message-${message.id}`}
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage 
          src={sender?.profileImageUrl || undefined} 
          alt={sender?.firstName || "User"}
          className="object-cover"
        />
        <AvatarFallback className="text-xs">
          {sender?.firstName?.charAt(0) || "U"}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
        <div
          className={cn(
            "px-4 py-2 rounded-2xl",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted rounded-bl-md"
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <span className="text-xs text-muted-foreground mt-1">
          {message.createdAt ? format(new Date(message.createdAt), "h:mm a") : ""}
        </span>
      </div>
    </div>
  );
}
