# Sistema de Internacionalização - OctoISP

Este documento descreve o sistema de internacionalização implementado na plataforma OctoISP, com foco inicial no suporte ao português brasileiro.

## Visão Geral

O sistema de internacionalização (i18n) do OctoISP foi projetado para suportar múltiplos idiomas, com o português brasileiro como idioma padrão. O sistema permite a fácil adição de novos idiomas conforme necessário.

## Estrutura de Arquivos

- `src/i18n/`: Pasta contendo os arquivos de tradução
  - `pt-br.json`: Traduções para o português brasileiro
- `src/utils/i18n.js`: Funções utilitárias para gerenciamento de traduções

## Adicionando Novos Idiomas

Para adicionar um novo idioma:

1. Crie um novo arquivo JSON em `src/i18n/` com o nome `{idioma}.json`
2. Siga a mesma estrutura do arquivo `pt-br.json`
3. Adicione o novo idioma ao objeto `dictionaries` no arquivo `src/utils/i18n.js`

## Uso no Código

As funções de tradução estão disponíveis em `src/utils/i18n.js`. Para usá-las:

```javascript
import { t } from '../utils/i18n';

// Exemplo de uso
const buttonText = t('common.save'); // Retorna 'Salvar' em pt-BR
```

## Estrutura de Chaves

A estrutura das chaves de tradução segue o padrão:

- `common`: Termos gerais usados em várias partes da aplicação
- `navigation`: Itens de navegação
- `dashboard`: Elementos específicos do dashboard
- `devices`: Elementos relacionados a dispositivos
- `customers`: Elementos relacionados a clientes
- `alerts`: Elementos relacionados a alertas
- `auth`: Elementos de autenticação

## Melhorias Futuras

- Adicionar suporte a outros idiomas (inglês, espanhol)
- Implementar detecção automática de idioma do navegador
- Criar hook React para facilitar o uso de traduções
- Adicionar suporte a parâmetros nas traduções

## Convenções

- Todas as chaves devem estar em letras minúsculas
- Use sublinhados para separar palavras nas chaves
- Mantenha a estrutura de objetos consistente entre os diferentes arquivos de idioma
- Sempre forneça valores padrão para evitar erros

## Configuração de Ambiente

A variável `VITE_DEFAULT_LANGUAGE` no arquivo `.env` define o idioma padrão da aplicação.