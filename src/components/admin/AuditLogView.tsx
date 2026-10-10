import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Lock, 
  Clock, 
  FileText, 
  User, 
  Calendar 
} from 'lucide-react';
import { db } from '../../lib/database';
import { AuditLog } from '../../types';

export const AuditLogView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');

  const auditLogs = db.getAuditLogs();

  const filteredLogs = auditLogs.filter(log => {
    const details = (log.details || '').toLowerCase();
    const actor = (log.actor_name || '').toLowerCase();
    const action = (log.action || '').toLowerCase();
    const entityId = (log.entity_id || '').toLowerCase();
    const term = searchTerm.toLowerCase();

    const matchesSearch = 
      details.includes(term) ||
      actor.includes(term) ||
      action.includes(term) ||
      entityId.includes(term);

    const matchesEntity = entityFilter === 'ALL' || log.entity_type === entityFilter;

    return matchesSearch && matchesEntity;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#EDEAE2]">Audit ledger</h1>
          <p className="text-xs text-[#8B8D93] mt-1">
            Permanent audit trail for all financial and governance mutations
          </p>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-xl neo-flat bg-[#1D1F23] text-xs text-[#4CAF7D]">
          <Lock className="w-3.5 h-3.5" />
          <span>Read-only invariant enforced</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[#8B8D93] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by action, actor, ID, or detail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs neo-inset rounded-xl text-[#EDEAE2] placeholder-[#8B8D93] focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#1D1F23] rounded-xl overflow-x-auto text-xs">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'PAYMENT', label: 'Payment' },
            { id: 'INVOICE', label: 'Invoice' },
            { id: 'APPOINTMENT', label: 'Appointment' },
            { id: 'CLIENT', label: 'Client' },
            { id: 'SUBSCRIPTION', label: 'Subscription' },
          ].map((et) => (
            <button
              key={et.id}
              onClick={() => setEntityFilter(et.id)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                entityFilter === et.id
                  ? 'neo-inset text-[#EDEAE2] font-semibold'
                  : 'text-[#8B8D93] hover:text-[#EDEAE2]'
              }`}
            >
              {et.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table — Raised Neumorphic Container */}
      <div className="neo-raised bg-[#1D1F23] rounded-[16px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#17181B] text-[#8B8D93] font-normal">
              <tr>
                <th className="py-3 px-4 font-normal">Timestamp (UTC)</th>
                <th className="py-3 px-4 font-normal">Action</th>
                <th className="py-3 px-4 font-normal">Entity type</th>
                <th className="py-3 px-4 font-normal">Entity ID</th>
                <th className="py-3 px-4 font-normal">Actor</th>
                <th className="py-3 px-4 font-normal">Audit details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#8B8D93]">
                    No audit records matching query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-mono-numbers text-[11px] text-[#8B8D93] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-xs whitespace-nowrap">
                      <span className="text-[#00C6FF] font-mono">{log.action.replace(/_/g, ' ').toLowerCase()}</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#8B8D93] text-xs">
                      {log.entity_type.toLowerCase()}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#EDEAE2]">
                      {log.entity_id}
                    </td>
                    <td className="py-3.5 px-4 text-[#EDEAE2] whitespace-nowrap">
                      {log.actor_name} <span className="text-[#8B8D93] text-[11px]">({log.actor_role ? log.actor_role.toLowerCase() : 'system'})</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#EDEAE2] leading-relaxed">
                      {log.details}
                      {log.old_value && (
                        <div className="text-[11px] text-[#8B8D93] mt-0.5 font-mono">
                          Transition: <span className="line-through">{JSON.stringify(log.old_value)}</span> → <span className="text-[#4CAF7D]">{JSON.stringify(log.new_value)}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
