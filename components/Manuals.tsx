"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Upload, FileText, Download, Trash2, Share2, File, FileCode, Image as ImageIcon, Folder, FolderPlus, ChevronRight, Home, ArrowLeft, LayoutGrid, List as ListIcon, Eye, X, Link as LinkIcon } from 'lucide-react';
import { apiService } from '../services/apiService';
import { Manual } from '../types';
import { Button } from './Button';
import { Modal } from './Modal';
import { useLayout } from '../contexts/LayoutContext';
import { useToast } from '../contexts/ToastContext';
import { ConfirmModal } from './ConfirmModal';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

export const Manuals: React.FC = () => {
    const [manuals, setManuals] = useState<Manual[]>([]);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null, name: string }[]>([{ id: null, name: 'Início' }]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [previewFile, setPreviewFile] = useState<{ path: string, type: string, name: string } | null>(null);
    const [previewContent, setPreviewContent] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    // New Folder Modal State
    const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [isNewLinkModalOpen, setIsNewLinkModalOpen] = useState(false);
    const [newLinkName, setNewLinkName] = useState('');
    const [newLinkUrl, setNewLinkUrl] = useState('');

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    const { setIsCollapsed } = useLayout();
    const { showToast } = useToast();
    const { user } = useAuth();
    const isViewer = user?.role === 'Viewer';
    const isSupport = user?.role === 'Support';

    useEffect(() => {
        loadManuals(currentFolderId);
    }, [currentFolderId]);

    useEffect(() => {
        if (previewFile) {
            loadPreviewContent();
        } else {
            setPreviewContent(null);
        }
    }, [previewFile]);

    const loadPreviewContent = async () => {
        if (!previewFile) return;
        setIsPreviewLoading(true);
        setPreviewContent(null);

        try {
            const url = `/api/uploads/${previewFile.path}`;

            if (previewFile.type.includes('sheet') || previewFile.type.includes('excel') || previewFile.name.endsWith('.xls') || previewFile.name.endsWith('.xlsx')) {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const html = XLSX.utils.sheet_to_html(worksheet);
                setPreviewContent(html);
            } else if (previewFile.type.includes('word') || previewFile.type.includes('document') || previewFile.name.endsWith('.docx')) {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                const result = await mammoth.convertToHtml({ arrayBuffer });
                setPreviewContent(result.value);
            }
        } catch (error) {
            console.error('Error loading preview:', error);
            setPreviewContent(null);
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const loadManuals = async (parentId: string | null) => {
        try {
            const data = await apiService.getManuals(parentId);
            setManuals(data);
        } catch (error) {
            console.error('Failed to load manuals:', error);
        }
    };


    const handleCreateFolder = async () => {
        if (!newFolderName) return;

        try {
            await apiService.createFolder(newFolderName, currentFolderId);
            await loadManuals(currentFolderId);
            setIsNewFolderModalOpen(false);
            setNewFolderName('');
            showToast({ message: 'Pasta criada com sucesso!', type: 'success' });
        } catch (error) {
            showToast({ message: 'Erro ao criar pasta', type: 'error' });
        }
    };

    const handleCreateLink = async () => {
        if (!newLinkName || !newLinkUrl) return;

        try {
            await apiService.createLink(newLinkName, newLinkUrl, currentFolderId);
            await loadManuals(currentFolderId);
            setIsNewLinkModalOpen(false);
            setNewLinkName('');
            setNewLinkUrl('');
            showToast({ message: 'Link adicionado com sucesso!', type: 'success' });
        } catch (error) {
            showToast({ message: 'Erro ao adicionar link', type: 'error' });
        }
    };

    const handleDelete = (id: string, name: string, isFolder: boolean) => {
        const itemToDelete = manuals.find(m => m.id === id);
        if (!itemToDelete) return;

        setConfirmModal({
            isOpen: true,
            title: isFolder ? 'Excluir Pasta' : 'Excluir Arquivo',
            message: isFolder
                ? `Tem certeza que deseja excluir a pasta "${name}" e todo o seu conteúdo?`
                : `Tem certeza que deseja excluir "${name}"?`,
            onConfirm: () => {
                // Optimistic update
                setManuals(prev => prev.filter(m => m.id !== id));

                showToast({
                    message: isFolder ? 'Pasta excluída.' : 'Arquivo excluído.',
                    type: 'error',
                    duration: 5000,
                    onUndo: () => {
                        setManuals(prev => [...prev, itemToDelete]);
                    },
                    onCommit: async () => {
                        try {
                            await apiService.deleteManual(id);
                        } catch (error) {
                            showToast({ message: 'Erro ao excluir item permanentemente', type: 'error' });
                            setManuals(prev => [...prev, itemToDelete]);
                        }
                    }
                });
            }
        });
    };


    const handlePreview = (path: string, type: string, name: string, url?: string) => {
        const isExternal = !!url && url.startsWith('http');
        const isPreviewableExtension = /\.(pdf|jpg|jpeg|png|gif|docx|doc|xlsx|xls)$/i.test(name || '');
        const isGoogleDrive = !!url && (url.includes('drive.google.com') || url.includes('docs.google.com'));

        if (type === 'link' && url && !isPreviewableExtension && !isGoogleDrive) {
            window.open(url, '_blank');
            return;
        }
        
        // Se for link externo de arquivo ou drive, usamos a URL como path
        setPreviewFile({ 
            path: isExternal ? (url || "") : (path || ""), 
            type: type || "file", 
            name: name || "Arquivo"
        });
        setIsCollapsed(true);
    };

    const getEmbedUrl = (url: string) => {
        if (!url) return '';
        // Converte link do Google Drive para modo de visualização incorporada
        if (url.includes('drive.google.com/file/d/')) {
            return url.replace('/view?usp=sharing', '/preview').replace('/view', '/preview');
        }
        if (url.includes('docs.google.com')) {
            if (url.includes('/edit')) return url.replace('/edit', '/preview');
        }
        return url;
    };

    const closePreview = () => {
        setPreviewFile(null);
        setIsCollapsed(false);
    };

    const handleShare = async (path: string, externalUrl?: string) => {
        const urlToCopy = externalUrl || `${window.location.origin}/api/uploads/${path}`;
        try {
            await navigator.clipboard.writeText(urlToCopy);
            showToast({ message: 'Link copiado para a área de transferência!', type: 'success' });
        } catch (err) {
            console.error('Failed to copy:', err);
            const textArea = document.createElement("textarea");
            textArea.value = urlToCopy;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showToast({ message: 'Link copiado para a área de transferência!', type: 'success' });
            } catch (err) {
                showToast({ message: 'Não foi possível copiar o link automaticamente.', type: 'error' });
            }
            document.body.removeChild(textArea);
        }
    };

    const handleFolderClick = (folder: Manual) => {
        setCurrentFolderId(folder.id);
        setBreadcrumbs(prev => [...prev, { id: folder.id, name: folder.name }]);
    };

    const handleBreadcrumbClick = (index: number) => {
        const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
        setBreadcrumbs(newBreadcrumbs);
        setCurrentFolderId(newBreadcrumbs[newBreadcrumbs.length - 1].id);
    };

    const handleGoBack = () => {
        if (breadcrumbs.length > 1) {
            handleBreadcrumbClick(breadcrumbs.length - 2);
        }
    };

    const getFileIcon = (type: string, isFolder: boolean) => {
        if (isFolder || type === 'folder') return <Folder className="w-10 h-10 text-indigo-500 fill-indigo-100 dark:fill-indigo-900/30" />;
        if (type === 'link') return <LinkIcon className="w-8 h-8 text-indigo-500" />;
        if (type.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
        if (type.includes('word') || type.includes('document')) return <FileText className="w-8 h-8 text-blue-500" />;
        if (type.includes('sheet') || type.includes('excel') || type.includes('spreadsheet')) return <FileText className="w-8 h-8 text-green-500" />;
        if (type.includes('image')) return <ImageIcon className="w-8 h-8 text-purple-500" />;
        if (type.includes('json') || type.includes('javascript') || type.includes('html')) return <FileCode className="w-8 h-8 text-yellow-500" />;
        return <File className="w-8 h-8 text-slate-400" />;
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '-';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-6 relative">
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Manuais e Arquivos</h2>
                    <p className="text-slate-500 dark:text-slate-400">Gerencie seus arquivos e pastas.</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mr-2">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            title="Visualização em Grade"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            title="Visualização em Lista"
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                    </div>

                    {!isViewer && !isSupport && (
                        <>
                            <Button onClick={() => setIsNewFolderModalOpen(true)} variant="secondary" className="flex-1 md:flex-none justify-center">
                                <FolderPlus className="w-4 h-4 mr-2" />
                                Nova Pasta
                            </Button>
                            <Button onClick={() => setIsNewLinkModalOpen(true)} className="flex-1 md:flex-none justify-center bg-indigo-600 hover:bg-indigo-700 text-white border-0">
                                <LinkIcon className="w-4 h-4 mr-2" />
                                Novo Link
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 mb-6 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/50 p-2 rounded-lg overflow-x-auto">
                {breadcrumbs.length > 1 && (
                    <button onClick={handleGoBack} className="mr-2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                )}
                {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.id || 'root'}>
                        {index > 0 && <ChevronRight className="w-4 h-4 text-slate-400" />}
                        <button
                            onClick={() => handleBreadcrumbClick(index)}
                            className={`hover:text-indigo-600 dark:hover:text-indigo-400 font-medium px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${index === breadcrumbs.length - 1 ? 'text-slate-900 dark:text-white font-bold' : ''
                                }`}
                        >
                            {index === 0 ? <Home className="w-4 h-4" /> : crumb.name}
                        </button>
                    </React.Fragment>
                ))}
            </div>

            {/* Content */}
            <div className="relative min-h-[300px] rounded-xl transition-all">

                {manuals.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {manuals.map(manual => (
                                <div
                                    key={manual.id}
                                    className={`
                                    group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 
                                    hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer flex flex-col items-center text-center
                                    ${(manual.isFolder || manual.type === 'folder') ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}
                                `}
                                    onDoubleClick={() => (manual.isFolder || manual.type === 'folder') ? handleFolderClick(manual) : handlePreview(manual.path, manual.type, manual.originalName || manual.name, manual.url)}
                                >
                                    <div className="mb-3 p-2 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:scale-110 transition-transform">
                                        {getFileIcon(manual.type, manual.isFolder || manual.type === 'folder')}
                                    </div>

                                    <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate w-full mb-1" title={manual.originalName || manual.name}>
                                        {manual.originalName || manual.name}
                                    </h3>

                                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                        {manual.isFolder ? 'Pasta' : formatSize(manual.size)}
                                    </div>

                                    {/* Actions Overlay */}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); (manual.isFolder || manual.type === 'folder') ? handleFolderClick(manual) : handlePreview(manual.path, manual.type, manual.originalName || manual.name, manual.url); }}
                                            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 shadow-sm rounded-md border border-slate-200 dark:border-slate-700"
                                            title="Visualizar"
                                        >
                                            <Eye className="w-3 h-3" />
                                        </button>
                                        {!manual.isFolder && (
                                            <>
                                                {!isViewer && (
                                                    <>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleShare(manual.path, manual.url); }}
                                                            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 shadow-sm rounded-md border border-slate-200 dark:border-slate-700"
                                                            title="Compartilhar"
                                                        >
                                                            <Share2 className="w-3 h-3" />
                                                        </button>
                                                    </>
                                                )}
                                            </>
                                        )}
                                        {!isViewer && !isSupport && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(manual.id, manual.name, manual.isFolder); }}
                                                className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-red-600 shadow-sm rounded-md border border-slate-200 dark:border-slate-700"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                                    <tr>
                                        <th className="px-4 py-3 w-10"></th>
                                        <th className="px-4 py-3">Nome</th>
                                        <th className="px-4 py-3">Tamanho</th>
                                        <th className="px-4 py-3">Data</th>
                                        <th className="px-4 py-3 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {manuals.map(manual => (
                                        <tr
                                            key={manual.id}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                                            onDoubleClick={() => manual.isFolder ? handleFolderClick(manual) : handlePreview(manual.path, manual.type, manual.originalName || manual.name)}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="w-8 h-8 flex items-center justify-center">
                                                    {manual.isFolder ? <Folder className="w-5 h-5 text-indigo-500 fill-indigo-100" /> : getFileIcon(manual.type, false)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                                                {manual.originalName || manual.name}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                                                {manual.isFolder ? '-' : formatSize(manual.size)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                                                {manual.uploadDate ? new Date(manual.uploadDate).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); (manual.isFolder || manual.type === 'folder') ? handleFolderClick(manual) : handlePreview(manual.path, manual.type, manual.originalName || manual.name, manual.url); }}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                                                        title="Visualizar"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {!manual.isFolder && (
                                                        <>
                                                            {!isViewer && (
                                                                <>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleShare(manual.path, manual.url); }}
                                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                                                                        title="Compartilhar"
                                                                    >
                                                                        <Share2 className="w-4 h-4" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                    {!isViewer && !isSupport && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(manual.id, manual.name, manual.isFolder); }}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                                                            title="Excluir"
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
                    )) : (
                    <div className="flex flex-col items-center justify-center flex-1 min-h-[200px] text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                        <Folder className="w-16 h-16 mb-4 opacity-20" />
                        <p className="font-medium">Esta pasta está vazia</p>
                        <p className="text-sm opacity-70">Faça upload de arquivos ou crie uma nova pasta</p>
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            <Modal isOpen={!!previewFile} onClose={closePreview} title={previewFile?.name || 'Visualização'} size="full">
                <div className="flex flex-col h-full">
                    <div className="flex-1 bg-slate-100 dark:bg-slate-950 overflow-auto flex items-center justify-center p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                        {isPreviewLoading ? (
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                                <p className="text-slate-500">Carregando visualização...</p>
                            </div>
                        ) : previewContent ? (
                            <div className="w-full h-full bg-white dark:bg-slate-900 p-8 overflow-auto shadow-sm rounded-lg prose dark:prose-invert max-w-none [&>table]:w-full [&>table]:border-collapse [&>table]:border [&>table]:border-slate-200 dark:[&>table]:border-slate-700 [&>table_td]:border [&>table_td]:border-slate-200 dark:[&>table_td]:border-slate-700 [&>table_td]:p-2 [&>table_th]:border [&>table_th]:border-slate-200 dark:[&>table_th]:border-slate-700 [&>table_th]:p-2 [&>table_th]:bg-slate-50 dark:[&>table_th]:bg-slate-800" dangerouslySetInnerHTML={{ __html: previewContent }} />
                        ) : (previewFile?.type?.includes('image') || (previewFile?.path && /\.(jpg|jpeg|png|gif)$/i.test(previewFile.path))) ? (
                            <img
                                src={previewFile?.path?.startsWith('http') ? previewFile.path : `/api/uploads/${previewFile?.path}`}
                                alt={previewFile?.name}
                                className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
                            />
                        ) : (previewFile?.type?.includes('pdf') || previewFile?.path?.includes('.pdf') || previewFile?.path?.includes('drive.google.com') || previewFile?.path?.includes('docs.google.com')) ? (
                            <iframe
                                src={previewFile?.path?.startsWith('http') ? getEmbedUrl(previewFile.path) : `/api/uploads/${previewFile?.path}`}
                                className="w-full h-full rounded-lg shadow-sm bg-white"
                                title="File Preview"
                            />
                        ) : (
                            <div className="text-center">
                                <FileText className="w-20 h-20 text-slate-400 mx-auto mb-4" />
                                <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">Visualização não disponível</p>
                                <p className="text-slate-500 mb-6">Este tipo de arquivo não pode ser visualizado aqui.</p>
                                {previewFile?.path?.startsWith('http') && (
                                    <Button onClick={() => previewFile.path && window.open(previewFile.path, '_blank')}>
                                        <Eye className="w-4 h-4 mr-2" />
                                        Abrir no Navegador
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* New Folder Modal */}
            <Modal isOpen={isNewFolderModalOpen} onClose={() => setIsNewFolderModalOpen(false)} title="Nova Pasta">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome da Pasta</label>
                        <input
                            type="text"
                            placeholder="Ex: Documentação Técnica"
                            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end pt-4 space-x-3">
                        <Button variant="ghost" onClick={() => setIsNewFolderModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateFolder}>Criar Pasta</Button>
                    </div>
                </div>
            </Modal>

            {/* New Link Modal */}
            <Modal isOpen={isNewLinkModalOpen} onClose={() => setIsNewLinkModalOpen(false)} title="Adicionar Link Externo">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Link</label>
                        <input
                            type="text"
                            placeholder="Ex: SharePoint - Manual XP"
                            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                            value={newLinkName}
                            onChange={(e) => setNewLinkName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL (Endereço)</label>
                        <input
                            type="url"
                            placeholder="https://google.com/drive/..."
                            className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
                            value={newLinkUrl}
                            onChange={(e) => setNewLinkUrl(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end pt-4 space-x-3">
                        <Button variant="ghost" onClick={() => setIsNewLinkModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateLink}>Adicionar Link</Button>
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

