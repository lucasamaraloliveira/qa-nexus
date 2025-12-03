import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Upload, FileText, Download, Trash2, Share2, File, FileCode, Image as ImageIcon, Folder, FolderPlus, ChevronRight, Home, ArrowLeft, LayoutGrid, List as ListIcon, Eye, X } from 'lucide-react';
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
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null, name: string }[]>([{ id: null, name: 'Início' }]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [previewFile, setPreviewFile] = useState<{ path: string, type: string, name: string } | null>(null);
    const [previewContent, setPreviewContent] = useState<string | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    // New Folder Modal State
    const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

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
            const url = `http://localhost:3001/api/uploads/${previewFile.path}`;

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

    const uploadFiles = async (files: FileList | File[]) => {
        setIsUploading(true);
        let successCount = 0;
        let errorCount = 0;

        try {
            const fileArray = Array.from(files);
            for (const file of fileArray) {
                try {
                    await apiService.uploadManual(file, currentFolderId);
                    successCount++;
                } catch (error) {
                    console.error('Upload error:', error);
                    errorCount++;
                }
            }

            await loadManuals(currentFolderId);

            if (successCount > 0 && errorCount === 0) {
                showToast({ message: `${successCount} arquivo(s) enviado(s) com sucesso!`, type: 'success' });
            } else if (successCount > 0 && errorCount > 0) {
                showToast({ message: `${successCount} enviado(s), ${errorCount} falha(s).`, type: 'warning' });
            } else if (errorCount > 0) {
                showToast({ message: 'Falha no upload dos arquivos.', type: 'error' });
            }

        } catch (error: any) {
            console.error('Upload error:', error);
            showToast({ message: `Erro ao fazer upload: ${error.message || 'Erro desconhecido'}`, type: 'error' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        await uploadFiles(files);
        event.target.value = '';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (isViewer || isSupport) return;
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (isViewer || isSupport) return;

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            // Currently only supporting single file upload per drag, or we can loop
            // Let's loop to support multiple if the backend supports sequential uploads or just take the first one
            // The requirement didn't specify multiple, but "arrastando-o" implies singular or plural.
            // Let's just upload the first one for now to match existing single upload behavior, 
            // or loop if we want to be fancy. The existing handleFileUpload only takes one [0].
            // Let's stick to single file for consistency with the input, or loop if we want to be better.
            // Given the input only takes one file (no 'multiple' attr on input), I'll stick to one file for safety,
            // but I'll implement a loop just in case the user drops multiple, it's better UX.

            await uploadFiles(files);
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

    const handleDownload = (path: string, originalName: string) => {
        const link = document.createElement('a');
        link.href = `http://localhost:3001/api/uploads/${path}`;
        link.download = originalName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePreview = (path: string, type: string, name: string) => {
        setPreviewFile({ path, type, name });
        setIsCollapsed(true);
    };

    const closePreview = () => {
        setPreviewFile(null);
        setIsCollapsed(false);
    };

    const handleShare = async (path: string) => {
        const url = `http://localhost:3001/api/uploads/${path}`;
        try {
            await navigator.clipboard.writeText(url);
            showToast({ message: 'Link copiado para a área de transferência!', type: 'success' });
        } catch (err) {
            console.error('Failed to copy:', err);
            // Fallback for older browsers or non-secure contexts
            const textArea = document.createElement("textarea");
            textArea.value = url;
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
        if (isFolder) return <Folder className="w-10 h-10 text-indigo-500 fill-indigo-100 dark:fill-indigo-900/30" />;
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
                            <div className="relative flex-1 md:flex-none">
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                    multiple
                                    accept=".doc,.docx,.pdf,.xls,.xlsx,.jpg,.png"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className={`flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    {isUploading ? 'Enviando...' : 'Upload'}
                                </label>
                            </div>
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
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative min-h-[300px] rounded-xl transition-all ${isDragging ? 'border-2 border-dashed border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
            >
                {isDragging && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl">
                        <div className="text-center animate-bounce">
                            <Upload className="w-12 h-12 text-indigo-600 mx-auto mb-2" />
                            <p className="text-lg font-bold text-indigo-600">Solte o arquivo aqui para enviar</p>
                        </div>
                    </div>
                )}

                {manuals.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {manuals.map(manual => (
                                <div
                                    key={manual.id}
                                    className={`
                                    group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 
                                    hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer flex flex-col items-center text-center
                                    ${manual.isFolder ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}
                                `}
                                    onDoubleClick={() => manual.isFolder ? handleFolderClick(manual) : handlePreview(manual.path, manual.type, manual.originalName || manual.name)}
                                >
                                    <div className="mb-3 p-2 rounded-full bg-slate-50 dark:bg-slate-800 group-hover:scale-110 transition-transform">
                                        {getFileIcon(manual.type, manual.isFolder)}
                                    </div>

                                    <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate w-full mb-1" title={manual.originalName || manual.name}>
                                        {manual.originalName || manual.name}
                                    </h3>

                                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                        {manual.isFolder ? 'Pasta' : formatSize(manual.size)}
                                    </div>

                                    {/* Actions Overlay */}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                                        {!manual.isFolder && (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handlePreview(manual.path, manual.type, manual.originalName || manual.name); }}
                                                    className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 shadow-sm rounded-md border border-slate-200 dark:border-slate-700"
                                                    title="Visualizar"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                </button>
                                                {!isViewer && (
                                                    <>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleShare(manual.path); }}
                                                            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 shadow-sm rounded-md border border-slate-200 dark:border-slate-700"
                                                            title="Compartilhar"
                                                        >
                                                            <Share2 className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDownload(manual.path, manual.originalName); }}
                                                            className="p-1.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-green-600 shadow-sm rounded-md border border-slate-200 dark:border-slate-700"
                                                            title="Baixar"
                                                        >
                                                            <Download className="w-3 h-3" />
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
                                                {new Date(manual.uploadDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!manual.isFolder && (
                                                        <>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handlePreview(manual.path, manual.type, manual.originalName || manual.name); }}
                                                                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                                                                title="Visualizar"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            {!isViewer && (
                                                                <>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleShare(manual.path); }}
                                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                                                                        title="Compartilhar"
                                                                    >
                                                                        <Share2 className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleDownload(manual.path, manual.originalName); }}
                                                                        className="p-1.5 text-slate-400 hover:text-green-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                                                                        title="Baixar"
                                                                    >
                                                                        <Download className="w-4 h-4" />
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
                        ) : previewFile?.type.includes('image') ? (
                            <img
                                src={`http://localhost:3001/api/uploads/${previewFile.path}`}
                                alt={previewFile.name}
                                className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
                            />
                        ) : previewFile?.type.includes('pdf') ? (
                            <iframe
                                src={`http://localhost:3001/api/uploads/${previewFile.path}`}
                                className="w-full h-full rounded-lg shadow-sm bg-white"
                                title="PDF Preview"
                            />
                        ) : (
                            <div className="text-center">
                                <FileText className="w-20 h-20 text-slate-400 mx-auto mb-4" />
                                <p className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">Visualização não disponível</p>
                                <p className="text-slate-500 mb-6">Este tipo de arquivo não pode ser visualizado aqui.</p>
                                {!isViewer && (
                                    <Button onClick={() => previewFile && handleDownload(previewFile.path, previewFile.name)}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Baixar Arquivo
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
