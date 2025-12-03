import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TestPlan, TestCase, Status, Priority } from '../types';
import { Button } from './Button';
import { Modal } from './Modal';
import { generateTestCases } from '../services/geminiService';
import { Plus, CheckCircle, Circle, AlertCircle, Sparkles, FolderPlus, ClipboardList, Play, Clock, Edit2, Trash2, Save, X, Copy, RotateCcw, Files, FilePlus, Bot, Search, ChevronDown, ChevronLeft, ArrowDownToLine } from 'lucide-react';


import { apiService } from '../services/apiService';
import { useToast } from '../contexts/ToastContext';
import { ConfirmModal } from './ConfirmModal';

interface TestManagerProps {
  plans: TestPlan[];
  setPlans: React.Dispatch<React.SetStateAction<TestPlan[]>>;
}

export const TestManager: React.FC<TestManagerProps> = ({ plans, setPlans }) => {
  const { user } = useAuth();
  const isViewer = user?.role === 'Viewer';
  const isSupport = user?.role === 'Support';
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(plans[0]?.id || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [users, setUsers] = useState<{ id: number, username: string }[]>([]);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editPlanName, setEditPlanName] = useState('');
  const [editPlanDesc, setEditPlanDesc] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Mobile View State
  const [mobileView, setMobileView] = useState<'plans' | 'details'>('plans');

  const { showToast } = useToast();

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  // Modals state
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isReplicateModalOpen, setIsReplicateModalOpen] = useState(false);
  const [sourcePlanId, setSourcePlanId] = useState('');
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);

  useEffect(() => {
    if (isCaseModalOpen) {
      const fetchUsers = async () => {
        try {
          const data = await apiService.getUsers();
          setUsers(data);
        } catch (error) {
          console.error('Failed to fetch users', error);
        }
      };
      fetchUsers();
    }
  }, [isCaseModalOpen]);

  useEffect(() => {
    // If on mobile and a plan is selected, switch to details view
    if (selectedPlanId && window.innerWidth < 768) {
      setMobileView('details');
    }
  }, [selectedPlanId]);

  // Forms state
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDesc, setNewPlanDesc] = useState('');

  const [newCaseData, setNewCaseData] = useState({ title: '', preconditions: '', steps: '', expected: '', estimatedTime: '', priority: Priority.MEDIUM, assignedTo: '' });
  const [aiFeatureDesc, setAiFeatureDesc] = useState('');

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const filteredPlans = plans.filter(plan =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTestCases = selectedPlan?.testCases.filter(tc =>
    tc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tc.steps.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tc.expectedResult.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const inputClass = "w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors";

  // --- Handlers ---

  const handleCreatePlan = async () => {
    if (!newPlanName) return;
    try {
      const newPlan = await apiService.createTestPlan({
        name: newPlanName,
        description: newPlanDesc || 'Plano de testes.',
        progress: 0,
        testCases: []
      });
      setPlans([...plans, newPlan]);
      setSelectedPlanId(newPlan.id);
      setIsPlanModalOpen(false);
      setNewPlanName('');
      setNewPlanDesc('');
      setMobileView('details'); // Switch to details on mobile
      showToast({ message: 'Plano de teste criado com sucesso!', type: 'success' });
    } catch (error) {
      showToast({ message: 'Erro ao criar plano de teste', type: 'error' });
    }
  };

  const handleEditPlan = (plan: TestPlan) => {
    setEditingPlanId(plan.id);
    setEditPlanName(plan.name);
    setEditPlanDesc(plan.description);
  };

  const handleUpdatePlan = async () => {
    if (!editingPlanId || !editPlanName) return;
    const plan = plans.find(p => p.id === editingPlanId);
    if (!plan) return;

    const updatedPlan = { ...plan, name: editPlanName, description: editPlanDesc };

    try {
      await apiService.updateTestPlan(updatedPlan);
      setPlans(prev => prev.map(p => p.id === editingPlanId ? updatedPlan : p));
      setEditingPlanId(null);
      showToast({ message: 'Plano atualizado com sucesso!', type: 'success' });
    } catch (error) {
      showToast({ message: 'Erro ao atualizar plano de teste', type: 'error' });
    }
  };

  const handleCancelEdit = () => {
    setEditingPlanId(null);
    setEditPlanName('');
    setEditPlanDesc('');
  };

  const handleDeletePlan = (id: string, name: string) => {
    const planToDelete = plans.find(p => p.id === id);
    if (!planToDelete) return;

    setConfirmModal({
      isOpen: true,
      title: 'Excluir Plano de Teste',
      message: `Tem certeza que deseja excluir o plano "${name}"?`,
      onConfirm: () => {
        // Optimistic update
        setPlans(prev => prev.filter(p => p.id !== id));
        if (selectedPlanId === id) {
          setSelectedPlanId(null);
          setMobileView('plans'); // Go back to list
        }

        showToast({
          message: `Plano "${name}" excluído.`,
          type: 'error',
          duration: 5000,
          onUndo: () => {
            setPlans(prev => [...prev, planToDelete]);
            if (selectedPlanId === null) setSelectedPlanId(id);
          },
          onCommit: async () => {
            try {
              await apiService.deleteTestPlan(id);
            } catch (error) {
              showToast({ message: 'Erro ao excluir plano permanentemente', type: 'error' });
              setPlans(prev => [...prev, planToDelete]);
            }
          }
        });
      }
    });
  };

  const handleSaveCase = async () => {
    if (!selectedPlanId || !newCaseData.title) return;

    const plan = plans.find(p => p.id === selectedPlanId);
    if (!plan) return;

    let updatedCases;
    if (editingCaseId) {
      // Update existing case
      updatedCases = plan.testCases.map(c =>
        c.id === editingCaseId ? {
          ...c,
          title: newCaseData.title,
          preconditions: newCaseData.preconditions || '-',
          steps: newCaseData.steps || '-',
          expectedResult: newCaseData.expected || '-',
          estimatedTime: newCaseData.estimatedTime || '00:00',
          priority: newCaseData.priority || Priority.MEDIUM,
          assignedTo: newCaseData.assignedTo || 'Não atribuído'
        } : c
      );
    } else {
      // Create new case
      const newCase: TestCase = {
        id: Date.now().toString(),
        title: newCaseData.title,
        preconditions: newCaseData.preconditions || '-',
        steps: newCaseData.steps || '-',
        expectedResult: newCaseData.expected || '-',
        status: Status.PENDING,
        estimatedTime: newCaseData.estimatedTime || '00:00',
        priority: newCaseData.priority || Priority.MEDIUM,
        assignedTo: newCaseData.assignedTo || 'Não atribuído'
      };
      updatedCases = [...plan.testCases, newCase];
    }

    const updatedPlan = { ...plan, testCases: updatedCases };

    try {
      await apiService.updateTestPlan(updatedPlan);
      setPlans(prev => prev.map(p => p.id === selectedPlanId ? updatedPlan : p));
      setIsCaseModalOpen(false);
      setNewCaseData({ title: '', preconditions: '', steps: '', expected: '', estimatedTime: '', priority: Priority.MEDIUM, assignedTo: '' });
      setEditingCaseId(null);
      showToast({ message: editingCaseId ? 'Caso de teste atualizado!' : 'Caso de teste criado!', type: 'success' });
    } catch (error) {
      showToast({ message: 'Erro ao salvar caso de teste', type: 'error' });
    }
  };

  const handleEditCase = (testCase: TestCase) => {
    setEditingCaseId(testCase.id);
    setNewCaseData({
      title: testCase.title,
      preconditions: testCase.preconditions,
      steps: testCase.steps,
      expected: testCase.expectedResult,
      estimatedTime: testCase.estimatedTime || '',
      priority: testCase.priority || Priority.MEDIUM,
      assignedTo: testCase.assignedTo || ''
    });
    setIsCaseModalOpen(true);
  };

  const handleDeleteCase = (caseId: string) => {
    if (!selectedPlanId) return;
    const plan = plans.find(p => p.id === selectedPlanId);
    if (!plan) return;

    const caseToDelete = plan.testCases.find(c => c.id === caseId);
    if (!caseToDelete) return;

    setConfirmModal({
      isOpen: true,
      title: 'Excluir Caso de Teste',
      message: `Tem certeza que deseja excluir o caso "${caseToDelete.title}"?`,
      onConfirm: () => {
        // Optimistic update
        const updatedCases = plan.testCases.filter(c => c.id !== caseId);
        const updatedPlan = { ...plan, testCases: updatedCases };
        setPlans(prev => prev.map(p => p.id === selectedPlanId ? updatedPlan : p));

        showToast({
          message: 'Caso de teste excluído.',
          type: 'error',
          duration: 5000,
          onUndo: () => {
            const restoredPlan = { ...plan, testCases: [...plan.testCases] }; // Original cases
            setPlans(prev => prev.map(p => p.id === selectedPlanId ? restoredPlan : p));
          },
          onCommit: async () => {
            try {
              await apiService.updateTestPlan(updatedPlan);
            } catch (error) {
              showToast({ message: 'Erro ao excluir caso de teste permanentemente', type: 'error' });
              // Restore
              const restoredPlan = { ...plan, testCases: [...plan.testCases] };
              setPlans(prev => prev.map(p => p.id === selectedPlanId ? restoredPlan : p));
            }
          }
        });
      }
    });
  };

  const handleGenerateCases = async () => {
    if (!selectedPlanId || !aiFeatureDesc) return;

    const plan = plans.find(p => p.id === selectedPlanId);
    if (!plan) return;

    setIsGenerating(true);
    try {
      const casesJsonString = await generateTestCases(aiFeatureDesc);
      const cleanJson = casesJsonString.replace(/```json/g, '').replace(/```/g, '');
      const newCasesData = JSON.parse(cleanJson);

      const newCases: TestCase[] = newCasesData.map((c: any, index: number) => ({
        id: Date.now().toString() + index,
        title: c.title,
        preconditions: c.preconditions,
        steps: c.steps,
        expectedResult: c.expectedResult,
        status: Status.PENDING,
        estimatedTime: '00:15' // Default estimate for AI generated cases
      }));

      const updatedPlan = { ...plan, testCases: [...plan.testCases, ...newCases] };
      await apiService.updateTestPlan(updatedPlan);

      setPlans(prev => prev.map(p => {
        if (p.id === selectedPlanId) {
          return updatedPlan;
        }
        return p;
      }));
      setIsAIModalOpen(false);
      setAiFeatureDesc('');
      showToast({ message: 'Casos de teste gerados com sucesso!', type: 'success' });
    } catch (e) {
      showToast({ message: "Erro ao gerar casos de teste. Verifique a API Key.", type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleCaseStatus = async (planId: string, caseId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    const newCases = plan.testCases.map(c => {
      if (c.id !== caseId) return c;
      const nextStatus = c.status === Status.PENDING ? Status.COMPLETED :
        c.status === Status.COMPLETED ? Status.FAILED : Status.PENDING;
      return { ...c, status: nextStatus };
    });

    const updatedPlan = { ...plan, testCases: newCases };

    try {
      await apiService.updateTestPlan(updatedPlan);
      setPlans(prev => prev.map(p => p.id === planId ? updatedPlan : p));
    } catch (error) {
      showToast({ message: 'Erro ao atualizar status', type: 'error' });
    }
  };

  const handleResetStatus = async () => {
    if (!selectedPlanId || !window.confirm('Tem certeza que deseja zerar o status de todos os casos de teste deste plano?')) return;

    try {
      await apiService.resetTestPlanStatus(selectedPlanId);

      // Update local state
      setPlans(prev => prev.map(p => {
        if (p.id === selectedPlanId) {
          return {
            ...p,
            progress: 0,
            testCases: p.testCases.map(tc => ({ ...tc, status: Status.PENDING }))
          };
        }
        return p;
      }));
      showToast({ message: 'Status zerados com sucesso!', type: 'success' });
    } catch (error) {
      showToast({ message: 'Erro ao zerar status', type: 'error' });
    }
  };

  const handleDuplicatePlan = async (planId: string, planName: string) => {
    if (!window.confirm(`Deseja duplicar o plano "${planName}"?`)) return;

    try {
      await apiService.duplicateTestPlan(planId);
      // Refresh plans to get the new one
      const updatedPlans = await apiService.getTestPlans();
      setPlans(updatedPlans);
      showToast({ message: 'Plano duplicado com sucesso!', type: 'success' });
    } catch (error) {
      showToast({ message: 'Erro ao duplicar plano', type: 'error' });
    }
  };

  const handleReplicateCases = async () => {
    if (!selectedPlanId || !sourcePlanId) return;

    try {
      await apiService.replicateTestCases(selectedPlanId, sourcePlanId);

      // Refresh plans to get the new cases
      const updatedPlans = await apiService.getTestPlans();
      setPlans(updatedPlans);
      setIsReplicateModalOpen(false);
      setSourcePlanId('');
      showToast({ message: 'Casos replicados com sucesso!', type: 'success' });
    } catch (error) {
      showToast({ message: 'Erro ao replicar casos de teste', type: 'error' });
    }
  };

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case Status.COMPLETED: return <CheckCircle className="w-5 h-5 text-green-500" />;
      case Status.FAILED: return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors" />;
    }
  };

  const getPriorityColor = (priority?: Priority) => {
    switch (priority) {
      case Priority.CRITICAL: return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      case Priority.HIGH: return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
      case Priority.MEDIUM: return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case Priority.LOW: return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
      default: return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const calculateTotalTime = (cases: TestCase[]) => {
    let totalMinutes = 0;
    cases.forEach(c => {
      if (c.estimatedTime) {
        const [hours, minutes] = c.estimatedTime.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          totalMinutes += (hours * 60) + minutes;
        }
      }
    });
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Planejamento de Testes</h1>
          <p className="text-slate-500 dark:text-slate-400">Crie planos, vincule casos e acompanhe a execução.</p>
        </div>
        {!isViewer && !isSupport && (
          <Button onClick={() => setIsPlanModalOpen(true)} className="w-full md:w-auto">
            <Plus className="w-4 h-4 mr-2" /> Novo Plano
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar planos ou casos de teste..."
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-700 dark:text-slate-200"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Plans List */}
        <div className={`${mobileView === 'plans' ? 'block' : 'hidden'} md:block w-full md:w-1/3 overflow-y-auto pr-2 space-y-4`}>
          {filteredPlans.map(plan => (
            <div
              key={plan.id}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors group ${selectedPlanId === plan.id
                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800'
                : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-transparent'
                } border mb-2`}
            >
              {editingPlanId === plan.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    className={inputClass}
                    value={editPlanName}
                    onChange={(e) => setEditPlanName(e.target.value)}
                    placeholder="Nome do Plano"
                    autoFocus
                  />
                  <textarea
                    className={inputClass}
                    value={editPlanDesc}
                    onChange={(e) => setEditPlanDesc(e.target.value)}
                    placeholder="Descrição"
                    rows={2}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={handleUpdatePlan}
                      className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                      title="Salvar"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1.5 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                      title="Cancelar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => {
                      setSelectedPlanId(plan.id);
                      setMobileView('details');
                    }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`font-medium ${selectedPlanId === plan.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>
                        {plan.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                      {plan.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <ClipboardList className="w-3 h-3" />
                      <span>{plan.testCases.length} casos</span>
                      <span>•</span>
                      <span>{Math.round(plan.progress)}% concluído</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden mt-2">
                      <div
                        className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${(plan.testCases.filter(c => c.status === Status.COMPLETED).length / (plan.testCases.length || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    {!isViewer && !isSupport && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDuplicatePlan(plan.id, plan.name); }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                          title="Duplicar"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditPlan(plan); }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!isSupport && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.id, plan.name); }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors ml-1"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Selected Plan Details */}
        <div className={`${mobileView === 'details' ? 'flex' : 'hidden'} md:flex flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex-col overflow-hidden`}>
          {selectedPlan ? (
            <>
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50/50 dark:bg-slate-800/50 gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMobileView('plans')}
                    className="md:hidden p-1 -ml-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{selectedPlan.name}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie e execute os casos de teste deste plano.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                  <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mr-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <Clock className="w-4 h-4 mr-2 text-indigo-500 dark:text-indigo-400" />
                    <span className="font-medium">{calculateTotalTime(selectedPlan.testCases)}</span>
                  </div>
                  {user?.role !== 'Viewer' && !isSupport && (
                    <>
                      <button
                        onClick={handleResetStatus}
                        className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                        title="Zerar Status"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setIsReplicateModalOpen(true)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Importar Casos"
                      >
                        <ArrowDownToLine className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingCaseId(null);
                          setNewCaseData({ title: '', preconditions: '', steps: '', expected: '', estimatedTime: '', priority: Priority.MEDIUM, assignedTo: '' });
                          setIsCaseModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                        title="Adicionar Manualmente"
                      >
                        <FilePlus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setIsAIModalOpen(true)}
                        className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                        title="Gerar com IA"
                      >
                        <Bot className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
                {selectedPlan.testCases.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
                    <ClipboardList className="w-16 h-16 mb-4 text-slate-200 dark:text-slate-700" />
                    <p className="text-lg font-medium text-slate-500 dark:text-slate-400">Nenhum caso de teste</p>
                    <p className="text-sm">Crie manualmente ou use a IA para gerar casos.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTestCases.map((testCase) => (
                      <div key={testCase.id} className="group border border-slate-100 dark:border-slate-800 rounded-xl p-3 md:p-4 hover:shadow-lg hover:border-indigo-100 dark:hover:border-indigo-900 transition-all bg-white dark:bg-slate-950 relative">
                        <div className="flex items-start gap-3 md:gap-4">
                          <button
                            onClick={() => toggleCaseStatus(selectedPlan.id, testCase.id)}
                            className={`mt-1 flex-shrink-0 focus:outline-none transform ${user?.role !== 'Viewer' && !isSupport ? 'group-hover:scale-110' : 'cursor-default'} transition-transform`}
                            title={user?.role !== 'Viewer' && !isSupport ? "Alterar Status" : "Status"}
                            disabled={user?.role === 'Viewer' || isSupport}
                          >
                            {getStatusIcon(testCase.status)}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-2 md:gap-0">
                              <h4 className={`text-base font-semibold break-words ${testCase.status === Status.COMPLETED ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                                {testCase.title}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                                {testCase.priority && (
                                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded border ${getPriorityColor(testCase.priority)}`}>
                                    {testCase.priority}
                                  </span>
                                )}
                                {testCase.estimatedTime && (
                                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">
                                    <Clock className="w-3 h-3 mr-1" /> {testCase.estimatedTime}
                                  </span>
                                )}
                                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded ${testCase.status === Status.PENDING ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                  testCase.status === Status.COMPLETED ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                                    'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                  }`}>
                                  {testCase.status}
                                </span>
                                <div className="flex items-center gap-1 ml-auto md:ml-0">
                                  {user?.role !== 'Viewer' && !isSupport && (
                                    <>
                                      <button
                                        onClick={() => handleEditCase(testCase)}
                                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                                        title="Editar Caso"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteCase(testCase.id)}
                                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                        title="Excluir Caso"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            {testCase.assignedTo && (
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-2">
                                Atribuído a: <span className="font-medium text-slate-600 dark:text-slate-300">{testCase.assignedTo}</span>
                              </p>
                            )}

                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-slate-50/80 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Passos</span>
                                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed break-words">{testCase.steps}</p>
                              </div>
                              <div className="bg-slate-50/80 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Resultado Esperado</span>
                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words">{testCase.expectedResult}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 bg-slate-50/30 dark:bg-slate-900/30">
              <FolderPlus className="w-16 h-16 mb-4 opacity-20" />
              <span className="text-lg">Selecione um plano de teste</span>
            </div>
          )}
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Create Plan Modal */}
      <Modal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} title="Novo Plano de Teste">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Plano</label>
            <input
              type="text"
              placeholder="Ex: Regressão V2.4"
              className={inputClass}
              value={newPlanName}
              onChange={(e) => setNewPlanName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
            <textarea
              placeholder="Objetivo deste plano..."
              className={`${inputClass} h-24 resize-none`}
              value={newPlanDesc}
              onChange={(e) => setNewPlanDesc(e.target.value)}
            />
          </div>
          <div className="flex justify-end pt-4 space-x-3">
            <Button variant="ghost" onClick={() => setIsPlanModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreatePlan}>Criar Plano</Button>
          </div>
        </div>
      </Modal>

      {/* Manual Case Modal */}
      <Modal isOpen={isCaseModalOpen} onClose={() => setIsCaseModalOpen(false)} title={editingCaseId ? "Editar Caso de Teste" : "Novo Caso de Teste"} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título</label>
            <input
              type="text"
              placeholder="Ex: Validar login com senha incorreta"
              className={inputClass}
              value={newCaseData.title}
              onChange={(e) => setNewCaseData({ ...newCaseData, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prioridade</label>
              <div className="relative">
                <select
                  className={`${inputClass} appearance-none pr-10`}
                  value={newCaseData.priority}
                  onChange={(e) => setNewCaseData({ ...newCaseData, priority: e.target.value as Priority })}
                >
                  {Object.values(Priority).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Responsável</label>
              <div className="relative">
                <select
                  className={`${inputClass} appearance-none pr-10`}
                  value={newCaseData.assignedTo}
                  onChange={(e) => setNewCaseData({ ...newCaseData, assignedTo: e.target.value })}
                >
                  <option value="">Selecione um responsável</option>
                  {users.filter(u => u.username !== 'root').map(user => (
                    <option key={user.id} value={user.username}>{user.username}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tempo Estimado (HH:MM)</label>
            <input
              type="time"
              className={`${inputClass} dark:[color-scheme:dark]`}
              value={newCaseData.estimatedTime}
              onChange={(e) => setNewCaseData({ ...newCaseData, estimatedTime: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pré-condições</label>
              <textarea
                placeholder="O que precisa existir antes?"
                className={`${inputClass} h-24 resize-none`}
                value={newCaseData.preconditions}
                onChange={(e) => setNewCaseData({ ...newCaseData, preconditions: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Resultado Esperado</label>
              <textarea
                placeholder="O que deve acontecer?"
                className={`${inputClass} h-24 resize-none`}
                value={newCaseData.expected}
                onChange={(e) => setNewCaseData({ ...newCaseData, expected: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Passos de Execução</label>
            <textarea
              placeholder="1. Acessar a tela X&#10;2. Clicar em Y"
              className={`${inputClass} h-32 resize-none`}
              value={newCaseData.steps}
              onChange={(e) => setNewCaseData({ ...newCaseData, steps: e.target.value })}
            />
          </div>
          <div className="flex justify-end pt-4 space-x-3">
            <Button variant="ghost" onClick={() => setIsCaseModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveCase}>{editingCaseId ? "Salvar Alterações" : "Adicionar Caso"}</Button>
          </div>
        </div>
      </Modal>

      {/* AI Generator Modal */}
      <Modal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} title="Gerar com Inteligência Artificial">
        <div className="space-y-4">
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg p-4 flex items-start">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-3 mt-1" />
            <p className="text-sm text-purple-800 dark:text-purple-300">
              Descreva a funcionalidade e a IA criará automaticamente casos de teste detalhados com passos e resultados esperados.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição da Funcionalidade</label>
            <textarea
              placeholder="Ex: O sistema deve permitir upload de múltiplos arquivos PDF na tela de cadastro, limitando a 5MB por arquivo..."
              className={`${inputClass} h-32 resize-none focus:ring-purple-500`}
              value={aiFeatureDesc}
              onChange={(e) => setAiFeatureDesc(e.target.value)}
            />
          </div>
          <div className="flex justify-end pt-4 space-x-3">
            <Button variant="ghost" onClick={() => setIsAIModalOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleGenerateCases}
              disabled={!aiFeatureDesc}
              className="bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
              isLoading={isGenerating}
            >
              Gerar Casos
            </Button>
          </div>
        </div>
      </Modal> {/* Closing tag for AI Generator Modal */}

      {/* Replicate Cases Modal */}
      <Modal isOpen={isReplicateModalOpen} onClose={() => setIsReplicateModalOpen(false)} title="Importar Casos de Teste">
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 flex items-start">
            <ArrowDownToLine className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-1" />
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Selecione um plano de origem para copiar todos os seus casos de teste para o plano atual.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Plano de Origem</label>
            <div className="relative">
              <select
                className={`${inputClass} appearance-none pr-10`}
                value={sourcePlanId}
                onChange={(e) => setSourcePlanId(e.target.value)}
              >
                <option value="">Selecione um plano...</option>
                {plans.filter(p => p.id !== selectedPlanId).map(plan => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-slate-500">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4 space-x-3">
            <Button variant="ghost" onClick={() => setIsReplicateModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleReplicateCases} disabled={!sourcePlanId}>Importar Casos</Button>
          </div>
        </div>
      </Modal>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  );
};