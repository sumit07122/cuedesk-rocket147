import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Mail, 
  Phone, 
  History,
  Edit,
  Trash2,
  Download
} from 'lucide-react';
import { EmployeeUser, UserRole } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { exportEmployeesToExcel } from '../../utils/excelExport';

interface EmployeeManagementViewProps {
  employees: EmployeeUser[];
  onSaveEmployee: (employee: Partial<EmployeeUser>) => Promise<string>;
  onDeleteEmployee: (employeeId: string) => Promise<void>;
  clubName?: string;
}

export const EmployeeManagementView: React.FC<EmployeeManagementViewProps> = ({
  employees,
  onSaveEmployee,
  onDeleteEmployee,
  clubName = 'One Shot Snooker Gaming Club',
}) => {
  const { role: currentUserRole, user, createStaffInvitation } = useAuth();
  const [activeTab] = useState<'employees'>('employees');

  // Employee Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Partial<EmployeeUser> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedInviteCode, setGeneratedInviteCode] = useState<{ name: string; code: string; role: string } | null>(null);

  // Login History Modal State
  const [historyEmp, setHistoryEmp] = useState<EmployeeUser | null>(null);


  const handleOpenAddModal = () => {
    setEditingEmp({
      name: '',
      email: '',
      phone: '',
      role: 'manager',
      status: 'active',
      joiningDate: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: EmployeeUser) => {
    setEditingEmp({ ...emp });
    setIsModalOpen(true);
  };

  const handleSaveEmp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp || !editingEmp.name || !editingEmp.email) return;

    try {
      setIsSaving(true);
      const isNew = !editingEmp.id;
      await onSaveEmployee(editingEmp);

      // Create Firebase invitation for new staff
      if (isNew && createStaffInvitation) {
        try {
          const inv = await createStaffInvitation(
            editingEmp.email, 
            editingEmp.name, 
            editingEmp.phone || '', 
            editingEmp.role || 'worker'
          );
          setGeneratedInviteCode({ name: editingEmp.name, code: inv.code, role: inv.role });
        } catch (invErr) {
          console.warn('Invitation record note:', invErr);
        }
      }

      setIsModalOpen(false);
      setEditingEmp(null);
    } catch (err) {
      alert('Failed to save employee profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEmp = async (empId: string, empName: string) => {
    if (confirm(`Are you sure you want to remove staff member "${empName}"?`)) {
      await onDeleteEmployee(empId);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-neutral-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-neutral-900" />
            <h2 className="text-xl font-extrabold text-neutral-900 tracking-tight">Staff Accounts & Permissions</h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Invite trusted staff, set their access level, and manage club accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => exportEmployeesToExcel(employees, clubName)}
            leftIcon={<Download className="w-4 h-4" />}
            size="sm"
          >
            Export Roster
          </Button>
          <Button
            variant="primary"
            onClick={handleOpenAddModal}
            leftIcon={<UserPlus className="w-4 h-4" />}
            size="sm"
          >
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* TAB 1: EMPLOYEES DIRECTORY */}
      {activeTab === 'employees' && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Total Staff</span>
                <div className="text-xl font-black text-neutral-900">{employees.length}</div>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Active Employees</span>
                <div className="text-xl font-black text-neutral-900">
                  {employees.filter(e => e.status === 'active').length}
                </div>
              </div>
            </Card>

            <Card className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Currently On Duty</span>
                <div className="text-xl font-black text-neutral-900">{employees.filter((e) => e.role === 'manager' || e.role === 'owner').length}</div>
              </div>
            </Card>
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200/80 text-neutral-500 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Contact Details</th>
                    <th className="py-3.5 px-4">Access Role</th>
                    <th className="py-3.5 px-4">Joining Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Last Login</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-neutral-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-bold flex items-center justify-center shrink-0">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-neutral-900">{emp.name}</div>
                            <div className="text-[10px] text-neutral-400 font-mono">ID: {emp.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-neutral-400" />
                          <span>{emp.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-neutral-400 mt-0.5">
                          <Phone className="w-3 h-3 text-neutral-400" />
                          <span>{emp.phone}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            emp.role === 'owner' ? 'amber' : emp.role === 'manager' ? 'emerald' : 'blue'
                          }
                        >
                          {emp.role.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-600 font-medium">
                        {emp.joiningDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            emp.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-neutral-100 text-neutral-500'
                          }`}
                        >
                          {emp.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {emp.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-500 font-mono text-[11px]">
                        {emp.lastActiveTime
                          ? new Date(emp.lastActiveTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Recent'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setHistoryEmp(emp)}
                            className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
                            title="View Login Audit Trail"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(emp)}
                            className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
                            title="Edit Role & Details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {emp.role !== 'owner' && (
                            <button
                              onClick={() => handleDeleteEmp(emp.id, emp.name)}
                              className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-neutral-100 transition-colors"
                              title="Delete Employee"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {isModalOpen && editingEmp && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
              <h3 className="text-base font-extrabold text-neutral-900">
                {editingEmp.id ? 'Edit Staff Member Profile' : 'Create Staff Member Account'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleSaveEmp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Full Name *</label>
                <Input
                  required
                  value={editingEmp.name || ''}
                  onChange={(e) => setEditingEmp({ ...editingEmp, name: e.target.value })}
                  placeholder="e.g. Sarah Miller"
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Email Address *</label>
                  <Input
                    required
                    type="email"
                    value={editingEmp.email || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, email: e.target.value })}
                    placeholder="staff@cuedesk.com"
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Phone Number *</label>
                  <Input
                    required
                    value={editingEmp.phone || ''}
                    onChange={(e) => setEditingEmp({ ...editingEmp, phone: e.target.value })}
                    placeholder="+91 98765 00000"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Access Role *</label>
                  <select
                    value={editingEmp.role || 'manager'}
                    onChange={(e) => setEditingEmp({ ...editingEmp, role: e.target.value as UserRole })}
                    className="w-full bg-neutral-50 border border-neutral-200 text-xs font-semibold rounded-xl p-2.5 outline-none"
                  >
                    <option value="owner">Owner (Full System Control & Settings)</option>
                    <option value="manager">Manager (Operations, POS, Cafe & Reports)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Account Status</label>
                  <select
                    value={editingEmp.status || 'active'}
                    onChange={(e) => setEditingEmp({ ...editingEmp, status: e.target.value as any })}
                    className="w-full bg-neutral-50 border border-neutral-200 text-xs font-semibold rounded-xl p-2.5 outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive / Suspended</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Staff Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Login History Modal */}
      {historyEmp && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-3">
              <div>
                <h3 className="text-sm font-extrabold text-neutral-900">Login Trail: {historyEmp.name}</h3>
                <span className="text-[10px] text-neutral-400 font-mono">{historyEmp.email}</span>
              </div>
              <button onClick={() => setHistoryEmp(null)} className="text-neutral-400 font-bold text-lg">×</button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {(!historyEmp.loginHistory || historyEmp.loginHistory.length === 0) ? (
                <p className="text-xs text-neutral-400 py-4 text-center">No login events recorded yet.</p>
              ) : (
                historyEmp.loginHistory.map((lh, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-neutral-200/80 bg-neutral-50 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-neutral-900">{lh.deviceInfo || 'Web App Terminal'}</div>
                      <div className="text-[10px] text-neutral-400">{new Date(lh.timestamp).toLocaleString()}</div>
                    </div>
                    <Badge variant="emerald">Success</Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* Generated Staff Invitation Code Modal */}
      {generatedInviteCode && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-neutral-900">Staff Invitation Created</h3>
            <p className="text-xs text-neutral-500 mt-1 mb-4">
              Share this invitation code with <span className="font-bold text-neutral-900">{generatedInviteCode.name}</span> so they can complete registration as <span className="font-bold capitalize">{generatedInviteCode.role}</span>.
            </p>

            <div className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-4 mb-4 flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-neutral-400">Invitation Code</span>
              <span className="text-2xl font-black font-mono tracking-wider text-neutral-900 select-all my-1">
                {generatedInviteCode.code}
              </span>
            </div>

            <Button
              variant="primary"
              className="w-full justify-center bg-neutral-900 text-white"
              onClick={() => setGeneratedInviteCode(null)}
            >
              Done & Copy Code
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
