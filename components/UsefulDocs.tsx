import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UsefulDoc } from '../types';
import { Button } from './Button';
import { Modal } from './Modal';
import { Wand2, Save, FileText, Plus, BookOpen, Trash2, Pencil, MoreVertical, Search, ChevronLeft, Loader2, Upload, FileIcon } from 'lucide-react';
import { apiService } from '../services/apiService';
import { RichTextEditor } from './RichTextEditor';
import { useToast } from '../contexts/ToastContext';
import { ConfirmModal } from './ConfirmModal';
import { improveDocumentation } from '../services/geminiService';

interface UsefulDocsProps {
    docs: UsefulDoc[];
    setDocs: React.Dispatch<React.SetStateAction<UsefulDoc[]>>;
}

export const UsefulDocs: React.FC<UsefulDocsProps> = ({ docs, setDocs }) => {
    const [selectedDocId, setSelectedDocId] = useState<string | null>(docs[0]?.id || null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [newDocTitle, setNewDocTitle] = useState('');
    const [renameDocTitle, setRenameDocTitle] = useState('');
    const [docToRenameId, setDocToRenameId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // New states for mobile UX and features
    const [mobileView, setMobileView] = useState<'list' | 'content'>('list');
    const [isEditing, setIsEditing] = useState(false);
    const [contentSearchTerm, setContentSearchTerm] = useState(''); // New state for content search
    const contentRef = useRef<HTMLDivElement>(null); // Ref for content container
    const [isImproving, setIsImproving] = useState(false);

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
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const inputClass = "w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors";

    const updateDocContentLocal = (newContent: string) => {
        if (!selectedDocId) return;
        setDocs(prev => prev.map(d => d.id === selectedDocId ? { ...d, content: newContent } : d));
    };

    const handleSaveDoc = async () => {
        if (!selectedDoc) return;
        try {
            await apiService.updateUsefulDoc(selectedDoc);
            setIsEditing(false);
            showToast({ message: 'Documento salvo com sucesso!', type: 'success' });
        } catch (error) {
            showToast({ message: 'Erro ao salvar documento', type: 'error' });
        }
    };

    const handleCreateDoc = async () => {
        if (!newDocTitle) return;
        try {
            const newDoc = await apiService.createUsefulDoc({
                title: newDocTitle,
                content: `# ${newDocTitle}\n\nEscreva sua documentação aqui...`,
                lastUpdated: new Date().toLocaleDateString('pt-BR')
            });
            setDocs([...docs, newDoc]);
            setSelectedDocId(newDoc.id);
            setIsCreateModalOpen(false);
            setNewDocTitle('');
            setMobileView('content'); // Switch to content view on mobile
            setIsEditing(true); // Start in edit mode
            showToast({ message: 'Documento criado com sucesso!', type: 'success' });
        } catch (error) {
            showToast({ message: 'Erro ao criar documento', type: 'error' });
        }
    };

    const handleDeleteDoc = (docId: string, docTitle: string, e: React.MouseEvent) => {
        e.stopPropagation();

        const docToDelete = docs.find(d => d.id === docId);
        if (!docToDelete) return;

        setConfirmModal({
            isOpen: true,
            title: 'Excluir Documento',
            message: `Tem certeza que deseja excluir "${docTitle}"?`,
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
                            await apiService.deleteUsefulDoc(docId);
                        } catch (error) {
                            showToast({ message: 'Erro ao excluir documento permanentemente', type: 'error' });
                            setDocs(prev => [...prev, docToDelete]);
                        }
                    }
                });
            }
        });
    };

    const openRenameModal = (docId: string, docTitle: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setRenameDocTitle(docTitle);
        setDocToRenameId(docId);
        setIsRenameModalOpen(true);
    };

    const handleRenameDoc = async () => {
        if (!docToRenameId || !renameDocTitle) return;
        const docToRename = docs.find(d => d.id === docToRenameId);
        if (!docToRename) return;

        try {
            const updatedDoc = { ...docToRename, title: renameDocTitle };
            await apiService.updateUsefulDoc(updatedDoc);
            setDocs(prev => prev.map(d => d.id === docToRenameId ? updatedDoc : d));
            setIsRenameModalOpen(false);
            setDocToRenameId(null);
            showToast({ message: 'Documento renomeado com sucesso!', type: 'success' });
        } catch (error) {
            showToast({ message: 'Erro ao renomear documento', type: 'error' });
        }
    };

    const handleImproveContent = async () => {
        if (!selectedDoc) return;
        setIsImproving(true);
        try {
            const improved = await improveDocumentation(selectedDoc.content);
            updateDocContentLocal(improved);
            setIsEditing(true); // Auto-enable edit mode
            showToast({ message: 'Conteúdo melhorado com IA!', type: 'success' });
        } catch (error) {
            showToast({ message: "Erro ao melhorar documentação.", type: 'error' });
        } finally {
            setIsImproving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:3001/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            // Insert image/file link into content
            const fileLink = `<a href="${data.url}" target="_blank" class="text-indigo-600 hover:underline flex items-center gap-2 my-2"><span class="bg-indigo-50 p-1 rounded"><FileIcon class="w-4 h-4"/></span> ${file.name}</a>`;

            if (selectedDoc) {
                updateDocContentLocal(selectedDoc.content + fileLink);
                setIsEditing(true);
            }
        } catch (error) {
            console.error('Upload failed', error);
            showToast({ message: 'Erro ao fazer upload', type: 'error' });
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
                        <BookOpen className="w-4 h-4 mr-2 text-indigo-500" />
                        Docs Úteis
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
                                setMobileView('content');
                            }}
                        >
                            <div className="flex items-center truncate">
                                <FileText className={`w-4 h-4 mr-3 flex-shrink-0 ${selectedDocId === doc.id ? 'text-indigo-500' : 'text-slate-400'}`} />
                                <span className="truncate">{doc.title}</span>
                            </div>
                            <div className={`flex items-center opacity-0 group-hover:opacity-100 transition-opacity ${selectedDocId === doc.id ? 'opacity-100' : ''}`}>
                                {!isViewer && (
                                    <>
                                        <button
                                            onClick={(e) => openRenameModal(doc.id, doc.title, e)}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
                                            title="Renomear"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        {!isSupport && (
                                            <button
                                                onClick={(e) => handleDeleteDoc(doc.id, doc.title, e)}
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
                                                    isLoading={isImproving}
                                                    className="text-purple-600 border-purple-200 hover:bg-purple-50 dark:bg-purple-900/10 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-900/20 h-8 px-3 text-xs"
                                                >
                                                    {isImproving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Wand2 className="w-3.5 h-3.5 mr-2" />}
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
                        <FileText className="w-16 h-16 mb-4 opacity-20" />
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
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Novo Documento Útil">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título do Documento</label>
                        <input
                            type="text"
                            placeholder="Ex: Procedimentos de Deploy"
                            className={inputClass}
                            value={newDocTitle}
                            onChange={(e) => setNewDocTitle(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end pt-4 space-x-3">
                        <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateDoc}>Criar Documento</Button>
                    </div>
                </div>
            </Modal>

            {/* Rename Modal */}
            <Modal isOpen={isRenameModalOpen} onClose={() => setIsRenameModalOpen(false)} title="Renomear Documento">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Novo Título</label>
                        <input
                            type="text"
                            className={inputClass}
                            value={renameDocTitle}
                            onChange={(e) => setRenameDocTitle(e.target.value)}
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
