import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

const TypingIndicator = () => (
  <motion.div
    initial={{ opacity: 0, y: 8, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    className="flex items-end gap-2 mb-4"
  >
    <motion.div
      animate={{ rotate: [0, 10, -10, 0] }}
      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
      className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ring-1 ring-chat-ring/10 bg-card"
    >
      <Bot size={14} className="text-muted-foreground" />
    </motion.div>
    <div className="flex space-x-1.5 px-4 py-3 bg-chat-bubble-bot rounded-2xl w-fit rounded-bl-none ring-1 ring-chat-ring/5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ 
            y: [0, -4, 0],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15, ease: 'easeInOut' }}
          className="w-1.5 h-1.5 bg-muted-foreground rounded-full"
        />
      ))}
    </div>
  </motion.div>
);

export default TypingIndicator;
