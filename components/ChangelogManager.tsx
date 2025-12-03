import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FileClock, CheckCircle2, Sparkles, Bug, Wrench, Plus, Settings, Trash2, ChevronDown, ChevronRight, Calendar, Pencil, Upload, ImageIcon, Loader2, X, Search, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiService } from '../services/apiService';
import { ChangelogSystem, ChangelogEntry, ChangelogItem, Version } from '../types';
import { Button } from './Button';
import { Modal } from './Modal';
import { useLayout } from '../contexts/LayoutContext';
import { useToast } from '../contexts/ToastContext';
import { ConfirmModal } from './ConfirmModal';

const monthsMap: { [key: string]: string } = {
    'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
    'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
    'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
};

const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    // Check if already ISO (simple check)
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return dateString;

    const parts = dateString.split(' de ');
    if (parts.length !== 3) return '';

    const day = parts[0].padStart(2, '0');
    const monthName = parts[1].toLowerCase();
    const year = parts[2];

    const month = monthsMap[monthName];
    if (!month) return '';

    return `${year}-${month}-${day}`;
};

const formatDateForDisplay = (isoDate: string) => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const ChangelogManager: React.FC = () => {
    const [systems, setSystems] = useState<ChangelogSystem[]>([]);
    const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
    const [entries, setEntries] = useState<ChangelogEntry[]>([]);
    const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // Modals
    // Modals
    const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);
    const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
    const { setIsCollapsed } = useLayout();
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

    // Form State
    const [newSystemName, setNewSystemName] = useState('');
    const [newSystemDesc, setNewSystemDesc] = useState('');
    const [editingSystem, setEditingSystem] = useState<ChangelogSystem | null>(null);
    const [editingEntry, setEditingEntry] = useState<ChangelogEntry | null>(null);

    const [newEntryVersion, setNewEntryVersion] = useState('');
    const [newEntryDate, setNewEntryDate] = useState(new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }));
    const [newEntryType, setNewEntryType] = useState<'major' | 'minor' | 'patch'>('minor');
    const [newEntryItems, setNewEntryItems] = useState<Omit<ChangelogItem, 'id'>[]>([]);

    // Item Form
    const [newItemTitle, setNewItemTitle] = useState('');
    const [newItemDesc, setNewItemDesc] = useState('');
    const [newItemType, setNewItemType] = useState<'feature' | 'fix' | 'improvement'>('feature');
    const [newItemImage, setNewItemImage] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

    useEffect(() => {
        fetchSystems();
    }, []);

    useEffect(() => {
        if (selectedSystemId) {
            fetchEntries(selectedSystemId);
        } else if (systems.length > 0) {
            setSelectedSystemId(systems[0].id);
        }
    }, [selectedSystemId, systems]);

    const filteredEntries = entries.filter(entry =>
        entry.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.items.some(item =>
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const fetchSystems = async () => {
        try {
            const data = await apiService.getChangelogSystems();
            setSystems(data);
            if (data.length > 0 && !selectedSystemId) {
                setSelectedSystemId(data[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch systems', error);
        } finally {
            setLoading(false);
        }
    };



    const fetchEntries = async (systemId: string) => {
        try {
            const data = await apiService.getChangelogEntries(systemId);
            setEntries(data);
            // if (data.length > 0) {
            //     setExpandedEntries(new Set([data[0].id]));
            // }
        } catch (error) {
            console.error('Failed to fetch entries', error);
        }
    };

    const handleCreateSystem = async () => {
        if (!newSystemName) return;
        try {
            if (editingSystem) {
                const updated = await apiService.updateChangelogSystem(editingSystem.id, {
                    name: newSystemName,
                    description: newSystemDesc
                });
                setSystems(systems.map(s => s.id === updated.id ? updated : s));
                setEditingSystem(null);
            } else {
                const newSystem = await apiService.createChangelogSystem({
                    name: newSystemName,
                    description: newSystemDesc
                });
                setSystems([...systems, newSystem]);
                setSelectedSystemId(newSystem.id);
            }
            setIsSystemModalOpen(false);
            setNewSystemName('');
            setNewSystemDesc('');
            showToast({ message: editingSystem ? 'Sistema atualizado com sucesso!' : 'Sistema criado com sucesso!', type: 'success' });
        } catch (error) {
            showToast({ message: 'Erro ao salvar sistema', type: 'error' });
        }
    };

    const handleEditSystem = (system: ChangelogSystem) => {
        setEditingSystem(system);
        setNewSystemName(system.name);
        setNewSystemDesc(system.description || '');
    };

    const handleDeleteSystem = (id: string) => {
        const systemToDelete = systems.find(s => s.id === id);
        if (!systemToDelete) return;

        setConfirmModal({
            isOpen: true,
            title: 'Excluir Sistema',
            message: `Tem certeza que deseja excluir o sistema "${systemToDelete.name}"? Esta ação não pode ser desfeita imediatamente.`,
            onConfirm: () => {
                // Optimistic update
                setSystems(prev => prev.filter(s => s.id !== id));
                if (selectedSystemId === id) setSelectedSystemId(null);

                showToast({
                    message: 'Sistema excluído.',
                    type: 'error',
                    duration: 5000,
                    onUndo: () => {
                        setSystems(prev => [...prev, systemToDelete]);
                        if (selectedSystemId === null) setSelectedSystemId(id);
                    },
                    onCommit: async () => {
                        try {
                            await apiService.deleteChangelogSystem(id);
                        } catch (error) {
                            showToast({ message: 'Erro ao excluir sistema permanentemente', type: 'error' });
                            // Revert if API fails
                            setSystems(prev => [...prev, systemToDelete]);
                        }
                    }
                });
            }
        });
    };

    const handleDeleteEntry = (id: string) => {
        const entryToDelete = entries.find(e => e.id === id);
        if (!entryToDelete) return;

        setConfirmModal({
            isOpen: true,
            title: 'Excluir Versão',
            message: `Tem certeza que deseja excluir a versão "${entryToDelete.version}"?`,
            onConfirm: () => {
                // Optimistic update
                setEntries(prev => prev.filter(e => e.id !== id));

                showToast({
                    message: 'Versão excluída.',
                    type: 'error',
                    duration: 5000,
                    onUndo: () => {
                        setEntries(prev => {
                            const newEntries = [...prev, entryToDelete];
                            // Sort by date/version if needed, but simple append is okay for now or sort later
                            return newEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        });
                    },
                    onCommit: async () => {
                        try {
                            await apiService.deleteChangelogEntry(id);
                        } catch (error) {
                            showToast({ message: 'Erro ao excluir versão permanentemente', type: 'error' });
                            setEntries(prev => [...prev, entryToDelete]);
                        }
                    }
                });
            }
        });
    };

    const toggleEntry = (id: string) => {
        setExpandedEntries(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleEditEntry = (entry: ChangelogEntry) => {
        setEditingEntry(entry);
        setNewEntryVersion(entry.version);
        setNewEntryDate(entry.date);
        setNewEntryType(entry.type as any);
        setNewEntryItems(entry.items);
        setIsEntryModalOpen(true);
        setIsCollapsed(true);
    };

    const handleAddItem = async () => {
        if (!newItemTitle) return;

        let imageUrl = '';
        if (newItemImage) {
            setIsUploading(true);
            try {
                const result = await apiService.uploadImage(newItemImage);
                imageUrl = result.url;
            } catch (error) {
                return;
            }
            setIsUploading(false);
        } else if (editingItemIndex !== null && newEntryItems[editingItemIndex].image) {
            // Keep existing image if not replaced
            imageUrl = newEntryItems[editingItemIndex].image || '';
        }

        const newItem = {
            title: newItemTitle,
            description: newItemDesc,
            type: newItemType,
            image: imageUrl
        };

        if (editingItemIndex !== null) {
            const updatedItems = [...newEntryItems];
            updatedItems[editingItemIndex] = newItem;
            setNewEntryItems(updatedItems);
            setEditingItemIndex(null);
        } else {
            setNewEntryItems([...newEntryItems, newItem]);
        }

        setNewItemTitle('');
        setNewItemDesc('');
        setNewItemType('feature');
        setNewItemImage(null);
    };

    const handleEditItem = (index: number) => {
        const item = newEntryItems[index];
        setNewItemTitle(item.title);
        setNewItemDesc(item.description);
        setNewItemType(item.type as any);
        setEditingItemIndex(index);
    };

    const handleCancelEditItem = () => {
        setNewItemTitle('');
        setNewItemDesc('');
        setNewItemType('feature');
        setNewItemImage(null);
        setEditingItemIndex(null);
    };

    const handleDeleteItem = (index: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Excluir Item',
            message: 'Tem certeza que deseja remover este item da lista?',
            onConfirm: () => {
                setNewEntryItems(newEntryItems.filter((_, i) => i !== index));
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleCreateEntry = async () => {
        if (!selectedSystemId || !newEntryVersion) return;
        try {
            if (editingEntry) {
                const updatedEntry = await apiService.updateChangelogEntry(editingEntry.id, {
                    systemId: selectedSystemId,
                    version: newEntryVersion,
                    date: newEntryDate,
                    type: newEntryType,
                    items: newEntryItems as any
                });
                setEntries(entries.map(e => e.id === editingEntry.id ? updatedEntry : e));
                setEditingEntry(null);
            } else {
                const newEntry = await apiService.createChangelogEntry({
                    systemId: selectedSystemId,
                    version: newEntryVersion,
                    date: newEntryDate,
                    type: newEntryType,
                    items: newEntryItems as any
                });
                setEntries([newEntry, ...entries]);
            }
            setIsEntryModalOpen(false);
            setIsCollapsed(false);
            // Reset form
            setNewEntryVersion('');
            setNewEntryItems([]);
            showToast({ message: editingEntry ? 'Versão atualizada com sucesso!' : 'Versão publicada com sucesso!', type: 'success' });
        } catch (error) {
            showToast({ message: 'Erro ao salvar entrada', type: 'error' });
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'feature': return Wrench;
            case 'fix': return Bug;
            case 'improvement': return Sparkles;
            default: return CheckCircle2;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'feature': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
            case 'fix': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
            case 'improvement': return 'text-purple-500 bg-purple-50 dark:bg-purple-900/20';
            default: return 'text-slate-500 bg-slate-50 dark:bg-slate-900/20';
        }
    };

    const getImageBase64 = async (url: string): Promise<{ data: string, width: number, height: number } | null> => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result as string;
                    const img = new Image();
                    img.onload = () => {
                        resolve({
                            data: base64data,
                            width: img.width,
                            height: img.height
                        });
                    };
                    img.src = base64data;
                };
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Error fetching image:', error);
            return null;
        }
    };

    const handleExportPDF = async () => {
        const doc = new jsPDF();
        const systemName = systems.find(s => s.id === selectedSystemId)?.name || 'Sistema';

        // Title
        doc.setFontSize(18);
        doc.text(`Relatório de Changelog - ${systemName}`, 14, 22);
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 14, 30);

        let yPos = 40;

        for (const release of filteredEntries) {
            // Version Header
            doc.setFontSize(14);
            doc.setTextColor(79, 70, 229); // Indigo 600
            doc.text(`v${release.version} - ${release.date}`, 14, yPos);
            yPos += 10;

            // Prepare data with images
            const tableData = await Promise.all(release.items.map(async (item) => {
                let imageData = null;
                if (item.image) {
                    imageData = await getImageBase64(item.image);
                }
                return {
                    title: item.title,
                    description: item.description,
                    image: imageData
                };
            }));

            let currentBatch = [];

            for (let i = 0; i < tableData.length; i++) {
                const item = tableData[i];

                if (item.image) {
                    // Flush existing text items
                    if (currentBatch.length > 0) {
                        autoTable(doc, {
                            startY: yPos,
                            head: [['Título', 'Descrição']],
                            body: currentBatch.map(i => [i.title, i.description]),
                            theme: 'striped',
                            headStyles: { fillColor: [79, 70, 229] },
                            styles: { fontSize: 10, cellPadding: 5, minCellHeight: 10, valign: 'middle' },
                            columnStyles: {
                                0: { cellWidth: 60, fontStyle: 'bold' },
                                1: { cellWidth: 'auto' }
                            },
                            margin: { left: 14, right: 14 }
                        });
                        yPos = (doc as any).lastAutoTable.finalY + 15;
                        currentBatch = [];
                    }

                    // Page Break for Image Item
                    if (yPos > 60) {
                        doc.addPage();
                        yPos = 20;
                    }

                    // Print Image Item
                    const body = [];
                    body.push([item.title, item.description]);

                    const pageWidth = doc.internal.pageSize.width;
                    const margin = 14;
                    const availableWidth = pageWidth - (margin * 2);
                    const imgHeight = (item.image.height / item.image.width) * availableWidth;

                    body.push([{
                        content: '',
                        colSpan: 2,
                        styles: { minCellHeight: imgHeight + 10 },
                        image: item.image
                    }]);

                    autoTable(doc, {
                        startY: yPos,
                        head: [['Título', 'Descrição']],
                        body: body,
                        theme: 'striped',
                        headStyles: { fillColor: [79, 70, 229] },
                        styles: { fontSize: 10, cellPadding: 5, minCellHeight: 10, valign: 'middle' },
                        columnStyles: {
                            0: { cellWidth: 60, fontStyle: 'bold' },
                            1: { cellWidth: 'auto' }
                        },
                        margin: { left: 14, right: 14 },
                        didDrawCell: (data) => {
                            if (data.section === 'body' && data.cell.raw && (data.cell.raw as any).image) {
                                const imgData = (data.cell.raw as any).image;
                                const pageWidth = doc.internal.pageSize.width;
                                const margin = 14;
                                const availableWidth = pageWidth - (margin * 2);
                                const imgHeight = (imgData.height / imgData.width) * availableWidth;

                                const x = data.cell.x + (data.cell.width - availableWidth) / 2;
                                const y = data.cell.y + 5;

                                try {
                                    doc.addImage(imgData.data, 'JPEG', x, y, availableWidth, imgHeight);
                                } catch (e) {
                                    console.error('Error adding image to PDF', e);
                                }
                            }
                        }
                    });

                    yPos = (doc as any).lastAutoTable.finalY + 15;

                } else {
                    currentBatch.push(item);
                }
            }

            // Flush remaining items
            if (currentBatch.length > 0) {
                autoTable(doc, {
                    startY: yPos,
                    head: [['Título', 'Descrição']],
                    body: currentBatch.map(i => [i.title, i.description]),
                    theme: 'striped',
                    headStyles: { fillColor: [79, 70, 229] },
                    styles: { fontSize: 10, cellPadding: 5, minCellHeight: 10, valign: 'middle' },
                    columnStyles: {
                        0: { cellWidth: 60, fontStyle: 'bold' },
                        1: { cellWidth: 'auto' }
                    },
                    margin: { left: 14, right: 14 }
                });
                yPos = (doc as any).lastAutoTable.finalY + 15;
            }

            // Add new page if needed for next release
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }
        }

        doc.save(`changelog-${systemName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    };

    const handleExportSinglePDF = async (entry: ChangelogEntry) => {
        const doc = new jsPDF();
        const systemName = systems.find(s => s.id === selectedSystemId)?.name || 'Sistema';

        // Title
        doc.setFontSize(18);
        doc.text(`Relatório de Versão - ${systemName}`, 14, 22);
        doc.setFontSize(14);
        doc.setTextColor(79, 70, 229); // Indigo 600
        doc.text(`v${entry.version} - ${entry.date}`, 14, 32);
        doc.setTextColor(0, 0, 0); // Reset color
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 14, 40);

        let yPos = 50;

        // Prepare data with images
        const tableData = await Promise.all(entry.items.map(async (item) => {
            let imageData = null;
            if (item.image) {
                imageData = await getImageBase64(item.image);
            }
            return {
                title: item.title,
                description: item.description,
                image: imageData
            };
        }));

        let currentBatch = [];

        for (let i = 0; i < tableData.length; i++) {
            const item = tableData[i];

            if (item.image) {
                // Flush existing text items
                if (currentBatch.length > 0) {
                    autoTable(doc, {
                        startY: yPos,
                        head: [['Título', 'Descrição']],
                        body: currentBatch.map(i => [i.title, i.description]),
                        theme: 'striped',
                        headStyles: { fillColor: [79, 70, 229] },
                        styles: { fontSize: 10, cellPadding: 5, minCellHeight: 10, valign: 'middle' },
                        columnStyles: {
                            0: { cellWidth: 60, fontStyle: 'bold' },
                            1: { cellWidth: 'auto' }
                        },
                        margin: { left: 14, right: 14 }
                    });
                    yPos = (doc as any).lastAutoTable.finalY + 15;
                    currentBatch = [];
                }

                // Page Break for Image Item
                if (yPos > 60) {
                    doc.addPage();
                    yPos = 20;
                }

                // Print Image Item
                const body = [];
                body.push([item.title, item.description]);

                const pageWidth = doc.internal.pageSize.width;
                const margin = 14;
                const availableWidth = pageWidth - (margin * 2);
                const imgHeight = (item.image.height / item.image.width) * availableWidth;

                body.push([{
                    content: '',
                    colSpan: 2,
                    styles: { minCellHeight: imgHeight + 10 },
                    image: item.image
                }]);

                autoTable(doc, {
                    startY: yPos,
                    head: [['Título', 'Descrição']],
                    body: body,
                    theme: 'striped',
                    headStyles: { fillColor: [79, 70, 229] },
                    styles: { fontSize: 10, cellPadding: 5, minCellHeight: 10, valign: 'middle' },
                    columnStyles: {
                        0: { cellWidth: 60, fontStyle: 'bold' },
                        1: { cellWidth: 'auto' }
                    },
                    margin: { left: 14, right: 14 },
                    didDrawCell: (data) => {
                        if (data.section === 'body' && data.cell.raw && (data.cell.raw as any).image) {
                            const imgData = (data.cell.raw as any).image;
                            const pageWidth = doc.internal.pageSize.width;
                            const margin = 14;
                            const availableWidth = pageWidth - (margin * 2);
                            const imgHeight = (imgData.height / imgData.width) * availableWidth;

                            const x = data.cell.x + (data.cell.width - availableWidth) / 2;
                            const y = data.cell.y + 5;

                            try {
                                doc.addImage(imgData.data, 'JPEG', x, y, availableWidth, imgHeight);
                            } catch (e) {
                                console.error('Error adding image to PDF', e);
                            }
                        }
                    }
                });

                yPos = (doc as any).lastAutoTable.finalY + 15;

            } else {
                currentBatch.push(item);
            }
        }

        // Flush remaining items
        if (currentBatch.length > 0) {
            autoTable(doc, {
                startY: yPos,
                head: [['Título', 'Descrição']],
                body: currentBatch.map(i => [i.title, i.description]),
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] },
                styles: { fontSize: 10, cellPadding: 5, minCellHeight: 10, valign: 'middle' },
                columnStyles: {
                    0: { cellWidth: 60, fontStyle: 'bold' },
                    1: { cellWidth: 'auto' }
                },
                margin: { left: 14, right: 14 }
            });
            yPos = (doc as any).lastAutoTable.finalY + 15;
        }

        doc.save(`changelog-${systemName.toLowerCase().replace(/\s+/g, '-')}-v${entry.version}.pdf`);
    };

    const inputClass = "w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors";

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
                        <FileClock className="w-6 h-6 mr-3 text-indigo-600 dark:text-indigo-400" />
                        Gerenciador de Changelog
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Gerencie as atualizações e versões dos seus sistemas.
                    </p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    {!isViewer && (
                        <>
                            {!isSupport && (
                                <Button variant="ghost" onClick={() => setIsSystemModalOpen(true)} className="flex-1 md:flex-none justify-center">
                                    <Settings className="w-4 h-4 mr-2" /> Sistemas
                                </Button>
                            )}
                            <Button variant="outline" onClick={handleExportPDF} className="flex-1 md:flex-none justify-center" disabled={filteredEntries.length === 0}>
                                <Download className="w-4 h-4 mr-2" /> Exportar PDF
                            </Button>
                            {!isSupport && (
                                <Button onClick={() => {
                                    setEditingEntry(null);
                                    setNewEntryVersion('');
                                    setNewEntryItems([]);
                                    setIsEntryModalOpen(true);
                                    setIsCollapsed(true);
                                    setEditingItemIndex(null);
                                }} className="flex-1 md:flex-none justify-center">
                                    <Plus className="w-4 h-4 mr-2" /> Nova Versão
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Buscar versões, funcionalidades ou correções..."
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all text-slate-700 dark:text-slate-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* System Tabs */}
            <div className="flex space-x-1 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {systems.map(system => (
                    <button
                        key={system.id}
                        onClick={() => setSelectedSystemId(system.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${selectedSystemId === system.id
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                    >
                        {system.name}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 md:pr-4 space-y-8">
                {filteredEntries.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-slate-500 dark:text-slate-400">Nenhuma atualização encontrada.</p>
                    </div>
                ) : (
                    filteredEntries.map((release) => (
                        <div key={release.id} className="relative pl-4 md:pl-8 border-l-2 border-slate-200 dark:border-slate-800 last:border-0 pb-8">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-slate-950"></div>

                            <div className="mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-4">
                                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleEntry(release.id)}>
                                            <span>v{release.version}</span>
                                            {expandedEntries.has(release.id) ? (
                                                <ChevronDown className="w-5 h-5 text-slate-400" />
                                            ) : (
                                                <ChevronRight className="w-5 h-5 text-slate-400" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!isViewer && (
                                                <>
                                                    <button
                                                        onClick={() => handleExportSinglePDF(release)}
                                                        className="text-slate-400 hover:text-indigo-500 transition-colors"
                                                        title="Exportar PDF desta versão"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    {!isSupport && (
                                                        <button
                                                            onClick={() => handleEditEntry(release)}
                                                            className="text-slate-400 hover:text-blue-500 transition-colors"
                                                            title="Editar versão"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {!isSupport && (
                                                        <button
                                                            onClick={() => handleDeleteEntry(release.id)}
                                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                                            title="Excluir versão"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </h2>
                                    <span className="text-sm text-slate-500 dark:text-slate-400">{release.date}</span>
                                </div>
                            </div>

                            {expandedEntries.has(release.id) && (
                                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                                    {release.items.map((feature, fIndex) => {
                                        const Icon = getIcon(feature.type);
                                        return (
                                            <div key={fIndex} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-start">
                                                    <div className={`p-2 rounded-lg mr-3 ${getColor(feature.type)}`}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{feature.title}</h3>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
                                                            {feature.description}
                                                        </p>
                                                        {feature.image && (
                                                            <img
                                                                src={feature.image}
                                                                alt={feature.title}
                                                                className="mt-2 rounded-lg border border-slate-200 dark:border-slate-700 max-h-64 object-cover"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Create System Modal */}
            <Modal isOpen={isSystemModalOpen} onClose={() => setIsSystemModalOpen(false)} title="Gerenciar Sistemas">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Sistema</label>
                        <input
                            type="text"
                            className={inputClass}
                            value={newSystemName}
                            onChange={(e) => setNewSystemName(e.target.value)}
                            placeholder="Ex: Portal do Cliente"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                        <input
                            type="text"
                            className={inputClass}
                            value={newSystemDesc}
                            onChange={(e) => setNewSystemDesc(e.target.value)}
                            placeholder="Breve descrição..."
                        />
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button onClick={handleCreateSystem}>
                            {editingSystem ? 'Salvar Alterações' : 'Criar Sistema'}
                        </Button>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Sistemas Existentes</h3>
                        <ul className="space-y-2">
                            {systems.map(sys => (
                                <li key={sys.id} className="text-sm text-slate-600 dark:text-slate-400 flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
                                    <span>{sys.name}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditSystem(sys)} className="text-blue-500 hover:text-blue-700">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        {!isSupport && (
                                            <button onClick={() => handleDeleteSystem(sys.id)} className="text-red-500 hover:text-red-700">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </Modal>

            {/* Create Entry Modal */}
            <Modal isOpen={isEntryModalOpen} onClose={() => { setIsEntryModalOpen(false); setIsCollapsed(false); }} title={`Nova Versão / Changelog - ${systems.find(s => s.id === selectedSystemId)?.name || ''}`} size="xl">
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Versão</label>
                            <input
                                type="text"
                                className={inputClass}
                                value={newEntryVersion}
                                onChange={(e) => setNewEntryVersion(e.target.value)}
                                placeholder="Ex: 1.0.0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    className={`${inputClass} pr-10 cursor-pointer [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full`}
                                    value={formatDateForInput(newEntryDate)}
                                    onChange={(e) => setNewEntryDate(formatDateForDisplay(e.target.value))}
                                    onClick={(e) => e.currentTarget.showPicker()}
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                                    <Calendar className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                            {editingItemIndex !== null ? 'Editar Item' : 'Adicionar Item'}
                        </h3>
                        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                            <input
                                type="text"
                                className={inputClass}
                                value={newItemTitle}
                                onChange={(e) => setNewItemTitle(e.target.value)}
                                placeholder="Título da mudança (Ex: Nova tela de login)"
                            />
                            <textarea
                                className={`${inputClass} h-20 resize-none`}
                                value={newItemDesc}
                                onChange={(e) => setNewItemDesc(e.target.value)}
                                placeholder="Descrição detalhada..."
                            />
                            <div className="flex gap-2">
                                <div className="relative">
                                    <select
                                        className={`${inputClass} appearance-none pr-10`}
                                        value={newItemType}
                                        onChange={(e) => setNewItemType(e.target.value as any)}
                                    >
                                        <option value="feature">Nova Funcionalidade</option>
                                        <option value="fix">Correção de Bug</option>
                                        <option value="improvement">Melhoria</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="item-image"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => setNewItemImage(e.target.files?.[0] || null)}
                                    />
                                    <Button
                                        variant="ghost"
                                        onClick={() => document.getElementById('item-image')?.click()}
                                        className={`w-12 h-12 p-0 flex items-center justify-center border border-slate-200 dark:border-slate-700 ${newItemImage
                                            ? 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                                        title={newItemImage ? "Imagem selecionada" : "Adicionar Imagem"}
                                    >
                                        {newItemImage ? <ImageIcon className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                                    </Button>
                                </div>
                                <Button
                                    onClick={handleAddItem}
                                    disabled={!newItemTitle || isUploading}
                                    title={editingItemIndex !== null ? "Atualizar Item" : "Adicionar Item"}
                                    className={`w-12 h-12 p-0 flex items-center justify-center shadow-sm transition-all ${editingItemIndex !== null
                                        ? "bg-green-600 hover:bg-green-700 text-white"
                                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : (editingItemIndex !== null ? <CheckCircle2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />)}
                                </Button>
                                {editingItemIndex !== null && (
                                    <Button
                                        onClick={handleCancelEditItem}
                                        variant="ghost"
                                        title="Cancelar Edição"
                                        className="text-slate-500 hover:text-slate-700"
                                    >
                                        <X className="w-8 h-8" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {newEntryItems.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Itens Adicionados</h3>
                            <div className="space-y-2">
                                {newEntryItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                                        <div>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded mr-2 uppercase ${item.type === 'feature' ? 'bg-blue-100 text-blue-700' :
                                                item.type === 'fix' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'
                                                }`}>{item.type}</span>
                                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.title}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleEditItem(idx)}
                                                className="text-slate-400 hover:text-indigo-500 p-1"
                                                title="Editar"
                                            >
                                                <Pencil className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteItem(idx)}
                                                className="text-slate-400 hover:text-red-500 p-1"
                                                title="Remover"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                        <Button variant="ghost" onClick={() => { setIsEntryModalOpen(false); setIsCollapsed(false); }} className="mr-2">Cancelar</Button>
                        <Button onClick={handleCreateEntry} disabled={!newEntryVersion || newEntryItems.length === 0}>
                            {editingEntry ? 'Salvar Alterações' : 'Publicar Versão'}
                        </Button>
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
