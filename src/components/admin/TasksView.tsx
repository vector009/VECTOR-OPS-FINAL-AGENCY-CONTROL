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
          <h1 className="text-2xl font-semibold tracking-tight text-[#EDEAE2]">Agency tasks</h1>
          <p className="text-xs text-[#8B8D93] mt-1">
            Operational action items derived from onboarding, client messages, appointments, and AI triage
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="btn-primary text-xs px-4 py-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create task</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-[#1D1F23] rounded-xl text-xs">
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
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                filterStatus === st.id
                  ? 'neo-inset text-[#EDEAE2] font-semibold'
                  : 'text-[#8B8D93] hover:text-[#EDEAE2]'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Source Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#8B8D93]">Source:</span>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-3 py-1.5 rounded-xl neo-inset text-[#EDEAE2] text-xs focus:outline-none"
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

      {/* Tasks List — Flat, no shadow, scannable */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="neo-flat bg-[#1D1F23] p-12 text-center rounded-xl text-xs text-[#8B8D93]">
            No tasks found in this view.
          </div>
        ) : (
          filteredTasks.map((t) => {
            const client = clients.find(c => c.id === t.client_id);
            const isDone = t.status === 'COMPLETED';

            return (
              <div
                key={t.id}
                className={`p-5 rounded-[16px] neo-raised bg-[#1D1F23] flex items-start justify-between gap-4 transition-all ${
                  isDone ? 'opacity-60' : 'hover:translate-y-[-1px]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleStatus(t)}
                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center transition-colors ${
                      isDone
                        ? 'bg-[#4CAF7D] text-[#17181B]'
                        : 'border border-white/20 hover:border-[#E2896A]'
                    }`}
                  >
                    {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${isDone ? 'line-through text-[#8B8D93]' : 'text-[#EDEAE2]'}`}>
                        {t.title}
                      </span>

                      {/* Source tag */}
                      {t.source === 'AI' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#E2896A]">
                          <Sparkles className="w-3 h-3" />
                          <span>AI-created</span>
                        </span>
                      ) : t.source === 'BILLING' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#E0A94C]">
                          <CreditCard className="w-3 h-3" />
                          <span>Billing reminder</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#8B8D93]">
                          {t.source.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      )}

                      <StatusBadge status={t.priority} type="priority" />
                    </div>

                    {t.description && (
                      <p className="text-xs text-[#8B8D93] leading-relaxed">
                        {t.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-[11px] text-[#8B8D93] pt-1">
                      {client && (
                        <span>Client: <span className="font-semibold text-[#EDEAE2]">{client.company_name}</span></span>
                      )}
                      <span>Due: <span className="font-semibold text-[#EDEAE2] font-mono-numbers">{t.due_date}</span></span>
                      <span>Assigned: <span className="text-[#EDEAE2]">{t.assigned_to ? 'Operator' : 'Sovereign operator'}</span></span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#1D1F23] neo-modal rounded-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-[#17181B] flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#EDEAE2]">Create agency task</h2>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 text-[#8B8D93] hover:text-[#EDEAE2]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#EDEAE2]">Task title *</label>
                <input
                  type="text"
                  placeholder="e.g. Verify voice interruption sensitivity"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#EDEAE2]">Description</label>
                <textarea
                  rows={2}
                  placeholder="Task steps or technical details..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full px-3 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#EDEAE2]">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#EDEAE2]">Due date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none font-mono-numbers"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#EDEAE2]">Client (optional)</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
                >
                  <option value="">No specific client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs px-4 py-2"
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
