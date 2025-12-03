import React from 'react';
import { FileClock, CheckCircle2, Sparkles, Bug, Wrench, Smartphone, Layout as LayoutIcon, ChevronRight, Users } from 'lucide-react';

interface ChangelogProps {
    onClose?: () => void;
    version?: string;
}

export const Changelog: React.FC<ChangelogProps> = ({ onClose, version }) => {
    const changes = [
        {
            version: '3.0',
            date: '01 de Dezembro, 2025',
            type: 'major',
            features: [

                {
                    title: 'Novo menu de auditoria',
                    description: 'Inserido menu de auditoria para que possa acompanhar as alterações feitas no sistema.',
                    icon: Wrench,
                    color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                },
                {
                    title: 'Permissões de usuários',
                    description: 'Agora é possível conceder permissões a usuários (Admin, Tester, Viewer e Support).',
                    icon: Wrench,
                    color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                },
                {
                    title: 'Criado configurações de auditoria',
                    description: 'Agora é possível configurar as auditorias de forma mais flexível.',
                    icon: Wrench,
                    color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                },
                {
                    title: 'Correção na Configuração de Auditoria',
                    description: 'Corrigido problema que impedia salvar as configurações de auditoria devido a conflito de permissões.',
                    icon: CheckCircle2,
                    color: 'text-green-500 bg-green-50 dark:bg-green-900/20'
                },
                {
                    title: 'Melhoria no Dashboard de Auditoria',
                    description: 'Módulos desativados nas configurações agora são ocultados automaticamente do dashboard de auditoria.',
                    icon: Sparkles,
                    color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20'
                }
            ]
        },
        {
            version: '2.2.6',
            date: '01 de Dezembro, 2025',
            type: 'patch',
            features: [
                {
                    title: 'Gestão de Permissões e Usuários',
                    description: 'Implementação do sistema de controle de acesso baseado em funções (RBAC) e melhorias na gestão de usuários.',
                    icon: Users,
                    color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                },
                {
                    title: 'Melhorias de Interface',
                    description: 'Ajuste de alinhamento no dropdown de seleção de função e correções visuais.',
                    icon: Wrench,
                    color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                }
            ]
        },
        {
            version: '2.2.5',
            date: '01 de Dezembro, 2025',
            type: 'patch',
            features: [
                {
                    title: 'Segurança: Reautenticação',
                    description: 'Implementada janela de reautenticação ao expirar a sessão por inatividade, permitindo retomar o trabalho sem perder o contexto.',
                    icon: CheckCircle2,
                    color: 'text-green-500 bg-green-50 dark:bg-green-900/20'
                },
                {
                    title: 'Gestão de Testes: Replicação',
                    description: 'Correção crítica na replicação de casos de teste, garantindo a integridade dos dados e status correto.',
                    icon: Bug,
                    color: 'text-red-500 bg-red-50 dark:bg-red-900/20'
                },
                {
                    title: 'Versões & Scripts: Copiar Script',
                    description: 'Novo botão para copiar o conteúdo de scripts com um clique, com suporte a fallback para maior compatibilidade.',
                    icon: Sparkles,
                    color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20'
                },
                {
                    title: 'Melhorias de Interface',
                    description: 'Botões de ação no Changelog mais visíveis e busca habilitada em dispositivos móveis para documentação.',
                    icon: Wrench,
                    color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                }
            ]
        },
        {
            version: '2.2.4',
            date: '01 de Dezembro, 2025',
            type: 'patch',
            features: [
                {
                    title: 'Docs: Busca Inteligente',
                    description: 'Busca textual dentro do conteúdo dos documentos com rolagem automática para o termo encontrado.',
                    icon: Sparkles,
                    color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20'
                },
                {
                    title: 'Docs: Melhorias de Editor',
                    description: 'Correção de bugs no editor, barra de rolagem interna e layout do cabeçalho fixo.',
                    icon: Wrench,
                    color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                },
                {
                    title: 'Gestão de Testes: Correções',
                    description: 'Correção na exibição do usuário atribuído e prioridade nos casos de teste.',
                    icon: Bug,
                    color: 'text-green-500 bg-green-50 dark:bg-green-900/20'
                },
                {
                    title: 'Versões & Scripts: Mobile',
                    description: 'Ajuste de layout para scripts vinculados em dispositivos móveis.',
                    icon: Smartphone,
                    color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                }
            ]
        },
        {
            version: '2.2.3',
            date: '01 de Dezembro, 2025',
            type: 'minor',
            features: [
                {
                    title: 'Nova Experiência Mobile',
                    description: 'Implementação de Menu Lateral (Drawer) deslizante e reformulação completa da navegação para dispositivos móveis.',
                    icon: Smartphone,
                    color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20'
                },
                {
                    title: 'Gestão de Testes Responsiva',
                    description: 'Novo layout Mestre-Detalhe no mobile, facilitando a navegação entre planos e casos, com alinhamento otimizado.',
                    icon: LayoutIcon,
                    color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                },
                {
                    title: 'Refinamentos de Interface',
                    description: 'Tabelas com rolagem horizontal, cabeçalhos empilhados e ajustes de padding em Manuais, Changelog e Configurações.',
                    icon: Wrench,
                    color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                }

            ]
        },
        {
            version: '2.2.2',
            date: '01 de Dezembro, 2025',
            type: 'patch',
            features: [
                {
                    title: 'Correção em Upload',
                    description: 'Foi ajustado um problema de upload de vários arquivos.',
                    icon: Bug,
                    color: 'text-red-500 bg-red-50 dark:bg-red-900/20'
                },
                {
                    title: 'Melhoria no Calendário',
                    description: 'Ao criar uma nova versão (no módulo changelog), o campo de data no modal agora permite selecionar um calendário.',
                    icon: Sparkles,
                    color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20'
                },
                {
                    title: 'Ajuste Visual',
                    description: 'A posição das setinhas (accordion) em um combo box foi ajustada, pois estavam muito coladas à direita.',
                    icon: Wrench,
                    color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                }

            ]
        },
        {
            version: '2.2.1',
            date: '30 de Novembro, 2025',
            type: 'patch',
            features: [
                {
                    title: 'Busca Global Implementada',
                    description: 'Adicionada funcionalidade de busca em Docs de Build, Docs Úteis, Gestão de Testes e Changelog para facilitar a localização de informações.',
                    icon: Sparkles,
                    color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20'
                },
                {
                    title: 'Segurança: Logout Automático',
                    description: 'Implementado logout automático após 10 minutos de inatividade para aumentar a segurança da sessão.',
                    icon: CheckCircle2,
                    color: 'text-green-500 bg-green-50 dark:bg-green-900/20'
                },
                {
                    title: 'Manuais: Drag-and-Drop',
                    description: 'Agora é possível fazer upload de arquivos no módulo de Manuais simplesmente arrastando-os para a área de lista.',
                    icon: Wrench,
                    color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                },
                {
                    title: 'Melhorias de Interface',
                    description: 'Implementado sistema de accordion (sanfona) para versões e changelogs, melhorando a organização visual.',
                    icon: Sparkles,
                    color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                }
            ]
        },
        {
            version: '2.2',
            date: '28 de Novembro, 2025',
            type: 'minor',
            features: [
                {
                    title: 'Gestão de Changelog Aprimorada',
                    description: 'Agora é possível adicionar, editar e remover itens individualmente dentro do modal de nova versão, facilitando a gestão de mudanças.',
                    icon: Wrench,
                    color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                },
                {
                    title: 'Novo Ícone de Novidades',
                    description: 'O ícone da seção de novidades foi atualizado para Sparkles ✨, trazendo um visual mais moderno e adequado.',
                    icon: Sparkles,
                    color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20'
                },
                {
                    title: 'Correções e Melhorias',
                    description: 'Correções na edição de itens do changelog e melhorias gerais de estabilidade no sistema.',
                    icon: Bug,
                    color: 'text-green-500 bg-green-50 dark:bg-green-900/20'
                }
            ]
        },
        {
            version: '2.1.1',
            date: '27 de Novembro, 2025',
            type: 'minor',
            features: [
                {
                    title: 'Gestão de Testes: Edição de Casos',
                    description: 'Agora é possível editar casos de teste existentes (manuais ou gerados por IA) clicando no ícone de lápis.',
                    icon: Wrench,
                    color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                },
                {
                    title: 'Gestão de Testes: Exclusão de Casos',
                    description: 'Adicionada a opção de excluir casos de teste individuais com confirmação de segurança.',
                    icon: Wrench,
                    color: 'text-red-500 bg-red-50 dark:bg-red-900/20'
                },
                {
                    title: 'Melhorias de UI/UX',
                    description: 'Padronização dos botões "Manual" e "Gerar com IA" no módulo de testes para um layout mais limpo e consistente.',
                    icon: Sparkles,
                    color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20'
                },
                {
                    title: 'Correção em Docs',
                    description: 'Corrigido bug onde o conteúdo do editor não atualizava ao trocar de arquivo nos módulos de Documentação.',
                    icon: Bug,
                    color: 'text-green-500 bg-green-50 dark:bg-green-900/20'
                }
            ]
        }
    ];

    const [expandedVersions, setExpandedVersions] = React.useState<string[]>([changes[0].version]);
    const [showArchived, setShowArchived] = React.useState(false);

    const toggleVersion = (version: string) => {
        setExpandedVersions(prev =>
            prev.includes(version)
                ? prev.filter(v => v !== version)
                : [...prev, version]
        );
    };

    const latestVersion = changes[0];
    const archivedVersions = changes.slice(1);

    if (onClose) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-3">
                                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Novidades</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Confira o que há de novo no QA Nexus</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 transform rotate-90" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="relative pl-8 border-l-2 border-indigo-500 dark:border-indigo-500 pb-8">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-slate-900"></div>
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center">
                                        v{latestVersion.version}
                                        <span className="ml-3 text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                                            Atual
                                        </span>
                                    </h3>
                                    <span className="text-sm text-slate-500 dark:text-slate-400">{latestVersion.date}</span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                    {latestVersion.features[0].description}
                                </p>
                            </div>

                            <div className="grid gap-3">
                                {latestVersion.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-start p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <div className={`p-2 rounded-md mr-3 shrink-0 ${feature.color}`}>
                                            <feature.icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm mb-0.5">{feature.title}</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{feature.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative pl-8 border-l-2 border-slate-200 dark:border-slate-800">
                            <button
                                onClick={() => setShowArchived(!showArchived)}
                                className="flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors mb-6"
                            >
                                {showArchived ? (
                                    <ChevronRight className="w-4 h-4 mr-2 transform rotate-90 transition-transform" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 mr-2 transition-transform" />
                                )}
                                Versões Anteriores
                            </button>

                            {showArchived && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
                                    {archivedVersions.map((release, index) => (
                                        <div key={index} className="relative pb-8 last:pb-0">
                                            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-700 ring-4 ring-white dark:ring-slate-900"></div>

                                            <div className="mb-4">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">v{release.version}</h3>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">{release.date}</span>
                                                </div>
                                            </div>

                                            <div className="grid gap-3">
                                                {release.features.map((feature, fIndex) => (
                                                    <div key={fIndex} className="flex items-start">
                                                        <div className={`p-1.5 rounded-md mr-3 shrink-0 ${feature.color}`}>
                                                            <feature.icon className="w-3.5 h-3.5" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium text-slate-700 dark:text-slate-300 text-xs mb-0.5">{feature.title}</h4>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{feature.description}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-indigo-200 dark:shadow-none"
                        >
                            Entendi
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
                    <FileClock className="w-6 h-6 mr-3 text-indigo-600 dark:text-indigo-400" />
                    Novidades
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Acompanhe as atualizações e novidades do QA Nexus.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 space-y-8">
                {/* Latest Version */}
                <div className="relative pl-8 border-l-2 border-indigo-500 dark:border-indigo-500 pb-8">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-slate-950"></div>

                    <div
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 cursor-pointer group"
                        onClick={() => toggleVersion(latestVersion.version)}
                    >
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                v{latestVersion.version}
                                <span className="ml-3 text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                                    Atual
                                </span>
                                {expandedVersions.includes(latestVersion.version) ? (
                                    <ChevronRight className="w-5 h-5 ml-2 transform rotate-90 transition-transform text-slate-400" />
                                ) : (
                                    <ChevronRight className="w-5 h-5 ml-2 transition-transform text-slate-400" />
                                )}
                            </h2>
                            <span className="text-sm text-slate-500 dark:text-slate-400">{latestVersion.date}</span>
                        </div>
                    </div>

                    {expandedVersions.includes(latestVersion.version) && (
                        <div className="grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            {latestVersion.features.map((feature, fIndex) => (
                                <div key={fIndex} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start">
                                        <div className={`p-2 rounded-lg mr-3 ${feature.color}`}>
                                            <feature.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{feature.title}</h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Archived Versions Toggle */}
                <div className="relative pl-8 border-l-2 border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className="flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors mb-6"
                    >
                        {showArchived ? (
                            <ChevronRight className="w-4 h-4 mr-2 transform rotate-90 transition-transform" />
                        ) : (
                            <ChevronRight className="w-4 h-4 mr-2 transition-transform" />
                        )}
                        Versões Anteriores
                    </button>

                    {showArchived && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
                            {archivedVersions.map((release, index) => (
                                <div key={index} className="relative pb-8 last:pb-0">
                                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-700 ring-4 ring-white dark:ring-slate-950"></div>

                                    <div
                                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 cursor-pointer group"
                                        onClick={() => toggleVersion(release.version)}
                                    >
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                v{release.version}
                                                {expandedVersions.includes(release.version) ? (
                                                    <ChevronRight className="w-4 h-4 ml-2 transform rotate-90 transition-transform text-slate-400" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 ml-2 transition-transform text-slate-400" />
                                                )}
                                            </h2>
                                            <span className="text-sm text-slate-500 dark:text-slate-400">{release.date}</span>
                                        </div>
                                    </div>

                                    {expandedVersions.includes(release.version) && (
                                        <div className="grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {release.features.map((feature, fIndex) => (
                                                <div key={fIndex} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex items-start">
                                                        <div className={`p-2 rounded-lg mr-3 ${feature.color}`}>
                                                            <feature.icon className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{feature.title}</h3>
                                                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                                                {feature.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {/* Oldest Versions Placeholder */}
                            <div className="relative pt-4 opacity-50">
                                <div className="absolute -left-[9px] top-5 w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 ring-4 ring-white dark:ring-slate-950"></div>
                                <p className="text-sm text-slate-500">O histórico completo de versões anteriores a 2.1 está arquivado.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
