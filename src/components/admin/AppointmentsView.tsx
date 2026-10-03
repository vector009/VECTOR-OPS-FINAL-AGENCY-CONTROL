import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Globe, 
  Check, 
  X, 
  ExternalLink, 
  Video 
} from 'lucide-react';
import { db } from '../../lib/database';
import { Appointment, MeetingProvider } from '../../types';
import { formatInTimezone } from '../../lib/timezone';
import { StatusBadge } from '../common/StatusBadge';

export const AppointmentsView: React.FC = () => {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isAttachLinkOpen, setIsAttachLinkOpen] = useState(false);
  const [meetingProvider, setMeetingProvider] = useState<MeetingProvider>('GOOGLE_MEET');
  const [meetingUrl, setMeetingUrl] = useState('');

  // Propose New Time Modal
  const [isProposeOpen, setIsProposeOpen] = useState(false);
  const [proposeDate, setProposeDate] = useState('');
  const [proposeTime, setProposeTime] = useState('18:30');
  const [proposeNote, setProposeNote] = useState("That time isn't available for me. Would this time work instead?");
  const [actionError, setActionError] = useState('');

  const appointments = db.getAppointments();
  const clients = db.getAllClientsIncludingArchived();
  const settings = db.getSettings();

  const filteredAppointments = appointments.filter(apt => {
    if (statusFilter !== 'ALL' && apt.status !== statusFilter) return false;
    return true;
  });

  const handleAcceptAppointment = async (apt: Appointment) => {
    setActionError('');
    const defaultUrl = apt.meeting_url || 'https://meet.google.com/vec-ops-vox';
    const result = await db.confirm_appointment(apt.id, 'GOOGLE_MEET', defaultUrl);
    if (!result.success) {
      setActionError(result.error || 'Failed to accept appointment.');
      return;
    }
    const updated = db.getAppointments().find(a => a.id === apt.id);
    setSelectedAppointment(updated || null);
  };

  const handleProposeNewTime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment || !proposeDate) return;
    setActionError('');

    const combinedIso = new Date(`${proposeDate}T${proposeTime}:00`).toISOString();
    const endIso = new Date(new Date(combinedIso).getTime() + 45 * 60 * 1000).toISOString();

    selectedAppointment.starts_at = combinedIso;
    selectedAppointment.ends_at = endIso;
    selectedAppointment.status = 'PROPOSED';
    setIsProposeOpen(false);
    const updated = db.getAppointments().find(a => a.id === selectedAppointment.id);
    setSelectedAppointment(updated || null);
  };

  const handleCancel = async (apt: Appointment) => {
    await db.cancel_appointment(apt.id, 'Cancelled by agency administrator');
    const updated = db.getAppointments().find(a => a.id === apt.id);
    setSelectedAppointment(updated || null);
  };

  const handleSaveMeetingLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment || !meetingUrl.trim()) return;

    if (!meetingUrl.startsWith('http://') && !meetingUrl.startsWith('https://')) {
      setActionError('Meeting URL must begin with https://');
      return;
    }

    await db.confirm_appointment(selectedAppointment.id, meetingProvider, meetingUrl.trim());
    setIsAttachLinkOpen(false);
    const updated = db.getAppointments().find(a => a.id === selectedAppointment.id);
    setSelectedAppointment(updated || null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#EDEAE2]">Appointments</h1>
          <p className="text-xs text-[#8B8D93] mt-1">
            Database-enforced double-booking prevention with canonical UTC and local timezone conversion
          </p>
        </div>

        {/* Agency Timezone Notice */}
        <div className="flex items-center gap-2 p-2 rounded-xl neo-flat bg-[#1D1F23] text-xs">
          <Globe className="w-3.5 h-3.5 text-[#E2896A]" />
          <span className="text-[#8B8D93]">Agency timezone:</span>
          <span className="text-[#EDEAE2] font-semibold">{settings.admin_timezone}</span>
        </div>
      </div>

      {/* Filters and View Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-[#1D1F23] rounded-xl overflow-x-auto text-xs">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'REQUESTED', label: 'Requested' },
            { id: 'PROPOSED', label: 'Proposed' },
            { id: 'CONFIRMED', label: 'Confirmed' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'CANCELLED', label: 'Cancelled' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                statusFilter === st.id
                  ? 'neo-inset text-[#EDEAE2] font-semibold'
                  : 'text-[#8B8D93] hover:text-[#EDEAE2]'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* View Mode */}
        <div className="flex items-center gap-1 p-1 bg-[#1D1F23] rounded-xl text-xs">
          {(['day', 'week', 'month'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                viewMode === mode
                  ? 'neo-inset text-[#EDEAE2] font-semibold'
                  : 'text-[#8B8D93] hover:text-[#EDEAE2]'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {actionError && (
        <div className="p-3 rounded-xl text-xs text-[#E2604F] neo-inset">
          {actionError}
        </div>
      )}

      {/* Appointments List & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Scheduled Appointments — Flat list rows */}
        <div className="lg:col-span-7 space-y-3">
          {filteredAppointments.length === 0 ? (
            <div className="neo-flat bg-[#1D1F23] p-10 text-center rounded-xl text-[#8B8D93] text-xs">
              No appointments matching this filter.
            </div>
          ) : (
            filteredAppointments.map((apt) => {
              const client = clients.find(c => c.id === apt.client_id);
              const isSelected = selectedAppointment?.id === apt.id;

              return (
                <div
                  key={apt.id}
                  onClick={() => {
                    setSelectedAppointment(apt);
                    setActionError('');
                  }}
                  className={`p-5 rounded-[16px] cursor-pointer transition-all ${
                    isSelected
                      ? 'neo-raised bg-[#1D1F23] ring-1 ring-[#E2896A]/40'
                      : 'neo-raised bg-[#1D1F23] hover:translate-y-[-1px]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#EDEAE2]">{client?.company_name}</span>
                        <StatusBadge status={apt.status} type="appointment" />
                      </div>
                      <div className="text-xs text-[#EDEAE2]">
                        {apt.topic || 'General Strategy Review'}
                      </div>
                    </div>

                    <div className="text-right space-y-0.5 shrink-0">
                      <div className="text-xs font-semibold text-[#EDEAE2] font-mono-numbers">
                        {formatInTimezone(apt.starts_at, settings.admin_timezone, 'datetime')}
                      </div>
                      <div className="text-[11px] text-[#8B8D93]">
                        {client ? `${formatInTimezone(apt.starts_at, client.timezone, 'time')} (${client.timezone})` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Appointment Operations Console — Raised detail console */}
        <div className="lg:col-span-5">
          {selectedAppointment ? (
            <div className="neo-raised p-6 rounded-2xl space-y-5 sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-[#E2896A]" />
                  <h3 className="text-sm font-semibold text-[#EDEAE2]">Meeting details</h3>
                </div>
                <StatusBadge status={selectedAppointment.status} type="appointment" />
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[#8B8D93] block mb-0.5">Topic / agenda:</span>
                  <span className="text-[#EDEAE2] font-semibold text-sm">{selectedAppointment.topic || 'General strategy'}</span>
                </div>

                {/* Canonical UTC Timestamp */}
                <div className="p-3 rounded-xl neo-inset space-y-1 font-mono-numbers text-[11px]">
                  <div className="text-[#8B8D93]">Canonical database timestamp:</div>
                  <div className="text-[#EDEAE2] font-semibold">{selectedAppointment.starts_at} (UTC)</div>
                </div>

                {/* Meeting Link Section */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8B8D93]">Meeting link:</span>
                    <button
                      onClick={() => {
                        setMeetingUrl(selectedAppointment.meeting_url || '');
                        setIsAttachLinkOpen(true);
                      }}
                      className="text-[#E2896A] hover:underline text-xs"
                    >
                      {selectedAppointment.meeting_url ? 'Change link' : 'Attach meeting link'}
                    </button>
                  </div>

                  {selectedAppointment.meeting_url ? (
                    <a
                      href={selectedAppointment.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl neo-inset text-[#4CAF7D] font-semibold flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Video className="w-4 h-4" />
                        <span>Join {selectedAppointment.meeting_provider || 'meeting'}</span>
                      </span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <div className="text-xs text-[#8B8D93]">
                      No URL attached yet. (Client will see join link once confirmed).
                    </div>
                  )}
                </div>

                {/* State Machine Action Controls */}
                <div className="pt-3 border-t border-white/5 space-y-2">
                  <span className="text-xs text-[#8B8D93] block">
                    Available actions:
                  </span>

                  {selectedAppointment.status === 'REQUESTED' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleAcceptAppointment(selectedAppointment)}
                        className="btn-primary bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-400/30 text-xs py-2 px-3 shadow-md shadow-emerald-600/20"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept & confirm</span>
                      </button>

                      <button
                        onClick={() => {
                          const today = new Date().toISOString().split('T')[0];
                          setProposeDate(today);
                          setIsProposeOpen(true);
                        }}
                        className="btn-secondary text-xs py-2 px-3"
                      >
                        Propose other time
                      </button>
                    </div>
                  )}

                  {selectedAppointment.status === 'CONFIRMED' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => db.complete_appointment(selectedAppointment.id)}
                        className="btn-secondary text-xs py-2 px-3"
                      >
                        Mark complete
                      </button>
                      <button
                        onClick={() => handleCancel(selectedAppointment)}
                        className="btn-danger text-xs py-2 px-3"
                      >
                        Cancel meeting
                      </button>
                    </div>
                  )}

                  {selectedAppointment.status === 'PROPOSED' && (
                    <div className="text-xs text-[#E0A94C] p-2.5 rounded-xl neo-inset">
                      Waiting for client confirmation on proposed rescheduled time.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="neo-raised bg-[#1D1F23] p-10 rounded-[16px] text-center text-[#8B8D93] text-xs">
              Select an appointment to inspect details and meeting links.
            </div>
          )}
        </div>
      </div>

      {/* Propose New Time Modal */}
      {isProposeOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#1D1F23] neo-modal rounded-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-[#17181B] flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#EDEAE2]">Propose other meeting time</h2>
              <button onClick={() => setIsProposeOpen(false)} className="p-1 text-[#8B8D93] hover:text-[#EDEAE2]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProposeNewTime} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#EDEAE2]">Date *</label>
                  <input
                    type="date"
                    value={proposeDate}
                    onChange={(e) => setProposeDate(e.target.value)}
                    className="w-full px-3 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none font-mono-numbers"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#EDEAE2]">Time (Agency IST) *</label>
                  <input
                    type="time"
                    value={proposeTime}
                    onChange={(e) => setProposeTime(e.target.value)}
                    className="w-full px-3 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none font-mono-numbers"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#EDEAE2]">Note to client</label>
                <textarea
                  rows={2}
                  value={proposeNote}
                  onChange={(e) => setProposeNote(e.target.value)}
                  className="w-full px-3 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsProposeOpen(false)}
                  className="px-4 py-2 text-xs font-normal text-[#8B8D93] hover:text-[#EDEAE2] neo-raised rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-[#17181B] bg-[#E2896A] hover:bg-[#EA9679] rounded-lg transition-colors"
                >
                  Transmit proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attach Meeting Link Modal */}
      {isAttachLinkOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#1D1F23] neo-modal rounded-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-[#17181B] flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#EDEAE2]">Attach meeting provider link</h2>
              <button onClick={() => setIsAttachLinkOpen(false)} className="p-1 text-[#8B8D93] hover:text-[#EDEAE2]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMeetingLink} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#EDEAE2]">Meeting provider</label>
                <select
                  value={meetingProvider}
                  onChange={(e) => setMeetingProvider(e.target.value as any)}
                  className="w-full px-3 py-2 neo-inset rounded-xl text-[#EDEAE2] focus:outline-none"
                >
                  <option value="Google Meet">Google Meet</option>
                  <option value="Zoom">Zoom</option>
                  <option value="Microsoft Teams">Microsoft Teams</option>
                  <option value="Custom">Custom dial-in / URL</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#EDEAE2]">Meeting URL *</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  className="w-full px-3 py-2 neo-inset rounded-xl text-[#EDEAE2] placeholder-[#8B8D93] focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAttachLinkOpen(false)}
                  className="px-4 py-2 text-xs font-normal text-[#8B8D93] hover:text-[#EDEAE2] neo-raised rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-[#17181B] bg-[#4CAF7D] hover:bg-[#52BD86] rounded-lg transition-colors"
                >
                  Save meeting link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
