import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Menu, 
  Video, 
  Phone, 
  MoreVertical, 
  Paperclip, 
  Smile, 
  Send,
  ArrowLeft,
  X,
  Mic,
  Camera,
  Maximize2,
  Minimize2,
  Trash2,
  Share2,
  Smartphone,
  Check,
  CheckCheck,
  Moon,
  Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Message, Chat } from './types';

const STICKERS = [
  '😊', '😂', '🥰', '😍', '🤔', '😎', '😭', '😱', '👍', '🔥', 
  '❤️', '🎉', '✨', '🚀', '⭐', '🎈', '🍕', '🍦', '🎮', '💡'
];

const INITIAL_CHATS: Chat[] = [
  {
    id: '1',
    name: 'Zakariyo Support',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    lastMessage: 'Xush kelibsiz! Zakariyo.uz orqali muloqot qiling.',
    lastMessageTime: '12:45',
    online: true,
    phoneNumber: '+998901234567',
    messages: [
      { id: 'm1', text: 'Assalomu alaykum!', sender: 'them', timestamp: Date.now() - 100000 },
      { id: 'm2', text: 'Zakariyo.uz saytiga xush kelibsiz. Bu yerda siz 1ga1 chat va videolink orqali gaplashishingiz mumkin.', sender: 'them', timestamp: Date.now() - 50000 },
    ]
  },
  {
    id: '2',
    name: 'Alisher',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
    lastMessage: 'Bugun videochat qilamizmi?',
    lastMessageTime: 'Kecha',
    online: false,
    phoneNumber: '+998991234567',
    messages: [
      { id: 'a1', text: 'Salom, qandaysan?', sender: 'them', timestamp: Date.now() - 2000000 },
      { id: 'a2', text: 'Yaxshi, o\'zingchi?', sender: 'me', timestamp: Date.now() - 1900000 },
    ]
  },
  {
    id: '3',
    name: 'Zakariyo.uz Community',
    avatar: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=100&h=100&fit=crop',
    lastMessage: 'Yangi stikerlar qo\'shildi!',
    lastMessageTime: '10:20',
    online: true,
    isGroup: true,
    memberCount: 1540,
    messages: [
      { id: 'g1', text: 'Hamma salom!', sender: 'them', timestamp: Date.now() - 3600000 },
    ]
  }
];

export default function App() {
  const [isJoined, setIsJoined] = useState(false);
  const [myNumber, setMyNumber] = useState('');
  const [chats, setChats] = useState<Chat[]>(INITIAL_CHATS);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isVideoCalling, setIsVideoCalling] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showStickers, setShowStickers] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ id: string, x: number, y: number } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeChat = chats.find(c => c.id === activeChatId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeChat?.messages]);

  const handleJoin = () => {
    if (myNumber.length >= 7) {
      setIsJoined(true);
    } else {
      alert("Iltimos, telefon raqamingizni kiriting!");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        handleSendMessage(undefined, { url: audioUrl, duration: recordingDuration });
        setRecordingDuration(0);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Recording error:", err);
      const errorMsg = err.name === 'NotAllowedError' 
        ? "Mikrofonga ruxsat berilmadi. Iltimos, brauzer sozlamalaridan ruxsat bering." 
        : "Mikrofon topilmadi yoki boshqa xatolik yuz berdi.";
      alert(errorMsg);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      if (recordingTimer.current) clearInterval(recordingTimer.current);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    // If it looks like a phone number or username and not in chats
    const cleanTerm = term.replace(/\s/g, '');
    if ((cleanTerm.startsWith('+') && cleanTerm.length > 7) || (cleanTerm.startsWith('@') && cleanTerm.length > 3)) {
      const isUsername = cleanTerm.startsWith('@');
      const exists = chats.find(c => isUsername ? c.name.toLowerCase().includes(cleanTerm.slice(1).toLowerCase()) : c.phoneNumber === cleanTerm);
      if (!exists) {
        const newUser: Chat = {
          id: Date.now().toString(),
          name: isUsername ? cleanTerm : `Foydalanuvchi ${cleanTerm.slice(-4)}`,
          avatar: `https://ui-avatars.com/api/?name=${isUsername ? cleanTerm.slice(1) : cleanTerm.slice(-4)}&background=random`,
          lastMessage: 'Yangi kontakt qo\'shildi',
          lastMessageTime: 'Hozir',
          online: false,
          phoneNumber: isUsername ? undefined : cleanTerm,
          messages: []
        };
        setChats(prev => [newUser, ...prev]);
      }
    }
  };

  const handleReaction = (msgId: string, emoji: string) => {
    if (!activeChatId) return;
    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          messages: chat.messages.map(m => {
            if (m.id === msgId) {
              const reactions = { ...(m.reactions || {}) };
              reactions[emoji] = (reactions[emoji] || 0) + 1;
              return { ...m, reactions };
            }
            return m;
          })
        };
      }
      return chat;
    }));
    setContextMenu(null);
  };

  const toggleVideoCall = async () => {
    if (!isVideoCalling) {
      setIsVideoCalling(true);
      setIsVideoEnabled(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.error("Error accessing camera:", err);
        setIsVideoCalling(false);
        const errorMsg = err.name === 'NotAllowedError' 
          ? "Kameraga ruxsat berilmadi. Iltimos, brauzer sozlamalaridan ruxsat bering." 
          : "Kamera topilmadi yoki boshqa xatolik yuz berdi.";
        alert(errorMsg);
      }
    } else {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      setIsVideoCalling(false);
    }
  };

  const toggleCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const handleSendMessage = (textOverride?: string, audioData?: { url: string, duration: number }) => {
    const textToSend = textOverride || inputText;
    if (!audioData && !textToSend.trim() || !activeChatId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: audioData ? '' : textToSend,
      sender: 'me',
      timestamp: Date.now(),
      type: audioData ? 'audio' : 'text',
      audioUrl: audioData?.url,
      duration: audioData?.duration
    };

    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          messages: [...chat.messages, newMessage],
          lastMessage: textToSend,
          lastMessageTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      return chat;
    }));

    if (!textOverride) setInputText('');
    setShowStickers(false);
  };

  const handleDeleteMessage = (msgId: string) => {
    if (!activeChatId) return;
    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          messages: chat.messages.filter(m => m.id !== msgId)
        };
      }
      return chat;
    }));
    setContextMenu(null);
  };

  const handleShareMessage = (msg: Message) => {
    if (navigator.share) {
      navigator.share({
        text: msg.text,
        title: 'Zakariyo.uz dan xabar'
      }).then(() => {
        alert("Muvaffaqiyatli ulashildi!");
      }).catch(err => {
        console.error("Sharing failed", err);
      });
    } else {
      navigator.clipboard.writeText(msg.text);
      alert("Xabar nusxalandi!");
    }
    setContextMenu(null);
  };

  const filteredChats = chats.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phoneNumber?.includes(searchTerm)
  );

  const handleLongPress = (e: React.MouseEvent | React.TouchEvent, msgId: string) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    setContextMenu({ id: msgId, x: clientX, y: clientY });
  };

  return (
    <div className="flex h-screen w-screen bg-[#0f0f0f] text-white overflow-hidden font-sans">
      <AnimatePresence>
        {!isJoined && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[100] bg-[#0f0f0f] flex flex-col items-center justify-center p-6"
          >
            <div className="w-full max-w-sm flex flex-col items-center">
              <motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="w-24 h-24 bg-[#3390ec] rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(51,144,236,0.3)]"
              >
                <span className="text-4xl font-bold text-white tracking-widest">Z</span>
              </motion.div>
              
              <h1 className="text-3xl font-bold mb-2">Zakariyo.uz</h1>
              <p className="text-[#aaaaaa] text-center mb-8">
                Tizimga kirish uchun telefon raqamingizni yoki akkauntingizni kiriting
              </p>

              <div className="w-full space-y-4">
                <div className="bg-[#212121] rounded-2xl p-4 border border-[#2f2f2f] focus-within:border-[#3390ec] transition-all">
                  <label className="block text-xs text-[#3390ec] font-medium mb-1 uppercase tracking-wider">Telefon yoki Akkaunt (@username)</label>
                  <input 
                    type="text" 
                    placeholder="+998 90 000 00 00 yoki @user" 
                    className="w-full bg-transparent border-none text-xl outline-none placeholder:text-[#444444]"
                    value={myNumber}
                    onChange={(e) => setMyNumber(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
                  />
                </div>

                <button 
                  onClick={handleJoin}
                  className="w-full bg-[#3390ec] hover:bg-[#0088cc] text-white font-semibold py-4 rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:grayscale"
                  disabled={myNumber.length < 7}
                >
                  Davom etish
                </button>
              </div>

              <p className="mt-12 text-[#444444] text-xs text-center max-w-[200px]">
                Zakariyo.uz orqali xavfsiz va tezkor muloqot qiling
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={`${!showSidebar && activeChatId ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-[420px] flex-col border-r border-[#0f0f0f] bg-[#181818]`}>
        <div className="p-2 flex items-center gap-2">
          <button className="p-2.5 hover:bg-[#2b2b2b] rounded-full transition-colors shrink-0">
            <Menu className="w-6 h-6 text-[#aaaaaa]" />
          </button>
          <div className="flex-1 relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#aaaaaa] group-focus-within:text-[#3390ec] transition-colors" />
            <input 
              type="text" 
              placeholder="Qidiruv" 
              className="w-full bg-[#212121] border-none rounded-2xl py-2 pl-11 pr-4 text-[15px] focus:ring-2 focus:ring-[#3390ec] outline-none transition-all placeholder:text-[#8a8a8a]"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pt-1">
          {filteredChats.map(chat => (
            <button 
              key={chat.id}
              onClick={() => {
                setActiveChatId(chat.id);
                if (window.innerWidth < 768) setShowSidebar(false);
              }}
              className={`w-[calc(100%-16px)] mx-2 my-0.5 flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer group ${activeChatId === chat.id ? 'bg-[#3390ec] text-white shadow-lg' : 'hover:bg-[#2c2c2c]'}`}
            >
              <div className="relative shrink-0">
                <img src={chat.avatar} alt={chat.name} className="w-[54px] h-[54px] rounded-full object-cover shadow-sm" />
                {chat.online && (
                  <div className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 border-[2.5px] rounded-full ${activeChatId === chat.id ? 'bg-white border-[#3390ec]' : 'bg-[#00c73c] border-[#181818]'}`} />
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className={`font-semibold text-[16px] truncate ${activeChatId === chat.id ? 'text-white' : 'text-[#ffffff]'}`}>{chat.name}</span>
                  <div className="flex flex-col items-end gap-1.5 min-w-[50px]">
                    <span className={`text-[12px] font-medium ${activeChatId === chat.id ? 'text-white/80' : 'text-[#8a8a8a]'}`}>{chat.lastMessageTime}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-[15px] truncate max-w-[85%] ${activeChatId === chat.id ? 'text-white/90' : 'text-[#aaaaaa]'}`}>
                    {chat.id === '1' && <span className="text-[#3390ec] font-bold group-hover:text-white mr-1 transition-colors">Zakariyo.uz:</span>}
                    {chat.lastMessage}
                  </p>
                  {chat.id === '1' && activeChatId !== chat.id && (
                    <div className="bg-[#3390ec] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
                      1
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`${!activeChatId ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-[#0f0f0f] relative`}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <header className="h-[60px] border-b border-[#0f0f0f] bg-[#181818] flex items-center justify-between px-4 z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowSidebar(true)}
                  className="md:hidden p-2 hover:bg-[#2b2b2b] rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-[#aaaaaa]" />
                </button>
                <div className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <img src={activeChat.avatar} alt={activeChat.name} className="w-10 h-10 rounded-full object-cover border border-[#2f2f2f]" />
                    {activeChat.online && !activeChat.isGroup && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#42b6ff] border-2 border-[#181818] rounded-full" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-[16px] group-hover:text-[#3390ec] transition-colors">{activeChat.name}</h2>
                    <p className="text-[13px] text-[#42b6ff] font-medium opacity-90">
                      {activeChat.isGroup ? `${activeChat.memberCount} a'zo` : (activeChat.online ? 'onlayn' : 'sovg\'a qilingan')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={toggleVideoCall}
                  className="p-2.5 hover:bg-[#2b2b2b] rounded-full text-[#aaaaaa] hover:text-[#3390ec] transition-all"
                >
                  <Video className="w-5 h-5" />
                </button>
                <button className="hidden sm:block p-2.5 hover:bg-[#2b2b2b] rounded-full text-[#aaaaaa] hover:text-white transition-all">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2.5 hover:bg-[#2b2b2b] rounded-full text-[#aaaaaa] hover:text-white transition-all">
                  <Search className="w-5 h-5" />
                </button>
                <button className="p-2.5 hover:bg-[#2b2b2b] rounded-full text-[#aaaaaa] hover:text-white transition-all">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-1.5 bg-[#0f0f0f] relative custom-scrollbar scroll-smooth"
              onClick={() => setContextMenu(null)}
            >
              {/* Wallpaper Overlay */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.03] grayscale invert"
                style={{ 
                  backgroundImage: 'url("https://web.telegram.org/a/chat-bg-pattern-dark.ad38368a97cae5702781.png")',
                  backgroundSize: '400px',
                  backgroundRepeat: 'repeat'
                }}
              />
              <AnimatePresence initial={false}>
                {activeChat.messages.map((msg) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    key={msg.id}
                    onContextMenu={(e) => handleLongPress(e, msg.id)}
                    className={`max-w-[85%] md:max-w-[70%] px-3 py-1.5 rounded-xl md:rounded-2xl relative select-none cursor-pointer group shadow-sm transition-all hover:brightness-110 ${
                      msg.sender === 'me' 
                        ? 'bg-[#2b5278] self-end rounded-tr-none text-white' 
                        : 'bg-[#212121] self-start rounded-tl-none text-[#ffffff]'
                    }`}
                  >
                    {msg.type === 'audio' ? (
                      <div className="flex items-center gap-3 py-1 px-1 min-w-[200px]">
                        <button className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors shrink-0">
                          <Mic className="w-5 h-5 text-white" />
                        </button>
                        <div className="flex-1">
                          <div className="flex gap-0.5 items-end h-6 w-full">
                            {[0.4, 0.7, 0.3, 0.9, 0.5, 0.8, 0.4, 0.6, 0.3, 0.7, 0.5, 0.8].map((h, i) => (
                              <div key={i} className="flex-1 bg-white/30 rounded-t-full" style={{ height: `${h * 100}%` }} />
                            ))}
                          </div>
                          <span className="text-[10px] mt-1 opacity-70 font-mono tracking-tighter">
                            0:{msg.duration?.toString().padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[15px] md:text-[16px] leading-snug whitespace-pre-wrap">{msg.text}</p>
                    )}
                    
                    {msg.reactions && Object.entries(msg.reactions).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {Object.entries(msg.reactions).map(([emoji, count]) => (
                          <div key={emoji} className="bg-black/20 px-2 py-0.5 rounded-full text-[11px] flex items-center gap-1 backdrop-blur-sm border border-white/5">
                            <span>{emoji}</span>
                            <span className="font-bold opacity-90">{count}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <span className="text-[10px] opacity-60 font-medium">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.sender === 'me' && (
                         <CheckCheck className="w-3.5 h-3.5 text-[#42b6ff]" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Context Menu with Reactions */}
            <AnimatePresence>
              {contextMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  style={{ top: Math.min(contextMenu.y, window.innerHeight - 300), left: Math.min(contextMenu.x, window.innerWidth - 200) }}
                  className="fixed z-[100] bg-[#212121] border border-[#2f2f2f] rounded-xl py-2 w-52 shadow-2xl overflow-hidden"
                >
                  <div className="px-4 py-2 border-b border-[#2f2f2f] flex justify-between gap-1">
                    {['❤️', '👍', '🔥', '😂', '😮'].map(emoji => (
                      <button 
                        key={emoji}
                        onClick={() => handleReaction(contextMenu.id, emoji)}
                        className="text-xl hover:scale-150 transition-transform p-1"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => handleDeleteMessage(contextMenu.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 text-red-400 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span className="font-medium text-sm">O'chirish</span>
                  </button>
                  <button 
                    onClick={() => {
                      const msg = activeChat.messages.find(m => m.id === contextMenu.id);
                      if (msg) handleShareMessage(msg);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2b2b2b] text-white transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="font-medium text-sm">Ulashish</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sticker Picker */}
            <AnimatePresence>
              {showStickers && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-20 left-4 bg-[#212121] border border-[#2f2f2f] rounded-2xl p-4 w-72 shadow-2xl z-20"
                >
                  <div className="grid grid-cols-5 gap-2">
                    {STICKERS.map((sticker, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleSendMessage(sticker)}
                        className="text-2xl p-2 hover:bg-[#2b2b2b] rounded-xl transition-all hover:scale-125"
                      >
                        {sticker}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="p-2 md:p-4 bg-[#212121] flex items-center gap-2 md:gap-4 max-w-4xl mx-auto w-full mb-0 md:mb-4 md:rounded-xl shadow-lg border-t border-[#2f2f2f] md:border-none relative z-10">
              {isRecording ? (
                <div className="flex-1 flex items-center gap-4 text-[#3390ec] animate-pulse">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="font-medium">Yozib olinmoqda... 0:{recordingDuration.toString().padStart(2, '0')}</span>
                </div>
              ) : (
                <>
                  <button className="p-2 hover:bg-[#2b2b2b] rounded-full text-[#aaaaaa]">
                    <Paperclip className="w-6 h-6" />
                  </button>
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          // Do nothing, force user to use the send button as requested
                        }
                      }}
                      placeholder="Xaba yozing..." 
                      className="w-full bg-transparent border-none py-2 px-0 text-sm md:text-base outline-none pr-10"
                    />
                    <button 
                      onClick={() => setShowStickers(!showStickers)}
                      className={`absolute right-0 top-1/2 -translate-y-1/2 p-2 ${showStickers ? 'text-[#3390ec]' : 'text-[#aaaaaa]'} hover:text-[#3390ec] transition-colors`}
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}
              
              {isRecording ? (
                <button 
                  onClick={stopRecording}
                  className="w-12 h-12 bg-red-500 flex items-center justify-center rounded-full text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  <Send className="w-6 h-6 rotate-[-45deg] scale-x-[-1]" />
                </button>
              ) : inputText.trim() ? (
                <button 
                  onClick={() => handleSendMessage()}
                  className="w-12 h-12 bg-[#3390ec] flex items-center justify-center rounded-full text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  <Send className="w-6 h-6 ml-0.5" />
                </button>
              ) : (
                <button 
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  className="w-12 h-12 bg-[#3390ec] flex items-center justify-center rounded-full text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  <Mic className="w-6 h-6" />
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#aaaaaa] p-8 text-center">
            <div className="bg-[#212121] p-6 rounded-full mb-4">
              <Menu className="w-12 h-12 opacity-20" />
            </div>
            <h2 className="text-xl font-medium text-white mb-2 decoration-[#3390ec] border-b border-[#3390ec] pb-1">Zakariyo.uz</h2>
            <p className="max-w-xs">Xabar almashishni boshlash uchun chatni tanlang.</p>
          </div>
        )}

        {/* Video Call Overlay */}
        <AnimatePresence>
          {isVideoCalling && (
            <motion.div 
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="absolute inset-0 z-50 bg-[#0f0f0f] flex flex-col"
            >
              <div className="relative flex-1 bg-black overflow-hidden group">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover"
                />
                
                {/* Header Overlay */}
                <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-4">
                    <img src={activeChat?.avatar} className="w-12 h-12 rounded-full border-2 border-white/20" alt="" />
                    <div>
                      <h3 className="font-bold text-lg">{activeChat?.name}</h3>
                      <p className="text-sm text-[#08c05e] flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#08c05e] rounded-full animate-pulse" />
                        Videoxabar yoqilgan
                      </p>
                    </div>
                  </div>
                </div>

                {/* Main Controls Overlay */}
                <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-8 px-6">
                  <div className="flex items-center gap-6">
                    <button className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-all border border-white/10 group">
                      <Mic className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                    </button>
                    <button 
                      onClick={toggleVideoCall}
                      className="w-18 h-18 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-2xl hover:scale-105 active:scale-95"
                    >
                      <X className="w-8 h-8 text-white" />
                    </button>
                    <button 
                      onClick={toggleCamera}
                      className={`w-14 h-14 backdrop-blur-md rounded-full flex items-center justify-center transition-all border border-white/10 group ${isVideoEnabled ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500 hover:bg-red-600'}`}
                    >
                      <Camera className={`w-6 h-6 text-white group-hover:scale-110 transition-transform ${!isVideoEnabled ? 'opacity-50' : ''}`} />
                    </button>
                  </div>
                  
                  <div className="flex gap-4">
                    <button className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-white/80 hover:text-white flex items-center gap-2 transition-all">
                      <Maximize2 className="w-4 h-4" />
                      <span className="text-sm font-medium">To'liq ekran</span>
                    </button>
                    <button className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-white/80 hover:text-white flex items-center gap-2 transition-all">
                      <Minimize2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Mini-rejim</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
