import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Sparkles, 
  Clock, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  X,
  User,
  Bot,
  CreditCard
} from 'lucide-react';
import { db } from '../../lib/database';
import { Task, TaskPriority, TaskStatus, TaskSource } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

export const TasksView: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterSource, setFilterSource] = useState<string>('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New task form state
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [clientId, setClientId] = useState('');

  const tasks = db.getTasks();
  const clients = db.getClients();

  const filteredTasks = tasks.filter(t => {
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    if (filterSource !== 'ALL' && t.source !== filterSource) return false;
    return true;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    db.createTask({
      title: title.trim(),
      description: desc.trim(),
      priority,
      due_date: dueDate,
      status: 'TODO',
      source: 'ADMIN',
      client_id: clientId || null,
      assigned_to: 'a0000000-0000-0000-0000-000000000001',
    });

    setIsCreateOpen(false);
    setTitle('');
    setDesc('');
  };

  const handleToggleStatus = (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    db.updateTaskStatus(task.id, nextStatus);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Agency tasks</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Operational action items derived from onboarding, client messages, appointments, and AI triage
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="btn-primary text-xs px-4 py-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create task</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-[var(--card-border)] rounded-xl text-xs">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'TODO', label: 'To do' },
            { id: 'IN_PROGRESS', label: 'In progress' },
            { id: 'BLOCKED', label: 'Blocked' },
            { id: 'COMPLETED', label: 'Completed' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setFilterStatus(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                filterStatus === st.id
                  ? 'bg-gradient-to-r from-[#9B51E0]/25 via-[#7662FA]/20 to-[#00C6FF]/20 text-white font-semibold border border-[#7662FA]/40 shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-white'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Source Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[var(--text-muted)]">Source:</span>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-white text-xs focus:outline-none"
          >
            <option value="ALL">All sources</option>
            <option value="BILLING">Billing & renewal triggers</option>
            <option value="AI">AI autonomous created</option>
            <option value="CLIENT_MESSAGE">From client message</option>
            <option value="ONBOARDING">From onboarding</option>
            <option value="ADMIN">Manual operator</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="glass-card bg-[var(--card-bg)] border border-[var(--card-border)] p-12 text-center rounded-xl text-xs text-[var(--text-muted)]">
            No tasks found in this view.
          </div>
        ) : (
          filteredTasks.map((t) => {
            const client = clients.find(c => c.id === t.client_id);
            const isDone = t.status === 'COMPLETED';

            return (
              <div
                key={t.id}
                className={`p-5 rounded-[18px] glass-card bg-[var(--card-bg)] border border-[var(--card-border)] flex items-start justify-between gap-4 transition-all ${
                  isDone ? 'opacity-60' : 'hover:translate-y-[-1px]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleStatus(t)}
                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center transition-colors cursor-pointer ${
                      isDone
                        ? 'bg-[var(--success)] text-[#0B0F17]'
                        : 'border border-white/20 hover:border-[#00C6FF]'
                    }`}
                  >
                    {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${isDone ? 'line-through text-[var(--text-muted)]' : 'text-white'}`}>
                        {t.title}
                      </span>

                      {/* Source tag */}
                      {t.source === 'AI' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#00C6FF]">
                          <Sparkles className="w-3 h-3" />
                          <span>AI-created</span>
                        </span>
                      ) : t.source === 'BILLING' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[var(--warning)]">
                          <CreditCard className="w-3 h-3" />
                          <span>Billing reminder</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {t.source.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      )}

                      <StatusBadge status={t.priority} type="priority" />
                    </div>

                    {t.description && (
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                        {t.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-[11px] text-[var(--text-muted)] pt-1">
                      {client && (
                        <span>Client: <span className="font-semibold text-white">{client.company_name}</span></span>
                      )}
                      <span>Due: <span className="font-semibold text-white font-mono-numbers">{t.due_date}</span></span>
                      <span>Assigned: <span className="text-white">{t.assigned_to ? 'Operator' : 'Sovereign operator'}</span></span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <StatusBadge status={t.status} type="task" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Task Modal */}
      {isCreateOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm modal-backdrop-enter"
          onClick={() => setIsCreateOpen(false)}
        >
          <div 
            className="bg-[var(--card-bg)] border border-[var(--card-border)] glass-panel neo-modal modal-sheet-enter rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-[var(--card-bg)]/80 flex items-center justify-between border-b border-[var(--card-border)]">
              <h2 className="text-base font-bold text-white">Create agency task</h2>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 text-[var(--text-muted)] hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-white">Task title *</label>
                <input
                  type="text"
                  placeholder="e.g. Verify voice interruption sensitivity"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-white">Description</label>
                <textarea
                  rows={2}
                  placeholder="Task steps or technical details..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-white">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-white focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-white">Due date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-white focus:outline-none font-mono-numbers"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-white">Client (optional)</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-white focus:outline-none"
                >
                  <option value="">No specific client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="btn-secondary text-xs px-4 py-2 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs px-5 py-2 cursor-pointer shadow-lg"
                >
                  Save task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
