export interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: number;
  reactions?: { [emoji: string]: number };
  type?: 'text' | 'audio';
  audioUrl?: string;
  duration?: number;
}

export interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  online: boolean;
  messages: Message[];
  phoneNumber?: string;
  isGroup?: boolean;
  memberCount?: number;
}
