import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';

export interface Message {
  id: number;
  role: 'bot' | 'user';
  content: string;
}

const MessageBubble = ({ message, index = 0 }: { message: Message; index?: number }) => {
  const isBot = message.role === 'bot';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, x: isBot ? -12 : 12, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4 group`}
    >
      <div className={`flex items-end gap-2 max-w-[85%] ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* Avatar */}
        <motion.div
          whileHover={{ scale: 1.2, rotate: isBot ? -8 : 8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ring-1 ring-chat-ring/10 cursor-pointer transition-shadow duration-300 ${
            isBot
              ? 'bg-card group-hover:ring-chat-ring/20 group-hover:shadow-[0_0_12px_hsl(var(--chat-glow)/0.15)]'
              : 'bg-chat-bubble-user group-hover:ring-chat-ring/20'
          }`}
        >
          {isBot ? (
            <Bot size={14} className="text-muted-foreground" />
          ) : (
            <User size={14} className="text-chat-bubble-user-fg" />
          )}
        </motion.div>

        {/* Bubble */}
        <motion.div
          whileHover={{ scale: 1.015, y: -1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed cursor-default transition-shadow duration-300 ${
            isBot
              ? 'bg-chat-bubble-bot text-foreground rounded-bl-none ring-1 ring-chat-ring/5 group-hover:ring-chat-ring/10 group-hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
              : 'bg-chat-bubble-user text-chat-bubble-user-fg rounded-br-none shadow-sm group-hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)]'
          }`}
        >
          {message.content}
        </motion.div>
      </div>

      {/* Timestamp on hover */}
      <motion.span
        initial={{ opacity: 0 }}
        className="self-end text-[10px] text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-all duration-300 mx-2 select-none"
      >
        now
      </motion.span>
    </motion.div>
  );
};

export default MessageBubble;
