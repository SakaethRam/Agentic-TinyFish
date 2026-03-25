import { motion } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';

interface InputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
}

const InputBar = ({ value, onChange, onSend }: InputBarProps) => (
  <div className="p-4 bg-chat-header/50 border-t border-chat-ring/5">
    <motion.div
      animate={value.trim() ? { boxShadow: '0 0 16px hsl(160 84% 39% / 0.08)' } : { boxShadow: '0 0 0px transparent' }}
      transition={{ duration: 0.3 }}
      className="relative flex items-center gap-2 bg-chat-bubble-bot ring-1 ring-chat-ring/10 rounded-xl px-4 py-2 focus-within:ring-chat-ring/20 transition-all duration-300"
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSend()}
        placeholder="Ask a question..."
        className="w-full bg-transparent border-none focus:outline-none text-sm text-foreground placeholder:text-muted-foreground py-1"
      />
      <motion.button
        onClick={onSend}
        disabled={!value.trim()}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.85, rotate: -12 }}
        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        className="p-2 rounded-lg bg-primary text-primary-foreground transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_12px_hsl(var(--chat-glow)/0.2)]"
      >
        <Send size={15} />
      </motion.button>
    </motion.div>
    <div className="flex items-center justify-center gap-1.5 mt-3">
      <Sparkles size={10} className="text-muted-foreground/30" />
      <p className="text-[10px] text-muted-foreground/30 uppercase tracking-widest font-semibold">
        Powered by Gemini Pro
      </p>
    </div>
  </div>
);

export default InputBar;
