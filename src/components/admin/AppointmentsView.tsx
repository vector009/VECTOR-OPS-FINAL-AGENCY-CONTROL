import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  X, 
  Video, 
  Calendar, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  Edit2
} from 'lucide-react';
import { db } from '../../lib/database';
import { Appointment, MeetingProvider } from '../../types';
import { formatInTimezone } from '../../lib/timezone';
import { StatusBadge } from '../common/StatusBadge';

export const AppointmentsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPill, setFilterPill] = useState<'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [detailAppointment, setDetailAppointment] = useState<Appointment | null>(null);

  // New Appointment Modal
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [newClientId, setNewClientId] = useState('');
  const [newTopic, setNewTopic] = useState('Voice Agent Latency Tuning & Script Review');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('11:00');
  const [newMeetingUrl, setNewMeetingUrl] = useState('');
  const [bookingError, setBookingError] = useState('');

  // Reschedule Modal
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('14:00');
  const [rescheduleError, setRescheduleError] = useState('');

  // Attach Meeting Link Modal
  const [isAttachLinkOpen, setIsAttachLinkOpen] = useState(false);
  const [attachUrl, setAttachUrl] = useState('');
  const [attachProvider, setAttachProvider] = useState<MeetingProvider>('GOOGLE_MEET');

  const appointments = db.getAppointments();
  const clients = db.getAllClientsIncludingArchived();
  const settings = db.getSettings();

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    const client = clients.find(c => c.id === apt.client_id);
    const term = searchTerm.toLowerCase().trim();

    const matchesSearch = !term ||
      (apt.topic && apt.topic.toLowerCase().includes(term)) ||
      (client && client.company_name.toLowerCase().includes(term)) ||
      (client && client.contact_name.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    if (filterPill === 'UPCOMING') {
      return apt.status === 'CONFIRMED' || apt.status === 'REQUESTED' || apt.status === 'PROPOSED';
    }
    if (filterPill === 'COMPLETED') {
      return apt.status === 'COMPLETED';
    }
    if (filterPill === 'CANCELLED') {
      return apt.status === 'CANCELLED';
    }
    return true; // 'ALL'
  });

  const getClientForAppointment = (clientId: string) => {
    return clients.find(c => c.id === clientId);
  };

  const handleOpenQuickJoin = (apt: Appointment, e: React.MouseEvent) => {
    e.stopPropagation();
    if (apt.meeting_url) {
      window.open(apt.meeting_url, '_blank', 'noopener,noreferrer');
    } else {
      setDetailAppointment(apt);
      setAttachUrl('');
      setIsAttachLinkOpen(true);
    }
  };

  const handleCancelAppointment = async (apt: Appointment) => {
    if (confirm(`Cancel appointment for "${apt.topic || 'Strategy meeting'}"?`)) {
      await db.cancel_appointment(apt.id, 'Cancelled by agency administrator');
      setDetailAppointment(null);
    }
  };

  const handleSaveReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailAppointment || !rescheduleDate) return;
    setRescheduleError('');

    const combinedIso = new Date(`${rescheduleDate}T${rescheduleTime}:00`).toISOString();
    const endIso = new Date(new Date(combinedIso).getTime() + 45 * 60 * 1000).toISOString();

    detailAppointment.starts_at = combinedIso;
    detailAppointment.ends_at = endIso;
    detailAppointment.status = 'CONFIRMED';
    
    // Save to memory & trigger confirm
    await db.confirm_appointment(detailAppointment.id, detailAppointment.meeting_provider || 'GOOGLE_MEET', detailAppointment.meeting_url || 'https://meet.google.com/vec-ops-vox');

    setIsRescheduleOpen(false);
    setDetailAppointment(null);
  };

  const handleSaveAttachMeetingLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailAppointment || !attachUrl.trim()) return;

    await db.confirm_appointment(detailAppointment.id, attachProvider, attachUrl.trim());
    setIsAttachLinkOpen(false);
    // Update active view
    const updated = db.getAppointments().find(a => a.id === detailAppointment.id);
    if (updated) setDetailAppointment(updated);
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');

    if (!newClientId) {
      setBookingError('Please select a client.');
      return;
    }
    if (!newDate) {
      setBookingError('Please select a date.');
      return;
    }

    const client = clients.find(c => c.id === newClientId);
    const clientTz = client?.timezone || 'Asia/Kolkata';

    const startsAtIso = new Date(`${newDate}T${newTime}:00`).toISOString();
    const endsAtIso = new Date(new Date(startsAtIso).getTime() + 45 * 60 * 1000).toISOString();

    const result = await db.request_appointment(
      newClientId,
      startsAtIso,
      endsAtIso,
      clientTz,
      settings.admin_timezone,
      newTopic.trim()
    );

    if (!result.success) {
      setBookingError(result.error || 'Failed to create appointment.');
      return;
    }

    // Auto-confirm if url provided
    if (result.appointment_id && newMeetingUrl.trim()) {
      await db.confirm_appointment(result.appointment_id, 'GOOGLE_MEET', newMeetingUrl.trim());
    }

    setIsBookModalOpen(false);
    setNewClientId('');
    setNewDate('');
    setNewMeetingUrl('');
  };

  const filterTabs: Array<{ id: 'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'; label: string }> = [
    { id: 'ALL', label: 'All' },
    { id: 'UPCOMING', label: 'Upcoming' },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Appointments</h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Calendar schedule with collision prevention and localized timezone conversion
        </p>
      </div>

      {/* TOP: Search Bar with "+" Add Button beside it */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by client or topic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs neo-inset rounded-xl text-[var(--text-primary)] placeholder-[var(--text-muted)] bg-[var(--surface-1)] focus:outline-none transition-colors"
          />
        </div>

        <button
          onClick={() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setNewDate(tomorrow.toISOString().split('T')[0]);
            setIsBookModalOpen(true);
          }}
          title="Schedule appointment"
          className="btn-primary w-10 h-10 rounded-xl flex items-center justify-center shrink-0 p-0 shadow-sm"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* BELOW: Horizontal row of filter pills — selected pill filled, others outlined */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterTabs.map((tab) => {
          const isSelected = filterPill === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterPill(tab.id)}
              className={`px-4 py-1.5 rounded-full text-xs transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-[var(--accent-blue)] text-white font-semibold shadow-sm'
                  : 'neo-flat bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-white/[0.08]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* BELOW: Vertical list of compact cards */}
      <div className="space-y-2.5">
        {filteredAppointments.length === 0 ? (
          <div className="neo-raised bg-[var(--surface-2)] p-12 text-center rounded-2xl text-[var(--text-muted)] text-xs space-y-3">
            <p className="font-semibold text-[var(--text-primary)] text-sm">No appointments match this filter</p>
            <p className="text-[var(--text-muted)]">No appointments are scheduled for the selected view.</p>
            <button
              onClick={() => setIsBookModalOpen(true)}
              className="text-xs text-[var(--accent-blue)] hover:underline font-medium pt-1"
            >
              + Schedule an appointment now
            </button>
          </div>
        ) : (
          filteredAppointments.map((apt) => {
            const client = getClientForAppointment(apt.client_id);
            const clientName = client?.company_name || 'Client Strategy Session';
            const providerName = apt.meeting_provider ? apt.meeting_provider.replace(/_/g, ' ') : 'Google Meet';

            // Calculate date relative detail with semantic color
            let dateDetailText = '';
            let dateColorClass = 'text-[var(--text-muted)]';

            if (apt.status === 'CANCELLED') {
              dateDetailText = `Cancelled · ${formatInTimezone(apt.starts_at, settings.admin_timezone, 'date')}`;
              dateColorClass = 'text-[var(--accent-red)] font-semibold';
            } else if (apt.status === 'COMPLETED') {
              dateDetailText = `Completed · ${formatInTimezone(apt.starts_at, settings.admin_timezone, 'datetime')}`;
              dateColorClass = 'text-[var(--text-muted)]';
            } else {
              const now = new Date();
              const aptDate = new Date(apt.starts_at);
              const diffHours = (aptDate.getTime() - now.getTime()) / (1000 * 60 * 60);

              const formattedTime = formatInTimezone(apt.starts_at, settings.admin_timezone, 'datetime');

              if (diffHours < 0) {
                dateDetailText = `Scheduled ${formattedTime} · Concluded`;
                dateColorClass = 'text-[var(--text-muted)]';
              } else if (diffHours <= 24) {
                const hLeft = Math.max(1, Math.round(diffHours));
                dateDetailText = `Tomorrow/Today · in ${hLeft}h (${formattedTime})`;
                dateColorClass = 'text-[var(--accent-amber)] font-semibold';
              } else {
                const dLeft = Math.round(diffHours / 24);
                dateDetailText = `${formattedTime} · in ${dLeft}d`;
                dateColorClass = 'text-[var(--accent-green)] font-medium';
              }
            }

            return (
              <div
                key={apt.id}
                onClick={() => setDetailAppointment(apt)}
                className="neo-raised bg-[var(--surface-2)] p-4 rounded-2xl cursor-pointer hover:brightness-105 active:scale-[0.995] transition-all flex items-center justify-between gap-4"
              >
                {/* Left: 3 Lines */}
                <div className="space-y-1 min-w-0 flex-1">
                  {/* Line 1: Name (bold) */}
                  <div className="font-bold text-sm text-[var(--text-primary)] truncate">
                    {clientName}
                  </div>

                  {/* Line 2: Secondary detail · identifier */}
                  <div className="text-xs text-[var(--text-muted)] truncate">
                    {apt.topic || 'AI Voice Agent Review'} · {providerName}
                  </div>

                  {/* Line 3: Relative / date detail with semantic color */}
                  <div className={`text-xs ${dateColorClass}`}>
                    {dateDetailText}
                  </div>
                </div>

                {/* Right Side: Status Pill & Small Circular Icon Button */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <StatusBadge status={apt.status} type="appointment" />

                  {/* Small circular icon button: Video Join / Attach Meeting */}
                  <button
                    onClick={(e) => handleOpenQuickJoin(apt, e)}
                    title={apt.meeting_url ? 'Join video meeting' : 'Attach meeting link'}
                    className={`w-8 h-8 rounded-full neo-flat bg-[var(--surface-1)] hover:bg-[var(--surface-3)] flex items-center justify-center transition-all shadow-sm shrink-0 ${
                      apt.meeting_url ? 'text-[var(--accent-green)]' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DETAIL SHEET PATTERN: Bottom Sheet / Modal */}
      {detailAppointment && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm modal-backdrop-enter"
          onClick={() => setDetailAppointment(null)}
        >
          <div 
            className="w-full max-w-lg bg-[var(--surface-2)] neo-modal rounded-t-3xl sm:rounded-3xl p-6 space-y-5 text-left modal-sheet-enter shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: "Appointment Details" with X to close */}
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Appointment Details
              </h2>
              <button
                onClick={() => setDetailAppointment(null)}
                className="w-8 h-8 rounded-full neo-flat text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body: Each field as its own full-width rounded bar, label faded/muted on left, value bold on right */}
            <div className="space-y-2">
              {(() => {
                const client = getClientForAppointment(detailAppointment.client_id);
                const dateTimeStr = `${formatInTimezone(detailAppointment.starts_at, settings.admin_timezone, 'datetime')} (${settings.admin_timezone})`;

                const fields = [
                  { label: 'Client', value: client?.company_name || '—' },
                  { label: 'Service', value: detailAppointment.topic || 'AI Voice Agent Strategy & Review' },
                  { label: 'Date/Time', value: dateTimeStr },
                  { label: 'Status', value: detailAppointment.status },
                  { label: 'Meeting Link', value: detailAppointment.meeting_url || 'Pending attachment' },
                ];

                return fields.map((f, idx) => (
                  <div
                    key={idx}
                    className="w-full h-11 px-4 rounded-xl bg-[var(--surface-3)] neo-flat flex items-center justify-between text-xs transition-colors"
                  >
                    <span className="text-[var(--text-muted)] font-normal">{f.label}</span>
                    <span className="text-[var(--text-primary)] font-bold truncate max-w-[220px]">{f.value}</span>
                  </div>
                ));
              })()}
            </div>

            {/* Footer: Two pill-shaped action buttons side by side ("Reschedule" + "Cancel") */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setRescheduleDate(tomorrow.toISOString().split('T')[0]);
                  setIsRescheduleOpen(true);
                }}
                className="w-full py-2.5 rounded-full btn-primary text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Reschedule</span>
              </button>

              <button
                type="button"
                onClick={() => handleCancelAppointment(detailAppointment)}
                className="w-full py-2.5 rounded-full neo-flat bg-[var(--surface-1)] hover:brightness-105 text-[var(--accent-red)] font-semibold text-xs flex items-center justify-center gap-2"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {isRescheduleOpen && detailAppointment && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm modal-backdrop-enter"
          onClick={() => setIsRescheduleOpen(false)}
        >
          <div 
            className="bg-[var(--surface-2)] neo-modal rounded-2xl w-full max-w-md overflow-hidden text-left modal-sheet-enter shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-[var(--surface-1)] flex items-center justify-between border-b border-white/[0.06]">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Reschedule appointment</h2>
              <button onClick={() => setIsRescheduleOpen(false)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReschedule} className="p-6 space-y-4 text-xs">
              {rescheduleError && (
                <div className="p-3 rounded-lg neo-inset text-[var(--accent-red)]">
                  {rescheduleError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--text-primary)]">New Date *</label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full px-3 py-2 neo-inset rounded-xl text-[var(--text-primary)] bg-[var(--surface-1)] focus:outline-none font-mono-numbers"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--text-primary)]">New Time ({settings.admin_timezone}) *</label>
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full px-3 py-2 neo-inset rounded-xl text-[var(--text-primary)] bg-[var(--surface-1)] focus:outline-none font-mono-numbers"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsRescheduleOpen(false)}
                  className="px-4 py-2 font-normal text-[var(--text-muted)] hover:text-[var(--text-primary)] neo-raised rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 font-semibold text-xs rounded-xl"
                >
                  Confirm new time
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attach Meeting Link Modal */}
      {isAttachLinkOpen && detailAppointment && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm modal-backdrop-enter"
          onClick={() => setIsAttachLinkOpen(false)}
        >
          <div 
            className="bg-[var(--surface-2)] neo-modal rounded-2xl w-full max-w-md overflow-hidden text-left modal-sheet-enter shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-[var(--surface-1)] flex items-center justify-between border-b border-white/[0.06]">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Attach meeting link</h2>
              <button onClick={() => setIsAttachLinkOpen(false)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAttachMeetingLink} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[var(--text-primary)]">Provider</label>
                <select
                  value={attachProvider}
                  onChange={(e) => setAttachProvider(e.target.value as any)}
                  className="w-full px-3 py-2 neo-inset rounded-xl text-[var(--text-primary)] bg-[var(--surface-1)] focus:outline-none"
                >
                  <option value="GOOGLE_MEET">Google Meet</option>
                  <option value="ZOOM">Zoom</option>
                  <option value="MICROSOFT_TEAMS">Microsoft Teams</option>
                  <option value="CUSTOM_URL">Custom Web Link</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--text-primary)]">Meeting URL *</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/xyz-abc-123"
                  value={attachUrl}
                  onChange={(e) => setAttachUrl(e.target.value)}
                  className="w-full px-3 py-2 neo-inset rounded-xl text-[var(--text-primary)] bg-[var(--surface-1)] focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsAttachLinkOpen(false)}
                  className="px-4 py-2 font-normal text-[var(--text-muted)] hover:text-[var(--text-primary)] neo-raised rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!attachUrl.trim()}
                  className="btn-primary px-5 py-2 font-semibold text-xs rounded-xl disabled:opacity-50"
                >
                  Save & Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule New Appointment Modal */}
      {isBookModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm modal-backdrop-enter"
          onClick={() => setIsBookModalOpen(false)}
        >
          <div 
            className="bg-[var(--surface-2)] neo-modal rounded-2xl w-full max-w-md overflow-hidden text-left modal-sheet-enter shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-[var(--surface-1)] flex items-center justify-between border-b border-white/[0.06]">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Schedule appointment</h2>
              <button onClick={() => setIsBookModalOpen(false)} className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="p-6 space-y-4 text-xs">
              {bookingError && (
                <div className="p-3 rounded-lg neo-inset text-[var(--accent-red)]">
                  {bookingError}
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-[var(--text-primary)]">Client *</label>
                <select
                  value={newClientId}
                  onChange={(e) => setNewClientId(e.target.value)}
                  className="w-full px-3 py-2 neo-inset rounded-xl text-[var(--text-primary)] bg-[var(--surface-1)] focus:outline-none"
                >
                  <option value="">Select client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.company_name} ({c.contact_name})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--text-primary)]">Topic / Agenda</label>
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="w-full px-3 py-2 neo-inset rounded-xl text-[var(--text-primary)] bg-[var(--surface-1)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--text-primary)]">Date *</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 neo-inset rounded-xl text-[var(--text-primary)] bg-[var(--surface-1)] focus:outline-none font-mono-numbers"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--text-primary)]">Time ({settings.admin_timezone}) *</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 neo-inset rounded-xl text-[var(--text-primary)] bg-[var(--surface-1)] focus:outline-none font-mono-numbers"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[var(--text-primary)]">Meeting URL (optional)</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/xyz-123"
                  value={newMeetingUrl}
                  onChange={(e) => setNewMeetingUrl(e.target.value)}
                  className="w-full px-3 py-2 neo-inset rounded-xl text-[var(--text-primary)] bg-[var(--surface-1)] focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 font-normal text-[var(--text-muted)] hover:text-[var(--text-primary)] neo-raised rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 font-semibold text-xs rounded-xl"
                >
                  Schedule meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
