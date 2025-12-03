import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { useAuth } from '../contexts/AuthContext';
import { Version, Status, Script } from '../types';
import { Button } from './Button';
import { Modal } from './Modal';
import { Plus, Calendar, FileText, Pencil, Trash2, Save, Code, ChevronDown, ChevronRight, Eye, Download, Search, ChevronLeft, Copy, Check, Folder, FolderOpen } from 'lucide-react';
import { apiService } from '../services/apiService';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/themes/prism-tomorrow.css';
import { useLayout } from '../contexts/LayoutContext';
import { useToast } from '../contexts/ToastContext';
import { ConfirmModal } from './ConfirmModal';

interface VersionControlProps {
  versions: Version[];
  setVersions: React.Dispatch<React.SetStateAction<Version[]>>;
}

export const VersionControl: React.FC<VersionControlProps> = ({ versions, setVersions }) => {
  // Modals State
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [isEditScriptModalOpen, setIsEditScriptModalOpen] = useState(false);

  // Dropdown State
  const [statusMenuOpenId, setStatusMenuOpenId] = useState<string | null>(null);
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);

  // Form State
  const [newVersionNum, setNewVersionNum] = useState('');
  const [newVersionDesc, setNewVersionDesc] = useState('');
  const [newVersionScripts, setNewVersionScripts] = useState<Script[]>([]);
  const [editingVersion, setEditingVersion] = useState<Version | null>(null);

  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [newScriptName, setNewScriptName] = useState('');
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set()); // New state for folders
  const [newScriptFolder, setNewScriptFolder] = useState(''); // State for new script folder

  // Search and Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Script Editing State
  const [editingScript, setEditingScript] = useState<{ versionId: string, script: Script } | null>(null);
  const [scriptContent, setScriptContent] = useState('');
  const [pendingScripts, setPendingScripts] = useState<Script[]>([]);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Standard Input Styles
  const inputClass = "w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors";
  const { showToast } = useToast();
  const { setIsCollapsed } = useLayout();
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

  // useEffect(() => {
  //   if (versions.length > 0) {
  //     setExpandedVersions(new Set([versions[0].id]));
  //   }
  // }, [versions]);

  // Filter and Pagination Logic
  const filteredVersions = versions.filter(version =>
    version.versionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    version.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredVersions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentVersions = filteredVersions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // --- Handlers ---

  const handleCreateVersion = async () => {
    if (!newVersionNum) return;

    try {
      if (editingVersion) {
        const updatedVersion = {
          ...editingVersion,
          versionNumber: newVersionNum,
          description: newVersionDesc
        };
        await apiService.updateVersion(updatedVersion);
        setVersions(prev => prev.map(v => v.id === editingVersion.id ? updatedVersion : v));
      } else {
        const newVersion = await apiService.createVersion({
          versionNumber: newVersionNum,
          releaseDate: new Date().toLocaleDateString('pt-BR'),
          status: Status.PENDING,
          description: newVersionDesc || 'Nova versão criada.',
          scripts: newVersionScripts
        });
        setVersions([newVersion, ...versions]);
      }

      setNewVersionScripts([]);
      setEditingVersion(null);
      setIsVersionModalOpen(false);
      showToast({ message: editingVersion ? 'Versão atualizada com sucesso!' : 'Versão criada com sucesso!', type: 'success' });
    } catch (error) {
      showToast({ message: 'Erro ao salvar versão', type: 'error' });
    }
  };

  const openEditVersion = (version: Version) => {
    setEditingVersion(version);
    setNewVersionNum(version.versionNumber);
    setNewVersionDesc(version.description);
    setIsVersionModalOpen(true);
  };

  const handleDeleteVersion = (id: string) => {
    const versionToDelete = versions.find(v => v.id === id);
    if (!versionToDelete) return;

    setConfirmModal({
      isOpen: true,
      title: 'Excluir Versão',
      message: `Tem certeza que deseja excluir a versão "${versionToDelete.versionNumber}" e todos os seus scripts?`,
      onConfirm: () => {
        // Optimistic update
        setVersions(prev => prev.filter(v => v.id !== id));

        showToast({
          message: 'Versão excluída.',
          type: 'error',
          duration: 5000,
          onUndo: () => {
            setVersions(prev => [...prev, versionToDelete]);
          },
          onCommit: async () => {
            try {
              await apiService.deleteVersion(id);
            } catch (error) {
              showToast({ message: 'Erro ao excluir versão permanentemente', type: 'error' });
              setVersions(prev => [...prev, versionToDelete]);
            }
          }
        });
      }
    });
  };

  const handleUpdateStatus = async (versionId: string, newStatus: Status) => {
    const version = versions.find(v => v.id === versionId);
    if (!version) return;

    const updatedVersion = { ...version, status: newStatus };
    try {
      await apiService.updateVersion(updatedVersion);
      setVersions(prev => prev.map(v => v.id === versionId ? updatedVersion : v));
      setStatusMenuOpenId(null);
    } catch (error) {
      showToast({ message: 'Erro ao atualizar status', type: 'error' });
    }
  };

  const toggleVersion = (id: string) => {
    setExpandedVersions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const openAddScriptModal = (versionId: string, folderName?: string) => {
    setSelectedVersionId(versionId);
    setNewScriptName('');
    setNewScriptFolder(folderName || ''); // Set folder if provided
    setScriptContent('');
    setPendingScripts([]);
    setIsScriptModalOpen(true);
  };

  const handleAddScript = async () => {
    if ((!newScriptName && pendingScripts.length === 0) || !selectedVersionId) return;

    const version = versions.find(v => v.id === selectedVersionId);
    if (!version) return;

    const scriptsToAdd: Script[] = pendingScripts.map(s => ({
      ...s,
      folder: newScriptFolder || undefined
    }));

    if (newScriptName) {
      scriptsToAdd.push({
        id: Date.now().toString(),
        name: newScriptName,
        type: newScriptName.endsWith('.sql') ? 'SQL' : 'Shell',
        content: scriptContent || '-- Digite seu código aqui...',
        folder: newScriptFolder || undefined // Add folder
      });
    }

    const updatedVersion = {
      ...version,
      scripts: [...version.scripts, ...scriptsToAdd]
    };

    try {
      await apiService.updateVersion(updatedVersion);
      setVersions(prev => prev.map(v => v.id === selectedVersionId ? updatedVersion : v));
      setIsScriptModalOpen(false);
      showToast({ message: `${scriptsToAdd.length} script(s) adicionado(s) com sucesso!`, type: 'success' });
    } catch (error) {
      showToast({ message: 'Erro ao adicionar scripts', type: 'error' });
    }
  };

  const openEditScript = (versionId: string, script: Script) => {
    setEditingScript({ versionId, script });
    setScriptContent(script.content);
    setNewScriptFolder(script.folder || ''); // Set folder for editing
    setIsReadOnly(false);
    setIsEditScriptModalOpen(true);
    setIsCollapsed(true);
  };

  const openViewScript = (versionId: string, script: Script) => {
    setEditingScript({ versionId, script });
    setScriptContent(script.content);
    setIsReadOnly(true);
    setIsEditScriptModalOpen(true);
    setIsCollapsed(true);
  };

  const handleDownloadScript = (script: Script) => {
    const blob = new Blob([script.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = script.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveScript = async () => {
    if (!editingScript) return;

    const version = versions.find(v => v.id === editingScript.versionId);
    if (!version) return;

    const updatedScripts = version.scripts.map(s => {
      if (s.id === editingScript.script.id) {
        return { ...s, content: scriptContent, folder: newScriptFolder || undefined };
      }
      return s;
    });

    const updatedVersion = { ...version, scripts: updatedScripts };

    try {
      await apiService.updateVersion(updatedVersion);
      setVersions(prev => prev.map(v => v.id === editingScript.versionId ? updatedVersion : v));
      setIsEditScriptModalOpen(false);
      setIsCollapsed(false);
      showToast({ message: 'Script salvo com sucesso!', type: 'success' });
    } catch (error) {
      showToast({ message: 'Erro ao salvar script', type: 'error' });
    }
  };

  const handleDeleteScript = (versionId: string, scriptId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (!version) return;

    const scriptToDelete = version.scripts.find(s => s.id === scriptId);
    if (!scriptToDelete) return;

    setConfirmModal({
      isOpen: true,
      title: 'Remover Script',
      message: `Tem certeza que deseja remover o script "${scriptToDelete.name}"?`,
      onConfirm: () => {
        // Optimistic update
        const updatedScripts = version.scripts.filter(s => s.id !== scriptId);
        const updatedVersion = { ...version, scripts: updatedScripts };
        setVersions(prev => prev.map(v => v.id === versionId ? updatedVersion : v));

        showToast({
          message: 'Script removido.',
          type: 'error',
          duration: 5000,
          onUndo: () => {
            const restoredScripts = [...version.scripts]; // Original scripts
            const restoredVersion = { ...version, scripts: restoredScripts };
            setVersions(prev => prev.map(v => v.id === versionId ? restoredVersion : v));
          },
          onCommit: async () => {
            try {
              await apiService.updateVersion(updatedVersion);
            } catch (error) {
              showToast({ message: 'Erro ao remover script permanentemente', type: 'error' });
              // Restore
              const restoredScripts = [...version.scripts];
              const restoredVersion = { ...version, scripts: restoredScripts };
              setVersions(prev => prev.map(v => v.id === versionId ? restoredVersion : v));
            }
          }
        });
      }
    });
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Clipboard API failed, trying fallback:', err);
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;

        // Ensure it's not visible but part of the DOM
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
        return false;
      }
    }
  };

  const handleCopyScript = async (scriptContent: string, scriptId: string) => {
    const success = await copyToClipboard(scriptContent);

    if (success) {
      setCopiedScriptId(scriptId);
      showToast({ message: 'Script copiado para a área de transferência!', type: 'success' });
      setTimeout(() => setCopiedScriptId(null), 2000);
    } else {
      showToast({ message: 'Erro ao copiar script. Por favor, copie manualmente.', type: 'error' });
    }
  };

  const handleDownloadVersion = async (version: Version) => {
    try {
      const zip = new JSZip();

      // Add scripts to zip
      version.scripts.forEach(script => {
        if (script.folder) {
          // Create folder if it doesn't exist (JSZip handles this automatically by path)
          zip.folder(script.folder)?.file(script.name, script.content);
        } else {
          zip.file(script.name, script.content);
        }
      });

      // Generate zip file
      const blob = await zip.generateAsync({ type: 'blob' });

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `version-${version.versionNumber}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast({ message: 'Download da versão iniciado!', type: 'success' });
    } catch (error) {
      console.error('Error downloading version:', error);
      showToast({ message: 'Erro ao gerar arquivo zip da versão.', type: 'error' });
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.COMPLETED: return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      case Status.FAILED: return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  // Helper to group scripts by folder
  const groupScriptsByFolder = (scripts: Script[]) => {
    const folders: { [key: string]: Script[] } = {};
    const rootScripts: Script[] = [];

    scripts.forEach(script => {
      if (script.folder) {
        if (!folders[script.folder]) {
          folders[script.folder] = [];
        }
        folders[script.folder].push(script);
      } else {
        rootScripts.push(script);
      }
    });

    return { folders, rootScripts };
  };

  return (
    <div className="space-y-6">
      {/* Backdrop for closing dropdowns */}
      {statusMenuOpenId && (
        <div
          className="fixed inset-0 z-10 bg-transparent"
          onClick={() => setStatusMenuOpenId(null)}
        />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Versões & Scripts</h1>
          <p className="text-slate-500 dark:text-slate-400">Gerencie releases e scripts de banco/ambiente.</p>
        </div>
        {!isViewer && !isSupport && (
          <Button onClick={() => {
            setEditingVersion(null);
            setNewVersionNum('');
            setNewVersionDesc('');
            setNewVersionScripts([]);
            setIsVersionModalOpen(true);
          }} className="w-full md:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Nova Versão
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar versão..."
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-700 dark:text-slate-200"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:gap-6">
        {currentVersions.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            Nenhuma versão encontrada.
          </div>
        ) : (
          currentVersions.map(version => (
            <div
              key={version.id}
              className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-all hover:shadow-md relative ${statusMenuOpenId === version.id ? 'z-30' : 'z-0 overflow-hidden'
                }`}
            >
              <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start gap-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-t-xl">
                <div className="flex items-center space-x-4 w-full md:w-auto">
                  <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2.5 rounded-xl flex-shrink-0">
                    <GitBranchIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleVersion(version.id)}>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">v{version.versionNumber}</h3>
                      {expandedVersions.has(version.id) ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mt-1">
                      <Calendar className="w-3.5 h-3.5 mr-1.5" />
                      {version.releaseDate}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full md:w-auto gap-4">
                  {/* Status Dropdown */}
                  <div className="relative z-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isViewer) {
                          setStatusMenuOpenId(statusMenuOpenId === version.id ? null : version.id);
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:brightness-95 active:scale-95 ${getStatusColor(version.status)} ${isViewer ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      {version.status}
                      {!isViewer && <ChevronDown className={`w-3 h-3 opacity-70 transition-transform ${statusMenuOpenId === version.id ? 'rotate-180' : ''}`} />}
                    </button>

                    {statusMenuOpenId === version.id && (
                      <div className="absolute right-0 md:right-0 left-0 md:left-auto mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                        <div className="py-1">
                          {Object.values(Status).map((status) => (
                            <button
                              key={status}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(version.id, status);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm flex items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${version.status === status
                                ? 'text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50/50 dark:bg-indigo-900/10'
                                : 'text-slate-700 dark:text-slate-200'
                                }`}
                            >
                              <span className={`w-2 h-2 rounded-full mr-2 ${status === Status.COMPLETED ? 'bg-green-500' :
                                status === Status.FAILED ? 'bg-red-500' :
                                  status === Status.IN_PROGRESS ? 'bg-blue-500' :
                                    'bg-yellow-500'
                                }`}></span>
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {!isViewer && !isSupport && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditVersion(version); }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                        title="Editar Versão"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {!isSupport && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteVersion(version.id); }}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                          title="Excluir Versão"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                    </div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownloadVersion(version); }}
                    className="p-1.5 text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                    title="Baixar Versão Completa (.zip)"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>



              {
                expandedVersions.has(version.id) && (
                  <div className="p-6">
                    <div className="mb-4">
                      <p className="text-sm text-slate-600 dark:text-slate-300">{version.description}</p>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Scripts Vinculados</h4>
                      {!isViewer && !isSupport && (
                        <Button variant="ghost" size="sm" onClick={() => openAddScriptModal(version.id)} className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
                          <Plus className="w-3.5 h-3.5 mr-1.5" /> Adicionar
                        </Button>
                      )}
                    </div>

                    {version.scripts.length === 0 ? (
                      <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                        <p className="text-slate-400 text-sm">Nenhum script vinculado.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Render Folders */}
                        {Object.entries(groupScriptsByFolder(version.scripts).folders).map(([folderName, folderScripts]) => (
                          <div key={folderName} className="border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden relative">
                            <div
                              className="flex items-center px-3 py-2 bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              onClick={() => toggleFolder(`${version.id}-${folderName}`)}
                            >
                              {expandedFolders.has(`${version.id}-${folderName}`) ? (
                                <FolderOpen className="w-4 h-4 text-indigo-500 mr-2" />
                              ) : (
                                <Folder className="w-4 h-4 text-indigo-500 mr-2" />
                              )}
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-1">{folderName}</span>
                              <span className="text-xs text-slate-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 mr-2">
                                {folderScripts.length}
                              </span>

                              {!isViewer && !isSupport && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openAddScriptModal(version.id, folderName);
                                  }}
                                  className="p-1 mr-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                                  title="Adicionar arquivo nesta pasta"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              )}

                              {expandedFolders.has(`${version.id}-${folderName}`) ? (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              )}
                            </div>

                            {expandedFolders.has(`${version.id}-${folderName}`) && (
                              <ul className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800">
                                {folderScripts.map(script => (
                                  <li key={script.id} className="group flex items-center justify-between p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors pl-8">
                                    <div className="flex items-center min-w-0 flex-1 mr-2">
                                      <div className="mr-3 p-1.5 bg-slate-50 dark:bg-slate-800 rounded text-slate-500 flex-shrink-0">
                                        <FileText className="w-4 h-4" />
                                      </div>
                                      <div className="min-w-0">
                                        <span className="font-mono text-sm font-medium text-slate-700 dark:text-slate-200 block truncate" title={script.name}>{script.name}</span>
                                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded inline-block mt-0.5">{script.type}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center flex-shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity space-x-1">
                                      {!isViewer && !isSupport && (
                                        <button
                                          onClick={() => openEditScript(version.id, script)}
                                          className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                                          title="Editar"
                                        >
                                          <Pencil className="w-4 h-4" />
                                        </button>
                                      )}
                                      <button
                                        onClick={() => openViewScript(version.id, script)}
                                        className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                                        title="Visualizar"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDownloadScript(script)}
                                        className="p-2 text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                                        title="Baixar"
                                      >
                                        <Download className="w-4 h-4" />
                                      </button>
                                      {!isViewer && !isSupport && (
                                        <button
                                          onClick={() => handleDeleteScript(version.id, script.id)}
                                          className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}

                        {/* Render Root Scripts */}
                        {groupScriptsByFolder(version.scripts).rootScripts.length > 0 && (
                          <ul className="space-y-2">
                            {groupScriptsByFolder(version.scripts).rootScripts.map(script => (
                              <li key={script.id} className="group flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-sm transition-all">
                                <div className="flex items-center min-w-0 flex-1 mr-2">
                                  <div className="mr-3 p-1.5 bg-slate-50 dark:bg-slate-800 rounded text-slate-500 flex-shrink-0">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-mono text-sm font-medium text-slate-700 dark:text-slate-200 block truncate" title={script.name}>{script.name}</span>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded inline-block mt-0.5">{script.type}</span>
                                  </div>
                                </div>
                                <div className="flex items-center flex-shrink-0 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity space-x-1">
                                  {!isViewer && !isSupport && (
                                    <button
                                      onClick={() => openEditScript(version.id, script)}
                                      className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors"
                                      title="Editar"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => openViewScript(version.id, script)}
                                    className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors"
                                    title="Visualizar"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDownloadScript(script)}
                                    className="p-2 text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md transition-colors"
                                    title="Baixar"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                  {!isViewer && !isSupport && (
                                    <button
                                      onClick={() => handleDeleteScript(version.id, script.id)}
                                      className="p-2 text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                )
              }
            </div>
          )))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <Button
            variant="ghost"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Anterior
          </Button>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="ghost"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="disabled:opacity-50"
          >
            Próximo <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* New/Edit Version Modal */}
      <Modal isOpen={isVersionModalOpen} onClose={() => setIsVersionModalOpen(false)} title={editingVersion ? "Editar Versão" : "Nova Versão"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Número da Versão</label>
            <input
              type="text"
              placeholder="Ex: 2.0.1"
              className={inputClass}
              value={newVersionNum}
              onChange={(e) => setNewVersionNum(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
            <textarea
              placeholder="O que há de novo nesta versão?"
              className={`${inputClass} h-24 resize-none`}
              value={newVersionDesc}
              onChange={(e) => setNewVersionDesc(e.target.value)}
            />
          </div>

          {!editingVersion && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Anexar Scripts (Opcional)</label>
              <input
                type="file"
                multiple
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/30 dark:file:text-indigo-400"
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files || files.length === 0) return;

                  const uploadedScripts: Script[] = [];
                  for (let i = 0; i < files.length; i++) {
                    try {
                      const result = await apiService.uploadScript(files[i]);
                      uploadedScripts.push({
                        id: Date.now().toString() + i,
                        name: result.originalName,
                        type: result.originalName.endsWith('.sql') ? 'SQL' : 'Shell',
                        content: result.content
                      });
                    } catch (error) {
                      console.error('Failed to upload', files[i].name);
                    }
                  }
                  setNewVersionScripts([...newVersionScripts, ...uploadedScripts]);
                }}
              />
              {newVersionScripts.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {newVersionScripts.map((script, index) => (
                    <li key={index} className="text-xs flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2 rounded">
                      <span className="font-mono text-slate-700 dark:text-slate-300">{script.name}</span>
                      <button
                        onClick={() => setNewVersionScripts(newVersionScripts.filter((_, i) => i !== index))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <div className="flex justify-end pt-4 space-x-3">
            <Button variant="ghost" onClick={() => setIsVersionModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateVersion}>{editingVersion ? 'Salvar Alterações' : 'Criar Versão'}</Button>
          </div>
        </div>
      </Modal>

      {/* Add Script Modal */}
      <Modal isOpen={isScriptModalOpen} onClose={() => setIsScriptModalOpen(false)} title="Adicionar Script">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Upload de Arquivo (Opcional)</label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                multiple
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/30 dark:file:text-indigo-400"
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files || files.length === 0) return;

                  // If single file, behave as before (populate fields)
                  if (files.length === 1 && pendingScripts.length === 0) {
                    try {
                      const result = await apiService.uploadScript(files[0]);
                      setNewScriptName(result.originalName);
                      setScriptContent(result.content);
                    } catch (error) {
                      showToast({ message: 'Erro ao fazer upload do arquivo', type: 'error' });
                    }
                  } else {
                    // Bulk upload
                    const newPending: Script[] = [];
                    for (let i = 0; i < files.length; i++) {
                      try {
                        const result = await apiService.uploadScript(files[i]);
                        newPending.push({
                          id: Date.now().toString() + i,
                          name: result.originalName,
                          type: result.originalName.endsWith('.sql') ? 'SQL' : 'Shell',
                          content: result.content
                        });
                      } catch (error) {
                        console.error('Failed to upload', files[i].name);
                      }
                    }
                    setPendingScripts([...pendingScripts, ...newPending]);
                    // Clear manual fields if switching to bulk mode to avoid confusion, 
                    // or keep them if user wants to mix. Let's keep them but maybe user will clear them.
                    // Actually, if I upload multiple, I probably don't want the first one to also populate the manual fields if I already added it to pending.
                    // But here I added ALL to pending. So I should clear manual fields.
                    setNewScriptName('');
                    setScriptContent('');
                  }
                }}
              />
            </div>
            {pendingScripts.length > 0 && (
              <ul className="mt-3 space-y-2 max-h-40 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-lg p-2">
                {pendingScripts.map((script, index) => (
                  <li key={index} className="text-xs flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-2 rounded">
                    <div className="flex items-center">
                      <FileText className="w-3 h-3 mr-2 text-slate-400" />
                      <span className="font-mono text-slate-700 dark:text-slate-300">{script.name}</span>
                    </div>
                    <button
                      onClick={() => setPendingScripts(pendingScripts.filter((_, i) => i !== index))}
                      className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-300 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 bg-white dark:bg-slate-900 text-xs text-slate-500">OU</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pasta (Opcional)</label>
            <input
              type="text"
              placeholder="Ex: Tabelas, Migrations..."
              className={inputClass}
              value={newScriptFolder}
              onChange={(e) => setNewScriptFolder(e.target.value)}
              list="folder-suggestions"
            />
            <datalist id="folder-suggestions">
              {Array.from(new Set(versions.flatMap(v => v.scripts.map(s => s.folder).filter(Boolean)))).map(folder => (
                <option key={folder} value={folder} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Arquivo</label>
            <input
              type="text"
              placeholder="Ex: migration_v2.sql ou deploy.sh"
              className={`${inputClass} font-mono text-sm`}
              value={newScriptName}
              onChange={(e) => setNewScriptName(e.target.value)}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">A extensão (.sql, .sh) define o tipo automaticamente.</p>
          </div>
          <div className="flex justify-end pt-4 space-x-3">
            <Button variant="ghost" onClick={() => setIsScriptModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddScript}>Adicionar {pendingScripts.length > 0 ? `(${pendingScripts.length + (newScriptName ? 1 : 0)})` : ''}</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Script Modal */}
      <Modal isOpen={isEditScriptModalOpen} onClose={() => { setIsEditScriptModalOpen(false); setIsCollapsed(false); }} title={isReadOnly ? "Visualizar Script" : "Editor de Script"} size="xl">
        <div className="flex flex-col h-[60vh]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md">
              <FileText className="w-4 h-4 mr-2" />
              {editingScript?.script.name}
            </div>
            <div className="flex items-center gap-2">
              {!isReadOnly && (
                <div className="w-48">
                  <input
                    type="text"
                    placeholder="Pasta..."
                    className="w-full px-3 py-1 text-sm bg-slate-100 dark:bg-slate-800 border-none rounded-md focus:ring-1 focus:ring-indigo-500"
                    value={newScriptFolder}
                    onChange={(e) => setNewScriptFolder(e.target.value)}
                    list="edit-folder-suggestions"
                  />
                  <datalist id="edit-folder-suggestions">
                    {Array.from(new Set(versions.flatMap(v => v.scripts.map(s => s.folder).filter(Boolean)))).map(folder => (
                      <option key={folder} value={folder} />
                    ))}
                  </datalist>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyScript(scriptContent, editingScript?.script.id || '')}
                className="text-slate-500 hover:text-indigo-600"
              >
                {copiedScriptId === editingScript?.script.id ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                {copiedScriptId === editingScript?.script.id ? 'Copiado!' : 'Copiar'}
              </Button>
            </div>
          </div>
          <div className="flex-1 border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden flex flex-col bg-[#2d2d2d]">
            <div className="bg-slate-800 text-slate-300 px-4 py-2 text-xs flex items-center font-mono">
              <Code className="w-3 h-3 mr-2" /> CODE EDITOR
            </div>
            <div className="flex-1 overflow-auto">
              <Editor
                value={scriptContent}
                onValueChange={code => !isReadOnly && setScriptContent(code)}
                highlight={code => {
                  const isSql = editingScript?.script.name.endsWith('.sql');
                  return highlight(code, isSql ? languages.sql : languages.bash, isSql ? 'sql' : 'bash');
                }}
                padding={20}
                style={{
                  fontFamily: '"Fira code", "Fira Mono", monospace',
                  fontSize: 14,
                  backgroundColor: '#2d2d2d',
                  color: '#f8f8f2',
                  minHeight: '100%'
                }}
                className="min-h-full"
              />
            </div>
          </div>
          <div className="flex justify-end pt-6 space-x-3">
            <Button variant="ghost" onClick={() => { setIsEditScriptModalOpen(false); setIsCollapsed(false); }}>{isReadOnly ? 'Fechar' : 'Descartar'}</Button>
            {!isReadOnly && (
              <Button onClick={handleSaveScript}>
                <Save className="w-4 h-4 mr-2" /> Salvar Alterações
              </Button>
            )}
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
    </div >
  );
};

const GitBranchIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>
);