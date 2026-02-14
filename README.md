# CondoFlow - Sistema de Gestão de Condomínio

Aplicação web front-end para gestão condominial com módulos de:

- Dashboard com indicadores
- Cadastro e busca de moradores
- Financeiro (resumo + boletos)
- Manutenção
- Reservas de áreas comuns
- Comunicados

## Como executar

```bash
python3 -m http.server 4173
```

Abra `http://localhost:4173` no navegador.

## Melhorias implementadas

- Persistência local com `localStorage` (dados continuam após recarregar a página).
- Botão **Reset demo** para restaurar os dados iniciais.
- Feedback não-bloqueante por toast (sem `alert`).
- Renderização de tabela com `textContent` para evitar injeção via HTML.

## Próximos passos

- API + autenticação por perfil (síndico, conselho, portaria, morador).
- Integração com pagamentos e emissão de boletos.
- Módulo de assembleias e votações.
