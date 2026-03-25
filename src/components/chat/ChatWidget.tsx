import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X } from 'lucide-react';
import MessageBubble, { type Message } from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import InputBar from './InputBar';

const widgetVariants = {
  hidden: {
    opacity: 0,
    scale: 0.88,
    y: 30,
    filter: 'blur(8px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      staggerChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: 20,
    filter: 'blur(4px)',
    transition: { duration: 0.25, ease: [0.4, 0, 1, 1] as [number, number, number, number] },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.1 } },
};

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'bot', content: 'Hey! How can I help you?' },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.remove('light');
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    }
  }, [theme]);

  const processCommand = useCallback((text: string): Message | null => {
    const lower = text.toLowerCase().trim();

    if (lower === 'turn light mode') {
      setTheme('light');
      return {
        id: Date.now() + 1,
        role: 'bot',
        content: '☀️ Light mode activated. Type "Turn dark mode" to switch back.',
      };
    }
    if (lower === 'turn dark mode') {
      setTheme('dark');
      return {
        id: Date.now() + 1,
        role: 'bot',
        content: '🌙 Dark mode activated. Type "Turn light mode" to switch back.',
      };
    }

    return null;
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now(), role: 'user', content: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput('');

    // Check for theme command
    const commandResponse = processCommand(currentInput);
    if (commandResponse) {
      setIsTyping(true);
      setTimeout(() => {
        setMessages((prev) => [...prev, commandResponse]);
        setIsTyping(false);
      }, 600);
      return;
    }

    setIsTyping(true);
    setTimeout(() => {
      const botMsg: Message = {
        id: Date.now() + 1,
        role: 'bot',
        content: 'This is a demo response. Connect your API key to enable real intelligence.',
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="chat-widget"
            variants={widgetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute bottom-20 right-0 w-[400px] h-[600px] flex flex-col bg-background/90 backdrop-blur-2xl rounded-[2rem] widget-shadow overflow-hidden"
          >
            {/* Header */}
            <motion.div
              variants={headerVariants}
              className="px-6 py-4 flex items-center justify-between bg-chat-header/50 border-b border-chat-ring/5"
            >
              <div className="flex items-center gap-3">
                {/* Animated brand mark */}
                <div className="relative flex items-center justify-center w-8 h-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                    className="absolute inset-0 rounded-lg border border-chat-online/30"
                    style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }}
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    className="w-2 h-2 bg-chat-online rounded-full shadow-[0_0_10px_hsl(var(--chat-glow)/0.6)]"
                  />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold tracking-widest uppercase text-foreground">
                    Visper
                    <span className="text-chat-online ml-1 font-light tracking-normal lowercase text-xs">ai</span>
                  </h3>
                  <span className="text-[10px] text-muted-foreground/60 -mt-0.5">online</span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.08)' }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </motion.button>
            </motion.div>

            {/* Chat Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 scroll-smooth scrollbar-hide ambient-grid"
            >
              {messages.map((msg, i) => (
                <MessageBubble key={msg.id} message={msg} index={i} />
              ))}
              {isTyping && <TypingIndicator />}
            </div>

            {/* Input */}
            <div>
              <InputBar value={input} onChange={setInput} onSend={handleSend} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.88 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-card text-muted-foreground toggle-glow-open'
            : 'bg-primary text-primary-foreground toggle-glow'
        }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <X size={22} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <MessageSquare size={22} />
            </motion.div>
          )}
        </AnimatePresence>

        {!isOpen && (
          <motion.span
            animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-chat-online rounded-full"
          />
        )}
      </motion.button>
    </div>
  );
};

export default ChatWidget;
