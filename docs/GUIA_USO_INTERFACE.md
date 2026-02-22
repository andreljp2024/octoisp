# Guia de Uso da Interface OctoISP

## Objetivo

Este guia descreve o fluxo de trabalho do NOC no OctoISP, com foco nas telas principais, ajuda contextual e boas práticas de navegação.

## Acesso Rápido

- `Dashboard NOC`: visão geral da rede e alertas críticos.
- `Monitoramento de Rede`: saúde do backbone, latência e POPs.
- `Monitoramento de Interfaces`: tráfego e erros por interface de equipamento.
- `Ferramentas de Rede`: diagnósticos remotos com histórico por POP/Cliente.

## Ajuda Contextual Interativa

Cada módulo possui um painel de ajuda interativo com:

- **Resumo da tela** e indicadores prioritários.
- **Checklist operacional** para turnos de NOC.
- **Ações rápidas** para navegar entre módulos.

Para abrir, clique no ícone de ajuda no topo da interface.

## Fluxo Diário Recomendado (NOC)

1. **Dashboard NOC**
   - Verifique alertas críticos e disponibilidade geral.
2. **Alertas**
   - Reconheça incidentes e classifique severidade.
3. **Monitoramento de Rede**
   - Avalie latência e POPs degradados.
4. **Monitoramento de Interfaces**
   - Cheque interfaces com erros ou tráfego anômalo.
5. **Ferramentas de Rede**
   - Execute diagnósticos vinculados a CPE/ONT.
6. **Relatórios**
   - Gere exportações de SLA quando solicitado.

## Tema e Preferências

Em `Configurações`, ajuste:

- Tema escuro para salas de NOC.
- Modo compacto para mais densidade de informação.
- Redução de movimento para acessibilidade.
- Alto contraste para ambientes com baixa iluminação.

## Monitoramento de Interfaces

Use a hierarquia **Provedor → POP → Equipamento → Interface** para:

- Validar tráfego de download/upload.
- Detectar utilização acima do limite.
- Investigar erros e perda de pacotes.

## Ferramentas de Rede (Execução Remota)

As ferramentas permitem vincular diagnósticos a um dispositivo:

- Selecionar CPE/ONT para execução.
- Salvar resultados por cliente/POP.
- Revisar histórico e comparar execuções anteriores.

## Boas Práticas de Operação

- Mantenha o checklist da ajuda atualizado em cada módulo.
- Use filtros antes de agir em alertas.
- Registre mudanças significativas em relatórios ou históricos.

## Suporte Interno

Para dúvidas sobre permissões ou módulos, valide as permissões do usuário em `Usuários` e as políticas em `Configurações`.
