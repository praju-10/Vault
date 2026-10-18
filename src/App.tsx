import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, 
  TrendingUp, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Trash2, 
  Edit3, 
  Calendar, 
  Building2, 
  Percent, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  FileSpreadsheet, 
  PieChart, 
  ArrowUpRight, 
  Database, 
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';

// --- INDIAN NUMBER FORMATTING UTILITY ---
const formatINR = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? '₹0' : '0';
  }
  const numericAmount = Math.round(Number(amount));
  const isNegative = numericAmount < 0;
  const absValStr = Math.abs(numericAmount).toString();
  
  let lastThree = absValStr.substring(absValStr.length - 3);
  const otherNumbers = absValStr.substring(0, absValStr.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
  const result = (isNegative ? '-' : '') + (showSymbol ? '₹' : '') + formatted;
  return result;
};

// Date utilities
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const getDaysRemaining = (maturityDateStr) => {
  if (!maturityDateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maturity = new Date(maturityDateStr);
  maturity.setHours(0, 0, 0, 0);
  const diffTime = maturity - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// --- INITIAL SAMPLE DATA (Can be toggled by user) ---
const INITIAL_FD_DATA = [
  {
    id: 'fd-1',
    srNo: '01',
    bankName: 'State Bank of India',
    fdNumber: 'FD-SBI-89210',
    rateOfInterest: 7.10,
    openingDate: '2025-01-15',
    maturityDate: '2027-01-15',
    amountInvested: 250000,
    maturityAmount: 287250,
    status: 'Active'
  },
  {
    id: 'fd-2',
    srNo: '02',
    bankName: 'HDFC Bank',
    fdNumber: 'FD-HDFC-33412',
    rateOfInterest: 7.25,
    openingDate: '2024-11-10',
    maturityDate: '2026-11-10',
    amountInvested: 500000,
    maturityAmount: 576000,
    status: 'Active'
  },
  {
    id: 'fd-3',
    srNo: '03',
    bankName: 'ICICI Bank',
    fdNumber: 'FD-ICICI-99201',
    rateOfInterest: 7.00,
    openingDate: '2025-06-01',
    maturityDate: '2026-12-01',
    amountInvested: 150000,
    maturityAmount: 166200,
    status: 'Active'
  }
];

const INITIAL_RD_DATA = [
  {
    id: 'rd-1',
    srNo: '01',
    bankName: 'HDFC Bank',
    rdNumber: 'RD-HDFC-0012',
    installmentDate: '2026-11-05',
    installmentAmount: 10000,
    rateOfInterest: 7.10,
    openingDate: '2025-01-05',
    maturityDate: '2027-01-05',
    paidInstallments: 22,
    totalInstallments: 24,
    maturityAmount: 258500,
    status: 'Active'
  },
  {
    id: 'rd-2',
    srNo: '02',
    bankName: 'Axis Bank',
    rdNumber: 'RD-AXIS-8831',
    installmentDate: '2026-11-15',
    installmentAmount: 5000,
    rateOfInterest: 6.90,
    openingDate: '2025-05-15',
    maturityDate: '2026-11-15',
    paidInstallments: 18,
    totalInstallments: 18,
    maturityAmount: 95200,
    status: 'Active'
  }
];

export default function App() {
  // Navigation tab state
  const [activeTab, setActiveTab] = useState('overview');

  // Core records state with LocalStorage persistence
  const [fds, setFds] = useState(() => {
    try {
      const saved = localStorage.getItem('vault_fd_records');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [rds, setRds] = useState(() => {
    try {
      const saved = localStorage.getItem('vault_rd_records');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI Filters & Search
  const [fdSearch, setFdSearch] = useState('');
  const [fdBankFilter, setFdBankFilter] = useState('ALL');
  const [fdStatusFilter, setFdStatusFilter] = useState('ALL');
  const [fdSort, setFdSort] = useState('maturityDate');

  const [rdSearch, setRdSearch] = useState('');
  const [rdBankFilter, setRdBankFilter] = useState('ALL');

  // Modals state
  const [isFdModalOpen, setIsFdModalOpen] = useState(false);
  const [editingFd, setEditingFd] = useState(null);

  const [isRdModalOpen, setIsRdModalOpen] = useState(false);
  const [editingRd, setEditingRd] = useState(null);

  const [viewingRdDetails, setViewingRdDetails] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { type: 'FD'|'RD', id: string, name: string }
  const [toast, setToast] = useState(null);

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('vault_fd_records', JSON.stringify(fds));
    } catch (e) {
      console.error('Failed to save FDs:', e);
    }
  }, [fds]);

  useEffect(() => {
    try {
      localStorage.setItem('vault_rd_records', JSON.stringify(rds));
    } catch (e) {
      console.error('Failed to save RDs:', e);
    }
  }, [rds]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- SAMPLE DATA HANDLING ---
  const handleLoadSampleData = () => {
    setFds(INITIAL_FD_DATA);
    setRds(INITIAL_RD_DATA);
    showToast('Sample savings records loaded!');
  };

  const handleClearAllData = () => {
    setFds([]);
    setRds([]);
    localStorage.removeItem('vault_fd_records');
    localStorage.removeItem('vault_rd_records');
    showToast('All stored savings data cleared', 'info');
  };

  // --- COMPUTED DASHBOARD METRICS ---
  const activeFds = useMemo(() => fds.filter(f => f.status === 'Active' || !f.status), [fds]);
  const activeRds = useMemo(() => rds.filter(r => r.status === 'Active' || !r.status), [rds]);

  const totalFdPrincipal = useMemo(() => {
    return activeFds.reduce((sum, f) => sum + (Number(f.amountInvested) || 0), 0);
  }, [activeFds]);

  const totalRdContributions = useMemo(() => {
    return activeRds.reduce((sum, r) => {
      const inst = Number(r.installmentAmount) || 0;
      const paid = Number(r.paidInstallments) || 0;
      return sum + (inst * paid);
    }, 0);
  }, [activeRds]);

  const totalInvestment = totalFdPrincipal + totalRdContributions;

  const totalFdMaturity = useMemo(() => {
    return activeFds.reduce((sum, f) => sum + (Number(f.maturityAmount) || 0), 0);
  }, [activeFds]);

  const totalRdMaturity = useMemo(() => {
    return activeRds.reduce((sum, r) => sum + (Number(r.maturityAmount) || 0), 0);
  }, [activeRds]);

  const totalMaturityAmount = totalFdMaturity + totalRdMaturity;

  const totalExpectedGain = totalMaturityAmount - totalInvestment;

  // Upcoming FD Maturities logic
  const upcomingFds = useMemo(() => {
    return activeFds.map(fd => {
      const days = getDaysRemaining(fd.maturityDate);
      return { ...fd, daysRemaining: days };
    })
    .filter(fd => fd.daysRemaining !== null && fd.daysRemaining <= 90)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [activeFds]);

  const fdsMaturing30Days = useMemo(() => upcomingFds.filter(f => f.daysRemaining <= 30 && f.daysRemaining >= 0).length, [upcomingFds]);
  const fdsMaturing90Days = useMemo(() => upcomingFds.filter(f => f.daysRemaining <= 90 && f.daysRemaining >= 0).length, [upcomingFds]);

  // --- LIST OF UNIQUE BANKS FOR FILTERS ---
  const uniqueFdBanks = useMemo(() => {
    const banks = new Set(fds.map(f => f.bankName).filter(Boolean));
    return ['ALL', ...Array.from(banks)];
  }, [fds]);

  const uniqueRdBanks = useMemo(() => {
    const banks = new Set(rds.map(r => r.bankName).filter(Boolean));
    return ['ALL', ...Array.from(banks)];
  }, [rds]);

  // --- FILTERED AND SORTED TABLES ---
  const processedFds = useMemo(() => {
    return fds.filter(fd => {
      const matchesSearch = (fd.bankName || '').toLowerCase().includes(fdSearch.toLowerCase()) ||
                            (fd.fdNumber || '').toLowerCase().includes(fdSearch.toLowerCase());
      const matchesBank = fdBankFilter === 'ALL' || fd.bankName === fdBankFilter;
      const matchesStatus = fdStatusFilter === 'ALL' || (fd.status || 'Active') === fdStatusFilter;
      return matchesSearch && matchesBank && matchesStatus;
    }).sort((a, b) => {
      if (fdSort === 'maturityDate') return new Date(a.maturityDate || '') - new Date(b.maturityDate || '');
      if (fdSort === 'amountInvested') return (b.amountInvested || 0) - (a.amountInvested || 0);
      if (fdSort === 'rateOfInterest') return (b.rateOfInterest || 0) - (a.rateOfInterest || 0);
      return 0;
    });
  }, [fds, fdSearch, fdBankFilter, fdStatusFilter, fdSort]);

  const processedRds = useMemo(() => {
    return rds.filter(rd => {
      const matchesSearch = (rd.bankName || '').toLowerCase().includes(rdSearch.toLowerCase()) ||
                            (rd.rdNumber || '').toLowerCase().includes(rdSearch.toLowerCase());
      const matchesBank = rdBankFilter === 'ALL' || rd.bankName === rdBankFilter;
      return matchesSearch && matchesBank;
    });
  }, [rds, rdSearch, rdBankFilter]);

  // --- FD CRUD OPS ---
  const handleSaveFd = (formData) => {
    const invested = Number(formData.amountInvested) || 0;
    const maturity = Number(formData.maturityAmount) || 0;
    
    if (editingFd) {
      setFds(prev => prev.map(item => item.id === editingFd.id ? { ...formData, id: editingFd.id } : item));
      showToast('Fixed Deposit updated successfully');
    } else {
      const nextNum = (fds.length + 1).toString().padStart(2, '0');
      const newRecord = {
        ...formData,
        id: `fd-${Date.now()}`,
        srNo: nextNum,
        status: formData.status || 'Active'
      };
      setFds(prev => [...prev, newRecord]);
      showToast('New Fixed Deposit added');
    }
    setIsFdModalOpen(false);
    setEditingFd(null);
  };

  const handleDeleteFd = (id) => {
    setFds(prev => prev.filter(item => item.id !== id));
    setConfirmDelete(null);
    showToast('FD record removed', 'info');
  };

  // --- RD CRUD OPS ---
  const handleSaveRd = (formData) => {
    if (editingRd) {
      setRds(prev => prev.map(item => item.id === editingRd.id ? { ...formData, id: editingRd.id } : item));
      showToast('Recurring Deposit updated');
    } else {
      const nextNum = (rds.length + 1).toString().padStart(2, '0');
      const newRecord = {
        ...formData,
        id: `rd-${Date.now()}`,
        srNo: nextNum,
        status: formData.status || 'Active'
      };
      setRds(prev => [...prev, newRecord]);
      showToast('New Recurring Deposit added');
    }
    setIsRdModalOpen(false);
    setEditingRd(null);
  };

  const handleDeleteRd = (id) => {
    setRds(prev => prev.filter(item => item.id !== id));
    setConfirmDelete(null);
    showToast('RD record removed', 'info');
  };

  // --- EXPORT & IMPORT DATA ---
  const exportToCSV = (data, filename, columns) => {
    if (!data || !data.length) {
      showToast('No records available to export', 'error');
      return;
    }
    const header = columns.map(c => `"${c.label}"`).join(',');
    const rows = data.map(row => {
      return columns.map(c => {
        let val = row[c.key];
        if (c.formatter) val = c.formatter(val, row);
        return `"${(val || '').toString().replace(/"/g, '""')}"`;
      }).join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`${filename}.csv downloaded`);
  };

  const exportFullBackupJSON = () => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      fixedDeposits: fds,
      recurringDeposits: rds
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Vault_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Full portfolio backup downloaded');
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.fixedDeposits && Array.isArray(parsed.fixedDeposits)) {
          setFds(parsed.fixedDeposits);
        }
        if (parsed.recurringDeposits && Array.isArray(parsed.recurringDeposits)) {
          setRds(parsed.recurringDeposits);
        }
        showToast('Backup restored successfully!');
      } catch (err) {
        showToast('Invalid JSON backup file structure', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Build initial empty rows if items are fewer than requested initial slots
  const renderFdRows = () => {
    const minRows = 0;
    const rows = [...processedFds];
    const totalCount = Math.max(minRows, rows.length);

    const fullList = [];
    for (let i = 0; i < totalCount; i++) {
      const record = rows[i];
      const rowSrNo = (i + 1).toString().padStart(2, '0');

      if (record) {
        const gain = (Number(record.maturityAmount) || 0) - (Number(record.amountInvested) || 0);
        fullList.push(
          <tr key={record.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 text-sm">
            <td className="py-3 px-4 text-slate-500 font-mono text-xs">{rowSrNo}</td>
            <td className="py-3 px-4 font-medium text-slate-900">{record.bankName}</td>
            <td className="py-3 px-4 text-slate-600 font-mono text-xs">{record.fdNumber || '-'}</td>
            <td className="py-3 px-4 text-slate-700 font-semibold">{record.rateOfInterest}%</td>
            <td className="py-3 px-4 text-slate-600">{formatDate(record.openingDate)}</td>
            <td className="py-3 px-4 text-slate-600 font-medium">{formatDate(record.maturityDate)}</td>
            <td className="py-3 px-4 text-right font-medium text-slate-900">{formatINR(record.amountInvested)}</td>
            <td className="py-3 px-4 text-right font-semibold text-emerald-800">{formatINR(record.maturityAmount)}</td>
            <td className={`py-3 px-4 text-right font-semibold ${gain >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatINR(gain)}
            </td>
            <td className="py-3 px-4 text-center">
              <div className="flex items-center justify-center space-x-2">
                <button 
                  onClick={() => { setEditingFd(record); setIsFdModalOpen(true); }} 
                  className="p-1 text-slate-400 hover:text-emerald-700 transition-colors"
                  title="Edit FD"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setConfirmDelete({ type: 'FD', id: record.id, name: `${record.bankName} (${record.fdNumber || 'FD'})` })} 
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Delete FD"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        );
      } else {
        // Subtle empty placeholder slot
        fullList.push(
          <tr key={`empty-fd-${i}`} className="border-b border-slate-100/60 text-xs text-slate-300">
            <td className="py-3 px-4 font-mono">{rowSrNo}</td>
            <td className="py-3 px-4 italic text-slate-300">Empty slot</td>
            <td className="py-3 px-4 font-mono">-</td>
            <td className="py-3 px-4">-</td>
            <td className="py-3 px-4">-</td>
            <td className="py-3 px-4">-</td>
            <td className="py-3 px-4 text-right">-</td>
            <td className="py-3 px-4 text-right">-</td>
            <td className="py-3 px-4 text-right">-</td>
            <td className="py-3 px-4 text-center">-</td>
          </tr>
        );
      }
    }
    if (fullList.length === 0) {
      fullList.push(
        <tr key="empty-state">
          <td colSpan={10} className="py-10 px-4 text-center text-sm text-slate-400">No fixed deposits yet. Use the Add FD button to add your first one.</td>
        </tr>
      );
    }
    return fullList;
  };

  const renderRdRows = () => {
    const minRows = 0;
    const rows = [...processedRds];
    const totalCount = Math.max(minRows, rows.length);

    const fullList = [];
    for (let i = 0; i < totalCount; i++) {
      const record = rows[i];
      const rowSrNo = (i + 1).toString().padStart(2, '0');

      if (record) {
        fullList.push(
          <tr key={record.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100 text-sm">
            <td className="py-3 px-4 text-slate-500 font-mono text-xs">{rowSrNo}</td>
            <td className="py-3 px-4 font-medium text-slate-900">{record.bankName}</td>
            <td className="py-3 px-4 text-slate-600 font-mono text-xs">{record.rdNumber || '-'}</td>
            <td className="py-3 px-4 text-slate-600 font-medium">{formatDate(record.installmentDate)}</td>
            <td className="py-3 px-4 text-right font-medium text-slate-900">{formatINR(record.installmentAmount)}</td>
            <td className="py-3 px-4 text-slate-700 font-semibold text-center">{record.rateOfInterest}%</td>
            <td className="py-3 px-4 text-center">
              <div className="flex items-center justify-center space-x-2">
                <button 
                  onClick={() => setViewingRdDetails(record)} 
                  className="px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-800 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  title="View full RD breakdown"
                >
                  View Details
                </button>
                <button 
                  onClick={() => { setEditingRd(record); setIsRdModalOpen(true); }} 
                  className="p-1 text-slate-400 hover:text-emerald-700 transition-colors"
                  title="Edit RD"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setConfirmDelete({ type: 'RD', id: record.id, name: `${record.bankName} (${record.rdNumber || 'RD'})` })} 
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Delete RD"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        );
      } else {
        fullList.push(
          <tr key={`empty-rd-${i}`} className="border-b border-slate-100/60 text-xs text-slate-300">
            <td className="py-3 px-4 font-mono">{rowSrNo}</td>
            <td className="py-3 px-4 italic text-slate-300">Empty RD slot</td>
            <td className="py-3 px-4 font-mono">-</td>
            <td className="py-3 px-4">-</td>
            <td className="py-3 px-4 text-right">-</td>
            <td className="py-3 px-4 text-center">-</td>
            <td className="py-3 px-4 text-center">-</td>
          </tr>
        );
      }
    }
    if (fullList.length === 0) {
      fullList.push(
        <tr key="empty-state">
          <td colSpan={7} className="py-10 px-4 text-center text-sm text-slate-400">No recurring deposits yet. Use the Add RD button to add your first one.</td>
        </tr>
      );
    }
    return fullList;
  };

  // Next RD installment calculation
  const nextRdInstallmentDate = useMemo(() => {
    if (!activeRds.length) return null;
    const dates = activeRds.map(r => r.installmentDate).filter(Boolean);
    if (!dates.length) return null;
    dates.sort((a, b) => new Date(a) - new Date(b));
    return dates[0];
  }, [activeRds]);

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#182230] font-sans antialiased flex flex-col">
      {/* Toast feedback */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-sm font-medium transition-all ${
          toast.type === 'error' ? 'bg-rose-900 text-white' : 
          toast.type === 'info' ? 'bg-slate-900 text-white' : 'bg-[#173E35] text-white'
        }`}>
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="bg-white border-b border-[#E7EBF2] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#173E35] flex items-center justify-center text-white shadow-md">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[#182230] flex items-center gap-2">
                  Vault <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-[#167D65]">SAVINGS</span>
                </h1>
                <p className="text-xs text-[#738094]">Personal Deposit & Wealth Dashboard</p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-2 text-xs font-medium text-[#738094]">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>

            <div className="flex items-center space-x-2">
              <button 
                onClick={() => { setEditingFd(null); setIsFdModalOpen(true); }}
                className="inline-flex items-center px-3 py-2 text-xs font-semibold rounded-lg bg-[#173E35] text-white hover:bg-[#167D65] transition-all shadow-sm gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> + Add FD
              </button>
              <button 
                onClick={() => { setEditingRd(null); setIsRdModalOpen(true); }}
                className="inline-flex items-center px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-50 text-[#167D65] border border-emerald-200 hover:bg-emerald-100 transition-all gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> + Add RD
              </button>
            </div>
          </div>
        </div>

        {/* NAVIGATION BAR */}
        <div className="bg-slate-50/80 border-t border-[#E7EBF2]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 scrollbar-none">
              {[
                { id: 'overview', label: 'Overview', icon: PieChart },
                { id: 'fds', label: 'Fixed Deposits', icon: Building2, count: activeFds.length },
                { id: 'rds', label: 'Recurring Deposits', icon: RefreshCw, count: activeRds.length },
                { id: 'maturities', label: 'Upcoming Maturities', icon: Clock, count: upcomingFds.length, badgeColor: upcomingFds.length ? 'bg-amber-100 text-amber-800' : null },
                { id: 'settings', label: 'Data Management', icon: Database }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                      isActive 
                        ? 'bg-white text-[#173E35] shadow-sm font-semibold border border-[#E7EBF2]' 
                        : 'text-[#738094] hover:text-[#182230] hover:bg-white/50'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#167D65]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                    {item.count !== undefined && (
                      <span className={`ml-1 px-1.5 py-0.2 text-[10px] rounded-full font-bold ${item.badgeColor || (isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600')}`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* TAB 1: OVERVIEW PAGE */}
        {(activeTab === 'overview' || activeTab === 'fds' || activeTab === 'rds') && (
          <section className="space-y-6">
            
            {/* HERO PROFILE SNAPSHOT BANNER */}
            <div className="bg-[#173E35] text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-[#167D65]/40">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-emerald-800/60">
                <div>
                  <h2 className="text-2xl font-bold mt-0.5">Savings Overview</h2>
                  <p className="text-xs text-emerald-200/80 mt-1">
                    Consolidated view of all active fixed deposits and recurring monthly installments.
                  </p>
                </div>
                
                <div className="flex items-center gap-2 self-start md:self-auto">
                  {fds.length === 0 && rds.length === 0 ? (
                    <button 
                      onClick={handleLoadSampleData}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 hover:bg-emerald-500/30 transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-300" /> Load Sample Data
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-300/90 bg-emerald-900/50 px-3 py-1 rounded-full border border-emerald-700/50">
                      Local Device Storage Active
                    </span>
                  )}
                </div>
              </div>

              {/* 4 PRIMARY SUMMARY CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                
                {/* CARD 1: TOTAL INVESTMENT */}
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 hover:bg-white/15 transition-all">
                  <div className="flex items-center justify-between text-xs text-emerald-200">
                    <span>Total Investment</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold mt-2 text-white font-mono tracking-tight">
                    {formatINR(totalInvestment)}
                  </div>
                  <div className="text-[11px] text-emerald-300/80 mt-1 flex justify-between">
                    <span>FDs: {formatINR(totalFdPrincipal)}</span>
                    <span>RDs: {formatINR(totalRdContributions)}</span>
                  </div>
                </div>

                {/* CARD 2: TOTAL EXPECTED MATURITY AMOUNT */}
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 hover:bg-white/15 transition-all">
                  <div className="flex items-center justify-between text-xs text-emerald-200">
                    <span>Total Maturity Amount</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold mt-2 text-white font-mono tracking-tight">
                    {formatINR(totalMaturityAmount)}
                  </div>
                  <div className="text-[11px] text-emerald-300/80 mt-1 flex items-center justify-between">
                    <span>Expected Gain:</span>
                    <span className="font-semibold text-emerald-300">+{formatINR(totalExpectedGain)}</span>
                  </div>
                </div>

                {/* CARD 3: ACTIVE FIXED DEPOSITS */}
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 hover:bg-white/15 transition-all">
                  <div className="flex items-center justify-between text-xs text-emerald-200">
                    <span>Active Fixed Deposits</span>
                    <Building2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold mt-2 text-white">
                    {activeFds.length} <span className="text-xs font-normal text-emerald-300">accounts</span>
                  </div>
                  <div className="text-[11px] text-emerald-300/80 mt-1">
                    Expected FD Value: {formatINR(totalFdMaturity)}
                  </div>
                </div>

                {/* CARD 4: ACTIVE RECURRING DEPOSITS */}
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 hover:bg-white/15 transition-all">
                  <div className="flex items-center justify-between text-xs text-emerald-200">
                    <span>Active Recurring Deposits</span>
                    <RefreshCw className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold mt-2 text-white">
                    {activeRds.length} <span className="text-xs font-normal text-emerald-300">accounts</span>
                  </div>
                  <div className="text-[11px] text-emerald-300/80 mt-1">
                    Expected RD Value: {formatINR(totalRdMaturity)}
                  </div>
                </div>

              </div>

              {/* SECONDARY DASHBOARD INDICATORS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-emerald-800/40 text-xs">
                <div>
                  <span className="text-emerald-300/70 block text-[10px]">Net Interest Gain</span>
                  <span className="font-semibold text-emerald-300">{formatINR(totalExpectedGain)}</span>
                </div>
                <div>
                  <span className="text-emerald-300/70 block text-[10px]">Maturing in 30 Days</span>
                  <span className="font-semibold text-amber-300">{fdsMaturing30Days} Deposits</span>
                </div>
                <div>
                  <span className="text-emerald-300/70 block text-[10px]">Maturing in 90 Days</span>
                  <span className="font-semibold text-white">{fdsMaturing90Days} Deposits</span>
                </div>
                <div>
                  <span className="text-emerald-300/70 block text-[10px]">Next RD Installment</span>
                  <span className="font-semibold text-white">{nextRdInstallmentDate ? formatDate(nextRdInstallmentDate) : 'None'}</span>
                </div>
              </div>

            </div>

          </section>
        )}

        {/* SECTION: FIXED DEPOSITS */}
        {(activeTab === 'overview' || activeTab === 'fds') && (
          <section className="bg-white rounded-2xl border border-[#E7EBF2] shadow-sm p-6 space-y-4">
            
            {/* SECTION CONTROLS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
              <div>
                <h3 className="text-lg font-bold text-[#182230] flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#167D65]" /> Fixed Deposit Portfolio
                </h3>
                <p className="text-xs text-[#738094]">
                  Manage all lump-sum term deposits across institutions ({fds.length} total recorded)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => exportToCSV(fds, 'Fixed_Deposits_Vault', [
                    { label: 'Sr No', key: 'srNo' },
                    { label: 'Bank Name', key: 'bankName' },
                    { label: 'FD Number', key: 'fdNumber' },
                    { label: 'Rate (%)', key: 'rateOfInterest' },
                    { label: 'Opening Date', key: 'openingDate' },
                    { label: 'Maturity Date', key: 'maturityDate' },
                    { label: 'Invested Amount', key: 'amountInvested' },
                    { label: 'Maturity Amount', key: 'maturityAmount' },
                    { label: 'Status', key: 'status' }
                  ])}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
                  title="Export FD records as CSV"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
                </button>
                <button 
                  onClick={() => { setEditingFd(null); setIsFdModalOpen(true); }}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#173E35] hover:bg-[#167D65] rounded-lg transition-all flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add FD
                </button>
              </div>
            </div>

            {/* SEARCH AND FILTERS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 text-xs">
              
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search bank or FD number..."
                  value={fdSearch}
                  onChange={(e) => setFdSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#167D65]/20 text-xs"
                />
              </div>

              {/* Bank Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 whitespace-nowrap">Bank:</span>
                <select 
                  value={fdBankFilter} 
                  onChange={(e) => setFdBankFilter(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-[#167D65]/20 text-xs"
                >
                  {uniqueFdBanks.map(b => (
                    <option key={b} value={b}>{b === 'ALL' ? 'All Banks' : b}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 whitespace-nowrap">Status:</span>
                <select 
                  value={fdStatusFilter} 
                  onChange={(e) => setFdStatusFilter(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-[#167D65]/20 text-xs"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Active">Active Only</option>
                  <option value="Matured">Matured</option>
                  <option value="Closed">Closed</option>
                  <option value="Prematurely Withdrawn">Prematurely Withdrawn</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 whitespace-nowrap">Sort:</span>
                <select 
                  value={fdSort} 
                  onChange={(e) => setFdSort(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-[#167D65]/20 text-xs"
                >
                  <option value="maturityDate">Maturity Date</option>
                  <option value="amountInvested">Highest Investment</option>
                  <option value="rateOfInterest">Highest Interest Rate</option>
                </select>
              </div>

            </div>

            {/* EXACT 9-COLUMN FD TABLE */}
            <div className="overflow-x-auto rounded-xl border border-[#E7EBF2]">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    <th className="py-3 px-4 w-12">Sr. No.</th>
                    <th className="py-3 px-4">Bank Name</th>
                    <th className="py-3 px-4">FD Number</th>
                    <th className="py-3 px-4">Rate of Interest</th>
                    <th className="py-3 px-4">FD Opening Date</th>
                    <th className="py-3 px-4">Maturity Date</th>
                    <th className="py-3 px-4 text-right">Amount Invested</th>
                    <th className="py-3 px-4 text-right">Maturity Amount</th>
                    <th className="py-3 px-4 text-right">Total Gain</th>
                    <th className="py-3 px-4 text-center w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {renderFdRows()}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
              <span>{processedFds.length} {processedFds.length === 1 ? 'deposit' : 'deposits'} shown</span>
              <span>Active FDs Investment: <strong className="text-slate-900">{formatINR(totalFdPrincipal)}</strong></span>
            </div>

          </section>
        )}

        {/* SECTION: RECURRING DEPOSITS */}
        {(activeTab === 'overview' || activeTab === 'rds') && (
          <section className="bg-white rounded-2xl border border-[#E7EBF2] shadow-sm p-6 space-y-6">
            
            {/* SECTION HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#182230] flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-indigo-600" /> Recurring Deposit Portfolio
                </h3>
                <p className="text-xs text-[#738094]">
                  Track recurring monthly installment plans and calculated cumulative wealth
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportToCSV(rds, 'Recurring_Deposits_Vault', [
                    { label: 'Sr No', key: 'srNo' },
                    { label: 'Bank Name', key: 'bankName' },
                    { label: 'RD Number', key: 'rdNumber' },
                    { label: 'Installment Date', key: 'installmentDate' },
                    { label: 'Installment Amount', key: 'installmentAmount' },
                    { label: 'Interest Rate', key: 'rateOfInterest' }
                  ])}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
                </button>
                <button 
                  onClick={() => { setEditingRd(null); setIsRdModalOpen(true); }}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#173E35] hover:bg-[#167D65] rounded-lg transition-all flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add RD
                </button>
              </div>
            </div>

            {/* 3 COMPACT RD SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#EDF1FF] p-4 rounded-xl border border-indigo-100">
                <div className="text-xs font-semibold text-indigo-900">Total RD Investment</div>
                <div className="text-xl font-bold text-indigo-950 font-mono mt-1">
                  {formatINR(totalRdContributions)}
                </div>
                <div className="text-[10px] text-indigo-700/80 mt-0.5">Cumulative monthly paid installments</div>
              </div>

              <div className="bg-[#E8F7F1] p-4 rounded-xl border border-emerald-100">
                <div className="text-xs font-semibold text-emerald-900">Total RD Maturity Amount</div>
                <div className="text-xl font-bold text-emerald-950 font-mono mt-1">
                  {formatINR(totalRdMaturity)}
                </div>
                <div className="text-[10px] text-emerald-700/80 mt-0.5">Estimated payout at term completion</div>
              </div>

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <div className="text-xs font-semibold text-amber-900">Next Installment Date</div>
                <div className="text-xl font-bold text-amber-950 mt-1">
                  {nextRdInstallmentDate ? formatDate(nextRdInstallmentDate) : 'No due dates'}
                </div>
                <div className="text-[10px] text-amber-700/80 mt-0.5">Upcoming scheduled contribution</div>
              </div>
            </div>

            {/* SEARCH */}
            <div className="flex items-center justify-between gap-4 text-xs">
              <div className="relative max-w-xs w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search bank or RD number..."
                  value={rdSearch}
                  onChange={(e) => setRdSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-xs"
                />
              </div>

              <div className="text-slate-500">
                Active RD accounts: <strong className="text-slate-900">{activeRds.length}</strong>
              </div>
            </div>

            {/* EXACT 6-COLUMN RD TABLE */}
            <div className="overflow-x-auto rounded-xl border border-[#E7EBF2]">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    <th className="py-3 px-4 w-12">Sr. No.</th>
                    <th className="py-3 px-4">Bank Name</th>
                    <th className="py-3 px-4">RD No.</th>
                    <th className="py-3 px-4">Installment Date</th>
                    <th className="py-3 px-4 text-right">Installment Amount</th>
                    <th className="py-3 px-4 text-center">Rate of Interest</th>
                    <th className="py-3 px-4 text-center w-36">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {renderRdRows()}
                </tbody>
              </table>
            </div>

          </section>
        )}

        {/* SECTION: UPCOMING MATURITY ALERTS */}
        {(activeTab === 'overview' || activeTab === 'maturities') && (
          <section className="bg-white rounded-2xl border border-[#E7EBF2] shadow-sm p-6 space-y-4">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#182230] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" /> Upcoming FD Maturities
                </h3>
                <p className="text-xs text-[#738094]">
                  Active fixed deposits maturing within the next 90 days
                </p>
              </div>

              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                {upcomingFds.length} Alert{upcomingFds.length === 1 ? '' : 's'}
              </span>
            </div>

            {upcomingFds.length === 0 ? (
              <div className="bg-[#FFF4DC]/40 border border-amber-200/60 rounded-xl p-8 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-amber-600 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-800">No Maturities Expected Soon</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  You have no active fixed deposits scheduled to mature in the next 90 days. All active investments remain on tenure track.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingFds.map(fd => {
                  const isUrgent = fd.daysRemaining <= 7;
                  const isMatured = fd.daysRemaining < 0;

                  return (
                    <div 
                      key={fd.id} 
                      className={`p-4 rounded-xl border transition-all ${
                        isMatured 
                          ? 'bg-slate-50 border-slate-300' 
                          : isUrgent 
                          ? 'bg-rose-50/70 border-rose-200' 
                          : 'bg-[#FFF4DC]/60 border-amber-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-bold text-slate-900 text-sm">{fd.bankName}</span>
                          <p className="text-xs text-slate-500 font-mono">{fd.fdNumber || 'No FD Number'}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isMatured ? 'bg-slate-200 text-slate-700' :
                          isUrgent ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'
                        }`}>
                          {isMatured ? 'Matured' : `${fd.daysRemaining} days left`}
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Maturity Amount</span>
                          <span className="font-bold text-slate-900 font-mono text-sm">{formatINR(fd.maturityAmount)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 block text-[10px]">Maturity Date</span>
                          <span className="font-medium text-slate-800">{formatDate(fd.maturityDate)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </section>
        )}

        {/* TAB: DATA MANAGEMENT & SETTINGS */}
        {activeTab === 'settings' && (
          <section className="bg-white rounded-2xl border border-[#E7EBF2] shadow-sm p-6 space-y-6">
            
            <div>
              <h3 className="text-lg font-bold text-[#182230] flex items-center gap-2">
                <Database className="w-5 h-5 text-[#167D65]" /> Data Management & Local Persistence
              </h3>
              <p className="text-xs text-[#738094]">
                Export data, create full local backups, or safely restore saved financial records.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* BACKUP & EXPORT */}
              <div className="p-5 rounded-xl border border-slate-200 space-y-4 bg-slate-50/50">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-700" /> Export & Backup
                </h4>
                <p className="text-xs text-slate-600">
                  Save all financial records into readable CSV files or a single JSON backup file for safe keeping.
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button 
                    onClick={exportFullBackupJSON}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#173E35] text-white hover:bg-[#167D65] transition-all flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Export JSON Backup
                  </button>
                  <button 
                    onClick={() => exportToCSV(fds, 'Vault_Fixed_Deposits', [
                      { label: 'Bank', key: 'bankName' },
                      { label: 'FD Number', key: 'fdNumber' },
                      { label: 'Rate', key: 'rateOfInterest' },
                      { label: 'Amount', key: 'amountInvested' },
                      { label: 'Maturity Amount', key: 'maturityAmount' }
                    ])}
                    className="px-3 py-2 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" /> Export FD CSV
                  </button>
                </div>
              </div>

              {/* RESTORE & IMPORT */}
              <div className="p-5 rounded-xl border border-slate-200 space-y-4 bg-slate-50/50">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-700" /> Restore from JSON Backup
                </h4>
                <p className="text-xs text-slate-600">
                  Restore previously exported Vault JSON file. This will update your local records.
                </p>

                <label className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 cursor-pointer transition-all gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-blue-600" /> Select JSON Backup File
                  <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                </label>
              </div>

            </div>

            {/* DATA PRIVACY & STORAGE INFO */}
            <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-700">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Info className="w-4 h-4 text-slate-600" /> Privacy & Local Device Storage Policy
              </div>
              <p>
                All financial figures, bank names, and deposit account numbers entered into Vault remain strictly stored inside your browser's local storage (<strong>IndexedDB / localStorage</strong>).
              </p>
              <p>
                No financial data is ever transmitted to external servers or third-party analytics services.
              </p>
            </div>

            {/* DESTRUCTIVE ZONE */}
            <div className="p-5 rounded-xl border border-rose-200 bg-rose-50/40 space-y-3">
              <h4 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" /> Danger Zone
              </h4>
              <p className="text-xs text-rose-700">
                Wipe all saved deposits and reset application state back to clean initial layout.
              </p>
              <button 
                onClick={() => setConfirmDelete({ type: 'ALL', id: 'ALL', name: 'All saved local records' })}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Wipe All Data
              </button>
            </div>

          </section>
        )}

      </main>

      {/* MODAL: ADD / EDIT FD */}
      {isFdModalOpen && (
        <FdModal 
          isOpen={isFdModalOpen} 
          onClose={() => setIsFdModalOpen(false)} 
          onSave={handleSaveFd} 
          initialData={editingFd} 
        />
      )}

      {/* MODAL: ADD / EDIT RD */}
      {isRdModalOpen && (
        <RdModal 
          isOpen={isRdModalOpen} 
          onClose={() => setIsRdModalOpen(false)} 
          onSave={handleSaveRd} 
          initialData={editingRd} 
        />
      )}

      {/* MODAL: RD DETAIL DRAWER */}
      {viewingRdDetails && (
        <RdDetailsModal 
          rd={viewingRdDetails} 
          onClose={() => setViewingRdDetails(null)} 
        />
      )}

      {/* MODAL: CONFIRM DELETION */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Confirm Deletion</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong>{confirmDelete.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (confirmDelete.type === 'FD') handleDeleteFd(confirmDelete.id);
                  else if (confirmDelete.type === 'RD') handleDeleteRd(confirmDelete.id);
                  else if (confirmDelete.type === 'ALL') handleClearAllData();
                  setConfirmDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ==========================================
// FORM MODAL: FIXED DEPOSIT
// ==========================================
function FdModal({ isOpen, onClose, onSave, initialData }) {
  const [formData, setFormData] = useState({
    bankName: '',
    fdNumber: '',
    rateOfInterest: '7.10',
    openingDate: new Date().toISOString().slice(0, 10),
    maturityDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    amountInvested: '',
    maturityAmount: '',
    status: 'Active'
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    }
  }, [initialData]);

  // Dynamic preview gain
  const previewGain = useMemo(() => {
    const inv = Number(formData.amountInvested) || 0;
    const mat = Number(formData.maturityAmount) || 0;
    return mat - inv;
  }, [formData.amountInvested, formData.maturityAmount]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.bankName.trim()) {
      setError('Bank name is required');
      return;
    }
    if (!formData.amountInvested || Number(formData.amountInvested) <= 0) {
      setError('Please enter a valid invested amount');
      return;
    }
    if (new Date(formData.maturityDate) <= new Date(formData.openingDate)) {
      setError('Maturity date must be later than opening date');
      return;
    }

    onSave({
      ...formData,
      rateOfInterest: Number(formData.rateOfInterest) || 0,
      amountInvested: Number(formData.amountInvested) || 0,
      maturityAmount: Number(formData.maturityAmount) || 0
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#167D65]" />
            {initialData ? 'Edit Fixed Deposit' : 'Add New Fixed Deposit'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Bank Name *</label>
              <input 
                type="text"
                required
                placeholder="e.g. HDFC Bank, SBI"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#167D65]/20"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">FD Reference Number</label>
              <input 
                type="text"
                placeholder="e.g. FD-99210"
                value={formData.fdNumber}
                onChange={(e) => setFormData({ ...formData, fdNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#167D65]/20 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Interest Rate (%)</label>
              <input 
                type="number"
                step="0.01"
                placeholder="7.10"
                value={formData.rateOfInterest}
                onChange={(e) => setFormData({ ...formData, rateOfInterest: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#167D65]/20"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Opening Date</label>
              <input 
                type="date"
                value={formData.openingDate}
                onChange={(e) => setFormData({ ...formData, openingDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#167D65]/20"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Maturity Date</label>
              <input 
                type="date"
                value={formData.maturityDate}
                onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#167D65]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Amount Invested (₹) *</label>
              <input 
                type="number"
                required
                placeholder="100000"
                value={formData.amountInvested}
                onChange={(e) => setFormData({ ...formData, amountInvested: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#167D65]/20 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Expected Maturity Value (₹)</label>
              <input 
                type="number"
                placeholder="115000"
                value={formData.maturityAmount}
                onChange={(e) => setFormData({ ...formData, maturityAmount: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#167D65]/20 font-mono"
              />
            </div>
          </div>

          {/* GAIN PREVIEW BANNER */}
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center justify-between text-emerald-900">
            <span>Calculated Total Gain:</span>
            <span className="font-bold font-mono text-sm">{formatINR(previewGain)}</span>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Deposit Status</label>
            <select 
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#167D65]/20"
            >
              <option value="Active">Active</option>
              <option value="Matured">Matured</option>
              <option value="Closed">Closed</option>
              <option value="Prematurely Withdrawn">Prematurely Withdrawn</option>
            </select>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-[#173E35] hover:bg-[#167D65] rounded-lg transition-all shadow-sm"
            >
              Save Record
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

// ==========================================
// FORM MODAL: RECURRING DEPOSIT
// ==========================================
function RdModal({ isOpen, onClose, onSave, initialData }) {
  const [formData, setFormData] = useState({
    bankName: '',
    rdNumber: '',
    installmentDate: new Date().toISOString().slice(0, 10),
    installmentAmount: '',
    rateOfInterest: '7.00',
    openingDate: new Date().toISOString().slice(0, 10),
    maturityDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    paidInstallments: 1,
    totalInstallments: 12,
    maturityAmount: '',
    status: 'Active'
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData });
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.bankName.trim()) {
      setError('Bank name is required');
      return;
    }
    if (!formData.installmentAmount || Number(formData.installmentAmount) <= 0) {
      setError('Please enter a valid installment amount');
      return;
    }

    onSave({
      ...formData,
      installmentAmount: Number(formData.installmentAmount) || 0,
      rateOfInterest: Number(formData.rateOfInterest) || 0,
      paidInstallments: Number(formData.paidInstallments) || 0,
      totalInstallments: Number(formData.totalInstallments) || 12,
      maturityAmount: Number(formData.maturityAmount) || 0
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-indigo-600" />
            {initialData ? 'Edit Recurring Deposit' : 'Add New Recurring Deposit'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Bank Name *</label>
              <input 
                type="text"
                required
                placeholder="e.g. Axis Bank, ICICI"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">RD Reference Number</label>
              <input 
                type="text"
                placeholder="e.g. RD-1102"
                value={formData.rdNumber}
                onChange={(e) => setFormData({ ...formData, rdNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Monthly Installment (₹) *</label>
              <input 
                type="number"
                required
                placeholder="5000"
                value={formData.installmentAmount}
                onChange={(e) => setFormData({ ...formData, installmentAmount: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Next Due Date</label>
              <input 
                type="date"
                value={formData.installmentDate}
                onChange={(e) => setFormData({ ...formData, installmentDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Interest Rate (%)</label>
              <input 
                type="number"
                step="0.01"
                placeholder="7.00"
                value={formData.rateOfInterest}
                onChange={(e) => setFormData({ ...formData, rateOfInterest: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Installments Paid So Far</label>
              <input 
                type="number"
                value={formData.paidInstallments}
                onChange={(e) => setFormData({ ...formData, paidInstallments: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Total Tenure Installments</label>
              <input 
                type="number"
                value={formData.totalInstallments}
                onChange={(e) => setFormData({ ...formData, totalInstallments: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">RD Opening Date</label>
              <input 
                type="date"
                value={formData.openingDate}
                onChange={(e) => setFormData({ ...formData, openingDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">RD Maturity Date</label>
              <input 
                type="date"
                value={formData.maturityDate}
                onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Expected RD Maturity Value (₹)</label>
            <input 
              type="number"
              placeholder="65000"
              value={formData.maturityAmount}
              onChange={(e) => setFormData({ ...formData, maturityAmount: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none font-mono"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-[#173E35] hover:bg-[#167D65] rounded-lg transition-all shadow-sm"
            >
              Save RD Record
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

// ==========================================
// FULL RD DETAILS DRAWER / MODAL
// ==========================================
function RdDetailsModal({ rd, onClose }) {
  const paidCount = Number(rd.paidInstallments) || 0;
  const instAmt = Number(rd.installmentAmount) || 0;
  const totalContributed = paidCount * instAmt;
  const maturityAmt = Number(rd.maturityAmount) || 0;
  const estimatedGain = maturityAmt - totalContributed;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-bold text-indigo-600 uppercase">Recurring Deposit Breakdown</span>
            <h3 className="text-base font-bold text-slate-900">{rd.bankName}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block">RD Account No.</span>
              <span className="font-mono font-semibold text-slate-800">{rd.rdNumber || '-'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Interest Rate</span>
              <span className="font-semibold text-slate-800">{rd.rateOfInterest}%</span>
            </div>
          </div>

          <div className="space-y-1.5 border-t border-slate-100 pt-2">
            <div className="flex justify-between">
              <span className="text-slate-500">RD Opening Date:</span>
              <span className="font-medium text-slate-800">{formatDate(rd.openingDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">RD Maturity Date:</span>
              <span className="font-medium text-slate-800">{formatDate(rd.maturityDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Next Due Installment:</span>
              <span className="font-medium text-amber-700">{formatDate(rd.installmentDate)}</span>
            </div>
          </div>

          <div className="space-y-1.5 border-t border-slate-100 pt-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Monthly Contribution:</span>
              <span className="font-mono font-semibold text-slate-900">{formatINR(instAmt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Installments Progress:</span>
              <span className="font-semibold text-indigo-700">{paidCount} / {rd.totalInstallments || 12} paid</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-1">
              <span>Total Contributed:</span>
              <span className="font-mono">{formatINR(totalContributed)}</span>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl space-y-1 text-emerald-950">
            <div className="flex justify-between">
              <span className="text-xs">Expected Maturity Payout:</span>
              <span className="font-bold font-mono text-sm">{formatINR(maturityAmt)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-emerald-700">
              <span>Estimated Interest Gain:</span>
              <span className="font-semibold">+{formatINR(estimatedGain)}</span>
            </div>
          </div>

        </div>

        <div className="pt-2">
          <button 
            onClick={onClose}
            className="w-full py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
}
