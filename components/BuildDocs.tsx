import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BuildDoc } from '../types';
import { Button } from './Button';
import { Modal } from './Modal';
import { improveBuildDoc } from '../services/geminiService';
import { Wand2, Save, FileCode, Plus, LayoutTemplate, Trash2, Pencil, Search, ChevronLeft, Loader2, FileText } from 'lucide-react';
import { apiService } from '../services/apiService';
import { RichTextEditor } from './RichTextEditor';
import { useToast } from '../contexts/ToastContext';
import { ConfirmModal } from './ConfirmModal';

interface BuildDocsProps {
  docs: BuildDoc[];
  setDocs: React.Dispatch<React.SetStateAction<BuildDoc[]>>;
}

export const BuildDocs: React.FC<BuildDocsProps> = ({ docs, setDocs }) => {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(docs[0]?.id || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [newSystemName, setNewSystemName] = useState('');
  const [renameSystemName, setRenameSystemName] = useState('');
  const [docToRenameId, setDocToRenameId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // New states for mobile UX
  const [mobileView, setMobileView] = useState<'list' | 'content'>('list');
  const [isEditing, setIsEditing] = useState(false);
  const [contentSearchTerm, setContentSearchTerm] = useState(''); // New state for content search
  const contentRef = useRef<HTMLDivElement>(null); // Ref for content container

  const { showToast } = useToast();
  const { user } = useAuth();
  const isViewer = user?.role === 'Viewer';
  const isSupport = user?.role === 'Support';

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  const selectedDoc = docs.find(d => d.id === selectedDocId);

  useEffect(() => {
    // If on mobile and a doc is selected, switch to content view
    if (selectedDocId && window.innerWidth < 768) {
      setMobileView('content');
    }
  }, [selectedDocId]);

  const filteredDocs = docs.filter(doc =>
    doc.system.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inputClass = "w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors";

  const handleImproveContent = async () => {
    if (!selectedDoc) return;
    setIsGenerating(true);
    try {
      const improved = await improveBuildDoc(selectedDoc.content);
      // Just update local state for preview, user must click save to persist
      updateDocContentLocal(improved);
      setIsEditing(true); // Auto-enable edit mode
      showToast({ message: 'Conteúdo melhorado com IA!', type: 'success' });
    } catch (error) {
      showToast({ message: "Erro ao melhorar documentação. Verifique a API Key.", type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const updateDocContentLocal = (newContent: string) => {
    if (!selectedDocId) return;
    setDocs(prev => prev.map(d => d.id === selectedDocId ? { ...d, content: newContent } : d));
  };

  const handleSaveDoc = async () => {
    if (!selectedDoc) return;
    try {
      await apiService.updateDoc(selectedDoc);
      setIsEditing(false);
      showToast({ message: 'Documento salvo com sucesso!', type: 'success' });
    } catch (error) {
      showToast({ message: 'Erro ao salvar documento', type: 'error' });
    }
  };

  const handleCreateDoc = async () => {
    if (!newSystemName) return;
    try {
      const newDoc = await apiService.createDoc({
        system: newSystemName,
        title: `Build Process - ${newSystemName}`,
        content: `# Build Process: ${newSystemName}\n\n## Pré-requisitos\n- Node.js v18+\n\n## Instalação\n1. Checkout code\n2. Run npm install\n\n## Build\nExecute \`npm run build\` para gerar os artefatos.`,
        lastUpdated: new Date().toLocaleDateString('pt-BR')
      });
      setDocs([...docs, newDoc]);
      setSelectedDocId(newDoc.id);
      setIsCreateModalOpen(false);
      setNewSystemName('');
      setMobileView('content'); // Switch to content view on mobile
      setIsEditing(true); // Start in edit mode
      showToast({ message: 'Documento criado com sucesso!', type: 'success' });
    } catch (error) {
      showToast({ message: 'Erro ao criar documento', type: 'error' });
    }
  };

  const handleDeleteDoc = (docId: string, systemName: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const docToDelete = docs.find(d => d.id === docId);
    if (!docToDelete) return;

    setConfirmModal({
      isOpen: true,
      title: 'Excluir Documento',
      message: `Tem certeza que deseja excluir a documentação de "${systemName}"?`,
      onConfirm: () => {
        // Optimistic update
        const newDocs = docs.filter(d => d.id !== docId);
        setDocs(newDocs);
        if (selectedDocId === docId) {
          setSelectedDocId(newDocs[0]?.id || null);
          setMobileView('list'); // Go back to list if current doc is deleted
        }

        showToast({
          message: 'Documento excluído.',
          type: 'error',
          duration: 5000,
          onUndo: () => {
            setDocs(prev => [...prev, docToDelete]);
            if (selectedDocId === null) setSelectedDocId(docId);
          },
          onCommit: async () => {
            try {
              await apiService.deleteDoc(docId);
            } catch (error) {
              showToast({ message: 'Erro ao excluir documento permanentemente', type: 'error' });
              setDocs(prev => [...prev, docToDelete]);
            }
          }
        });
      }
    });
  };

  const openRenameModal = (docId: string, systemName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenameSystemName(systemName);
    setDocToRenameId(docId);
    setIsRenameModalOpen(true);
  };

  const handleRenameDoc = async () => {
    if (!docToRenameId || !renameSystemName) return;
    const docToRename = docs.find(d => d.id === docToRenameId);
    if (!docToRename) return;

    try {
      const updatedDoc = {
        ...docToRename,
        system: renameSystemName,
        title: `Build Process - ${renameSystemName}` // Assuming we want to keep this pattern
      };
      await apiService.updateDoc(updatedDoc); // Use original service
      setDocs(prev => prev.map(d => d.id === docToRenameId ? updatedDoc : d));
      if (selectedDocId === docToRenameId) {
        setSelectedDocId(updatedDoc.id); // Update selectedDocId if it's the one being renamed
      }
      setIsRenameModalOpen(false);
      setDocToRenameId(null);
      showToast({ message: 'Documento renomeado com sucesso!', type: 'success' });
    } catch (error) {
      showToast({ message: 'Erro ao renomear documento', type: 'error' });
    }
  };

  const highlightContent = (content: string, term: string) => {
    if (!term) return content;
    const regex = new RegExp(`(${term})`, 'gi');
    return content.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900/50 text-slate-900 dark:text-slate-100 rounded px-0.5">$1</mark>');
  };

  // Auto-scroll to first match
  useEffect(() => {
    if (contentSearchTerm && contentRef.current) {
      // Small timeout to allow DOM to update with highlights
      setTimeout(() => {
        const firstMatch = contentRef.current?.querySelector('mark');
        if (firstMatch) {
          firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [contentSearchTerm, selectedDoc]);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">
      {/* Sidebar List */}
      <div className={`${mobileView === 'list' ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-1/4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden`}>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center">
            <LayoutTemplate className="w-4 h-4 mr-2 text-indigo-500" />
            Docs de Build
          </h2>
          {!isViewer && (
            <button onClick={() => setIsCreateModalOpen(true)} className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 p-1.5 rounded-full transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar documentos..."
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-700 dark:text-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {filteredDocs.map(doc => (
            <div
              key={doc.id}
              className={`group w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all border cursor-pointer ${selectedDocId === doc.id
                ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-medium border-indigo-100 dark:border-slate-700 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent'
                }`}
              onClick={() => {
                setSelectedDocId(doc.id);
                setMobileView('content'); // Switch to content view on mobile
              }}
            >
              <div className="flex items-center truncate">
                <FileCode className={`w-4 h-4 mr-3 flex-shrink-0 ${selectedDocId === doc.id ? 'text-indigo-500' : 'text-slate-400'}`} />
                <span className="truncate">{doc.system}</span>
              </div>
              <div className={`flex items-center opacity-0 group-hover:opacity-100 transition-opacity ${selectedDocId === doc.id ? 'opacity-100' : ''}`}>
                {!isViewer && (
                  <>
                    <button
                      onClick={(e) => openRenameModal(doc.id, doc.system, e)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
                      title="Renomear"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {!isSupport && (
                      <button
                        onClick={(e) => handleDeleteDoc(doc.id, doc.system, e)}
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
          ))}
        </div>
      </div>

      {/* Editor Area */}
      <div className={`${mobileView === 'content' ? 'flex' : 'hidden'} md:flex flex-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex-col overflow-hidden relative`}>
        {selectedDoc ? (
          <>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50 dark:bg-slate-800/50 z-10 gap-4 md:gap-0">
              <div className="flex items-center gap-3 min-w-0 w-full md:w-auto">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setMobileView('list')}
                  className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                  <h2 className="font-bold text-slate-900 dark:text-slate-100 truncate text-lg">{selectedDoc.title}</h2>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Última atualização: {selectedDoc.lastUpdated}</p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 items-stretch md:items-center w-full md:w-auto">
                {!isEditing && (
                  <div className="relative mr-2 w-full md:w-auto">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                    <input
                      type="text"
                      placeholder="Buscar no texto..."
                      className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all w-full md:w-40"
                      value={contentSearchTerm}
                      onChange={(e) => setContentSearchTerm(e.target.value)}
                    />
                  </div>
                )}
                <div className="flex space-x-2">
                  {!isViewer && (
                    !isEditing ? (
                      <>
                        <Button
                          onClick={handleImproveContent}
                          variant="secondary"
                          size="sm"
                          isLoading={isGenerating}
                          className="text-purple-600 border-purple-200 hover:bg-purple-50 dark:bg-purple-900/10 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-900/20 h-8 px-3 text-xs"
                        >
                          {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Wand2 className="w-3.5 h-3.5 mr-2" />}
                          Melhorar com IA
                        </Button>
                        <Button size="sm" onClick={() => setIsEditing(true)} className="h-8 px-3 text-xs">
                          <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="h-8 px-3 text-xs">Cancelar</Button>
                        <Button size="sm" onClick={handleSaveDoc} className="h-8 px-3 text-xs">
                          <Save className="w-3.5 h-3.5 mr-2" /> Salvar
                        </Button>
                      </>
                    )
                  )}
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                {isEditing ? (
                  <RichTextEditor
                    key={selectedDoc.id}
                    content={selectedDoc.content || ''}
                    onChange={updateDocContentLocal}
                    className="flex-1 h-full border-0 rounded-none"
                    placeholder="Comece a escrever sua documentação..."
                  />
                ) : (
                  <div ref={contentRef} className="flex-1 h-full prose dark:prose-invert max-w-none p-4 md:p-8 overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: highlightContent(selectedDoc.content, contentSearchTerm) || '<p class="text-slate-400 italic">Nenhum conteúdo ainda...</p>' }} />
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
            <FileCode className="w-16 h-16 mb-4 opacity-20" />
            <p>Selecione um documento ou crie um novo para começar</p>
            {!isViewer && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-6 md:hidden px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium"
              >
                Criar Novo Documento
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Novo Documento de Build">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Sistema</label>
            <input
              type="text"
              placeholder="Ex: API Gateway ou App Mobile"
              className={inputClass}
              value={newSystemName}
              onChange={(e) => setNewSystemName(e.target.value)}
            />
          </div>
          <div className="flex justify-end pt-4 space-x-3">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateDoc}>Criar Documento</Button>
          </div>
        </div>
      </Modal>

      {/* Rename Modal */}
      <Modal isOpen={isRenameModalOpen} onClose={() => setIsRenameModalOpen(false)} title="Renomear Sistema">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Sistema</label>
            <input
              type="text"
              className={inputClass}
              value={renameSystemName}
              onChange={(e) => setRenameSystemName(e.target.value)}
            />
          </div>
          <div className="flex justify-end pt-4 space-x-3">
            <Button variant="ghost" onClick={() => setIsRenameModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleRenameDoc}>Salvar</Button>
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