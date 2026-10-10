import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  Plus, 
  Clock, 
  User, 
  Bot, 
  ShieldCheck, 
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { db } from '../../lib/database';
import { Message, Client } from '../../types';
import { formatInTimezone } from '../../lib/timezone';
import { StatusBadge } from '../common/StatusBadge';

export const MessagesView: React.FC = () => {
  const clients = db.getClients();
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'needs_reply'>('all');
  const [replyText, setReplyText] = useState('');
  const [taskCreatedNotice, setTaskCreatedNotice] = useState<string | null>(null);

  const selectedClient = clients.find(c => c.id === selectedClientId) || clients[0];
  const allThreads = db.getThreads();

  // Group threads by client
  const clientThreads = clients.map(client => {
    const threadRecord = allThreads.find(t => t.client_id === client.id);
    const messages = db.getMessages(client.id);
    const lastMsg = messages[messages.length - 1];
    const unreadCount = messages.filter(m => !m.is_read && m.sender_type === 'CLIENT').length;
    const needsReply = threadRecord?.status === 'NEEDS_REPLY' || lastMsg?.sender_type === 'CLIENT';

    return {
      client,
      messages,
      lastMsg,
      unreadCount,
      needsReply,
    };
  });

  const filteredThreads = clientThreads.filter(t => {
    if (filterMode === 'unread') return t.unreadCount > 0;
    if (filterMode === 'needs_reply') return t.needsReply;
    return true;
  });

  const activeThread = selectedClient ? db.getMessages(selectedClient.id) : [];
  const latestClientMessage = [...activeThread].reverse().find(m => m.sender_type === 'CLIENT');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedClient) return;

    db.sendMessage({
      client_id: selectedClient.id,
      sender_type: 'ADMIN',
      sender_name: 'Sovereign Operator',
      body: replyText.trim(),
    });

    setReplyText('');
  };

  const handleUseDraft = (draft: string) => {
    setReplyText(draft);
  };

  const handleCreateTaskFromMessage = (msg: Message) => {
    if (!selectedClient) return;
    db.createTask({
      client_id: selectedClient.id,
      title: `Client action: ${msg.body.slice(0, 50)}...`,
      description: `Generated from client message: "${msg.body}"`,
      priority: msg.ai_priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
      due_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      status: 'TODO',
      source: 'CLIENT_MESSAGE',
      assigned_to: 'a0000000-0000-0000-0000-000000000001',
    });

    setTaskCreatedNotice(`Task spawned for ${selectedClient.company_name}!`);
    setTimeout(() => setTaskCreatedNotice(null), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#EDEAE2]">Client communications</h1>
          <p className="text-xs text-[#8B8D93] mt-1">
            Private client messaging with autonomous reply synthesis and triage
          </p>
        </div>

        <div className="flex items-center gap-2">
          {taskCreatedNotice && (
            <div className="px-3 py-1.5 rounded-lg text-xs text-[#4CAF7D] neo-inset animate-in fade-in">
              {taskCreatedNotice}
            </div>
          )}
        </div>
      </div>

      {/* Main 2-Column Split Console */}
      <div className="grid grid-cols-1 md:grid-cols-12 rounded-xl neo-raised overflow-hidden min-h-[620px]">
        
        {/* Left 4 Cols: Thread List */}
        <div className="md:col-span-4 bg-[#17181B] flex flex-col">
          {/* Thread Filter Bar */}
          <div className="p-3 flex items-center justify-between gap-1 text-xs">
            {(['all', 'unread', 'needs_reply'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-colors text-xs ${
                  filterMode === mode
                    ? 'neo-inset text-[#EDEAE2] font-semibold'
                    : 'text-[#8B8D93] hover:text-[#EDEAE2]'
                }`}
              >
                {mode === 'needs_reply' ? 'Needs reply' : mode === 'unread' ? 'Unread' : 'All'}
              </button>
            ))}
          </div>

          {/* Thread Rows */}
          <div className="divide-y divide-white/5 overflow-y-auto flex-1 max-h-[560px]">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8B8D93]">
                No client conversation threads matching filter.
              </div>
            ) : (
              filteredThreads.map(({ client, lastMsg, unreadCount, needsReply }) => {
                const isSelected = selectedClient?.id === client.id;

                return (
                  <div
                    key={client.id}
                    onClick={() => {
                      setSelectedClientId(client.id);
                      db.markMessagesRead(client.id);
                    }}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#1D1F23]'
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#EDEAE2] truncate">
                        {client.company_name}
                      </span>
                      {lastMsg && (
                        <span className="text-[11px] text-[#8B8D93] font-mono-numbers">
                          {new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[#8B8D93] truncate mt-1">
                      {lastMsg ? (
                        <span>
                          <span className="font-semibold text-[#EDEAE2]">
                            {lastMsg.sender_type === 'ADMIN' ? 'Operator' : client.contact_name}:
                          </span>{' '}{lastMsg.body}
                        </span>
                      ) : 'No messages yet'}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#00C6FF]/15 text-[#00C6FF] border border-[#00C6FF]/30 font-mono">
                          {unreadCount} unread
                        </span>
                      )}
                      {needsReply && unreadCount === 0 && (
                        <span className="text-[11px] text-[var(--warning)]">
                          Needs reply
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right 8 Cols: Active Conversation & AI Assistant */}
        <div className="md:col-span-8 flex flex-col justify-between bg-[var(--card-bg)]">
          
          {selectedClient ? (
            <>
              {/* Thread Header */}
              <div className="p-4 bg-white/[0.02] border-b border-[var(--card-border)] flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-white">{selectedClient.company_name}</h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {selectedClient.contact_name} · Local time: {formatInTimezone(new Date().toISOString(), selectedClient.timezone, 'time')} ({selectedClient.timezone})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedClient.service_status} type="service" />
                </div>
              </div>

              {/* AI Message Assistant Box */}
              {latestClientMessage && (latestClientMessage.ai_suggested_reply || latestClientMessage.ai_category) && (
                <div className="m-4 p-3.5 rounded-2xl neo-inset space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#00C6FF]" />
                      <span className="font-semibold text-white text-xs">
                        AI copilot message analysis
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[var(--warning)] font-mono">
                        {latestClientMessage.ai_category || 'General'}
                      </span>
                      <span className="text-[var(--text-muted)]">·</span>
                      <span className="text-[#00C6FF] font-mono">
                        Priority: {latestClientMessage.ai_priority ? latestClientMessage.ai_priority.toLowerCase() : 'medium'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    <span className="font-semibold text-white">Summary: </span>
                    {latestClientMessage.ai_summary || latestClientMessage.body}
                  </p>

                  {latestClientMessage.ai_suggested_reply && (
                    <div className="p-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-xs text-white leading-relaxed">
                      <span className="text-[11px] text-[var(--text-muted)] block mb-1">
                        AI suggested draft (propose only):
                      </span>
                      "{latestClientMessage.ai_suggested_reply}"
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      onClick={() => handleCreateTaskFromMessage(latestClientMessage)}
                      className="text-[var(--text-muted)] hover:text-white inline-flex items-center gap-1 text-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create task from message</span>
                    </button>

                    {latestClientMessage.ai_suggested_reply && (
                      <button
                        onClick={() => handleUseDraft(latestClientMessage.ai_suggested_reply || '')}
                        className="btn-primary px-3 py-1 text-xs cursor-pointer"
                      >
                        Use draft
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Messages Body */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1 max-h-[380px]">
                {activeThread.length === 0 ? (
                  <div className="text-center text-xs text-[#8B8D93] py-12">
                    No messages yet in this conversation. Send the initial client greeting below.
                  </div>
                ) : (
                  activeThread.map((msg) => {
                    const isAdmin = msg.sender_type === 'ADMIN';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[80%] ${isAdmin ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                      >
                        <div className="flex items-center gap-2 text-[11px] text-[#8B8D93] mb-1 font-mono-numbers">
                          <span>{isAdmin ? 'Operator' : selectedClient.contact_name}</span>
                          <span>·</span>
                          <span>{formatInTimezone(msg.created_at, selectedClient.timezone, 'time')}</span>
                        </div>

                        <div
                          className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                            isAdmin
                              ? 'neo-inset text-[#EDEAE2]'
                              : 'neo-flat bg-[#17181B] text-[#EDEAE2]'
                          }`}
                        >
                          {msg.body}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Composer */}
              <form onSubmit={handleSend} className="p-4 bg-[#17181B]">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Message ${selectedClient.contact_name} (${selectedClient.company_name})...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 neo-inset rounded-xl px-4 py-2.5 text-xs text-[#EDEAE2] placeholder-[#8B8D93] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="p-2.5 btn-primary disabled:opacity-40 rounded-xl"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-[#8B8D93]">
              Select a client to view and send messages.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
