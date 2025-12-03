import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Underline, Undo, Redo, Palette, List, ListOrdered } from 'lucide-react';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, className }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

    // Sync content only if it's significantly different to avoid cursor jumping
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== content) {
            if (content === '' || editorRef.current.innerHTML === '') {
                editorRef.current.innerHTML = content;
            }
        }
    }, [content]);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const execCommand = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            editorRef.current.focus();
        }
    };

    return (
        <div className={`flex flex-col border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-950 ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 gap-1 flex-wrap">
                <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execCommand('bold')}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    title="Negrito"
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execCommand('italic')}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    title="Itálico"
                >
                    <Italic className="w-4 h-4" />
                </button>
                <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execCommand('underline')}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    title="Sublinhado"
                >
                    <Underline className="w-4 h-4" />
                </button>

                <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1" />

                <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execCommand('insertUnorderedList')}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    title="Lista com Marcadores"
                >
                    <List className="w-4 h-4" />
                </button>
                <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execCommand('insertOrderedList')}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    title="Lista Numerada"
                >
                    <ListOrdered className="w-4 h-4" />
                </button>

                <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1" />

                <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execCommand('fontSize', '3')} // Normal
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
                    title="Tamanho Normal"
                >
                    A
                </button>
                <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execCommand('fontSize', '5')} // Large
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-lg font-bold"
                    title="Tamanho Grande"
                >
                    A
                </button>

                <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1" />

                <div className="relative">
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                        className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center ${isColorPickerOpen ? 'bg-slate-200 dark:bg-slate-800' : ''}`}
                        title="Cor do Texto"
                    >
                        <Palette className="w-4 h-4" />
                    </button>
                    {isColorPickerOpen && (
                        <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-slate-800 rounded shadow-lg border border-slate-200 dark:border-slate-700 flex gap-1 z-50">
                            <button onMouseDown={(e) => e.preventDefault()} onClick={() => { execCommand('foreColor', '#000000'); setIsColorPickerOpen(false); }} className="w-5 h-5 rounded-full bg-black border border-slate-300 hover:scale-110 transition-transform" title="Preto"></button>
                            <button onMouseDown={(e) => e.preventDefault()} onClick={() => { execCommand('foreColor', '#ffffff'); setIsColorPickerOpen(false); }} className="w-5 h-5 rounded-full bg-white border border-slate-300 hover:scale-110 transition-transform" title="Branco"></button>
                            <button onMouseDown={(e) => e.preventDefault()} onClick={() => { execCommand('foreColor', '#ef4444'); setIsColorPickerOpen(false); }} className="w-5 h-5 rounded-full bg-red-500 hover:scale-110 transition-transform" title="Vermelho"></button>
                            <button onMouseDown={(e) => e.preventDefault()} onClick={() => { execCommand('foreColor', '#22c55e'); setIsColorPickerOpen(false); }} className="w-5 h-5 rounded-full bg-green-500 hover:scale-110 transition-transform" title="Verde"></button>
                            <button onMouseDown={(e) => e.preventDefault()} onClick={() => { execCommand('foreColor', '#3b82f6'); setIsColorPickerOpen(false); }} className="w-5 h-5 rounded-full bg-blue-500 hover:scale-110 transition-transform" title="Azul"></button>
                            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
                            <label className="cursor-pointer w-5 h-5 rounded-full overflow-hidden border border-slate-300 hover:scale-110 transition-transform relative" title="Cor Personalizada">
                                <input
                                    type="color"
                                    className="absolute -top-2 -left-2 w-10 h-10 p-0 border-0 opacity-0 cursor-pointer"
                                    onChange={(e) => { execCommand('foreColor', e.target.value); setIsColorPickerOpen(false); }}
                                />
                                <div className="w-full h-full bg-gradient-to-br from-red-500 via-green-500 to-blue-500"></div>
                            </label>
                        </div>
                    )}
                </div>

                <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1" />

                <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execCommand('undo')}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    title="Desfazer"
                >
                    <Undo className="w-4 h-4" />
                </button>
                <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => execCommand('redo')}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    title="Refazer"
                >
                    <Redo className="w-4 h-4" />
                </button>
            </div>

            {/* Editor Content */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className="flex-1 p-4 outline-none overflow-y-auto min-h-0 text-slate-800 dark:text-slate-200 prose dark:prose-invert max-w-none"
                style={{ minHeight: '200px' }}
            />
        </div>
    );
};
