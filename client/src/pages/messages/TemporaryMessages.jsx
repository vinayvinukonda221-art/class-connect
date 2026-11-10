import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../services/api';
export const TemporaryMessages = () => {
    const { user, isAdmin } = useAuth();
    const { messages, sendMessage, typingUsers, sendTyping, sendStopTyping, refreshMessages } = useSocket();
    const [text, setText] = useState('');
    const [ttlHours, setTtlHours] = useState(24);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    const handleInputChange = (e) => {
        setText(e.target.value);
        sendTyping();
        if (typingTimeoutRef.current)
            clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            sendStopTyping();
        }, 2000);
    };
    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim())
            return;
        setSending(true);
        sendStopTyping();
        try {
            await sendMessage(text.trim(), ttlHours);
            setText('');
        }
        catch (err) {
            alert('Failed to send message: ' + err.message);
        }
        finally {
            setSending(false);
        }
    };
    const handleDelete = async (messageId) => {
        if (!confirm('Are you sure you want to delete this broadcast message?'))
            return;
        try {
            await api.delete(`/temporary-messages/messages/${messageId}`);
            await refreshMessages();
        }
        catch (err) {
            alert('Failed to delete message: ' + err.message);
        }
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E3E3E3]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0D0D0D]">Messages</h1>
          <p className="text-xs text-[#4D4D4D] mt-0.5">
            Communication channel for Section 21 students, CRs, and faculty
          </p>
        </div>
      </div>

      {/* Main Chat Stream Container */}
      <Card className="h-[65vh] flex flex-col justify-between p-0 overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (<div className="py-20 text-center text-xs text-[#888888]">
              No messages in Section 21 right now. Post an announcement or ask a question to start.
            </div>) : (messages.map((m) => {
            const isSender = m.sender?._id === user?.id || m.senderName === user?.name;
            const isAnnouncement = m.isAnnouncement || m.senderRole === 'cr' || m.senderRole === 'admin';
            return (<div key={m._id} className={`flex items-start gap-3 ${isSender ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Sender Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${isAnnouncement
                    ? 'bg-[#6C35F5] text-white'
                    : isSender
                        ? 'bg-[#0D0D0D] text-white'
                        : 'bg-[#F4F0FF] text-[#6C35F5] border border-purple-200'}`}>
                    {m.senderName ? m.senderName.charAt(0).toUpperCase() : 'U'}
                  </div>

                  {/* Message Bubble */}
                  <div className={`max-w-[75%] sm:max-w-[65%] rounded-lg p-3.5 space-y-1 text-xs border ${isAnnouncement
                    ? 'bg-[#FFFDF0] border-amber-200 text-[#0D0D0D]'
                    : isSender
                        ? 'bg-[#0D0D0D] text-white border-[#0D0D0D]'
                        : 'bg-[#F8F8FB] border-[#E3E3E3] text-[#0D0D0D]'}`}>
                    <div className="flex items-center justify-between gap-3 text-[11px]">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <span className={isSender ? 'text-purple-200' : 'text-[#6C35F5]'}>
                          {m.senderName}
                        </span>
                        {m.senderRollNumber && (<span className={`font-mono text-[10px] font-normal ${isSender ? 'text-neutral-400' : 'text-[#888888]'}`}>
                            ({m.senderRollNumber})
                          </span>)}
                        {isAnnouncement && (<Badge variant="purple" size="sm">
                            Announcement
                          </Badge>)}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-[10px] ${isSender ? 'text-neutral-400' : 'text-[#888888]'}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                })}
                        </span>

                        {(isSender || isAdmin) && (<button onClick={() => handleDelete(m._id)} className="p-0.5 text-neutral-400 hover:text-red-400 transition-colors" title="Delete message">
                            <Trash2 className="w-3 h-3"/>
                          </button>)}
                      </div>
                    </div>

                    <p className="leading-relaxed whitespace-pre-wrap mt-1">{m.message}</p>
                  </div>
                </div>);
        }))}

          <div ref={messagesEndRef}/>
        </div>

        {/* Typing indicator */}
        {typingUsers.length > 0 && (<div className="px-4 py-1 text-[11px] font-mono text-[#6C35F5] bg-[#F8F8FB] border-t border-[#E3E3E3]">
            {typingUsers.join(', ')} {typingUsers.length > 1 ? 'are' : 'is'} typing...
          </div>)}

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-[#E3E3E3] flex items-center gap-2">
          {/* TTL selector */}
          <select value={ttlHours} onChange={(e) => setTtlHours(Number(e.target.value))} className="text-[11px] font-mono bg-[#F8F8FB] border border-[#E3E3E3] rounded-sm py-2 px-2 text-[#4D4D4D] focus:outline-none focus:border-[#6C35F5] shrink-0" title="Message Expiration Period">
            <option value={6}>Expire in 6h</option>
            <option value={12}>Expire in 12h</option>
            <option value={24}>Expire in 24h</option>
            <option value={48}>Expire in 48h</option>
          </select>

          <input type="text" value={text} onChange={handleInputChange} placeholder="Type a message..." className="flex-1 bg-[#F8F8FB] border border-[#E3E3E3] rounded-sm px-3.5 py-2 text-xs text-[#0D0D0D] placeholder:text-[#888888] focus:outline-none focus:border-[#6C35F5] focus:bg-white transition-all" maxLength={1000}/>

          <Button type="submit" variant="primary" size="sm" isLoading={sending} disabled={!text.trim()} className="px-3" title="Send message">
            <Send className="w-4 h-4"/>
          </Button>
        </form>
      </Card>
    </div>);
};
