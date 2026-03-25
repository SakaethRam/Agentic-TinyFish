import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import ChatWidget from '@/components/chat/ChatWidget';

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center ambient-grid relative overflow-hidden transition-colors duration-500">
      {/* Subtle ambient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-chat-online/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-chat-accent-subtle/[0.02] rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center space-y-4 relative z-10"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles size={16} className="text-muted-foreground/40" />
        </div>
        <h1 className="text-4xl font-semibold text-foreground tracking-tight">Welcome To IRIS Metal</h1>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          IRIS Metal is an agentic AI interface powered by TinyFish, an execution engine that converts user intent into action.
        </p>
      </motion.div>
      <ChatWidget />
    </div>
  );
};

export default Index;
