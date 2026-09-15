# BMC Academy — Protótipo (Fase 0/1)

Protótipo funcional para validação interna, conforme combinado — fluxo completo
ponta a ponta (login → treinamento → prova → certificado → notificação).
**Zero custo**: usa apenas serviços com camada gratuita (Postgres gerenciado
gratuito no Neon/Supabase para produção, ou um Postgres local de graça para
testar na sua máquina).

## Requisitos

- [Node.js](https://nodejs.org) versão 20 ou superior (o protótipo foi criado com a v22).
- Um banco Postgres. Duas opções, sem custo:
  - **Mais simples para só testar**: crie uma conta gratuita em
    [neon.tech](https://neon.tech) ou [supabase.com](https://supabase.com) e
    copie a "connection string" (URL) do banco.
  - **Rodar 100% offline**: instale o Postgres na sua máquina
    ([guia oficial](https://www.postgresql.org/download/)).

## Como rodar

```bash
npm install
cp .env.local.example .env.local
# edite .env.local:
#  - SESSION_SECRET: troque por um valor aleatório (o próprio arquivo explica como gerar)
#  - DATABASE_URL: cole a connection string do seu Postgres (Neon/Supabase ou local)
npm run db:push               # cria as tabelas no banco
npm run db:seed               # popula usuários de teste + 1 treinamento de EXEMPLO (fictício)
npm run db:import-real-exams  # importa as 8 provas REAIS de Entrega Técnica (ver aviso abaixo)
npm run dev                   # inicia o servidor local
```

Abra http://localhost:3000 no navegador.

## Usuários de teste (criados pelo `db:seed`)

| Perfil     | E-mail                              | Senha      |
|------------|--------------------------------------|------------|
| Admin      | admin@teste.bmcacademy.local         | admin123   |
| Gestor     | gestor@teste.bmcacademy.local        | gestor123  |
| Técnico    | tecnico@teste.bmcacademy.local       | tecnico123 |
| RC         | rc@teste.bmcacademy.local            | rc123456   |

Todos fictícios — nenhum dado real da BMC foi usado nesses.

O Telles também tem um login real de Administrador (e-mail
`telles.paz@bmchyundai.com.br`) — a senha foi enviada separadamente, fora
deste arquivo.

## Conteúdo real importado (`db:import-real-exams`)

As 8 provas de Entrega Técnica que o Telles compartilhou no SharePoint (HB640C,
HX150/HX180/HX220/HX260, HX400L, HG170-3, HL745-9, HX60S, Empilhadeira 25/35D
e Empilhadeira 160D/250D) já estão cadastradas com as perguntas e alternativas
**reais**, tal como nos documentos originais.

**Atenção — gabarito pendente**: ao ler os documentos de gabarito
remotamente, o texto veio idêntico ao da prova (a marcação da resposta certa —
negrito/grifo do Word — não sobrevive à extração remota de texto). Por
decisão do Telles, o conteúdo foi importado mesmo assim, mas:

- Nenhuma alternativa está marcada como correta ainda.
- Todos esses 8 treinamentos entram como **rascunho** (não aparecem para
  técnicos/RCs).
- Cada um também está sem vídeo cadastrado (lição de texto avisando que falta
  o link do vídeo real).

Para liberar cada um: Admin → Treinamentos → abra o treinamento → marque as
alternativas corretas de cada questão (removendo e recriando a questão com a
alternativa certa marcada, pela tela atual do protótipo) → troque a lição de
texto pelo link do vídeo real → clique em "Publicar".

## O que já funciona (fluxo ponta a ponta do MVP)

- Login por e-mail/senha (dentro da própria plataforma, como combinado).
- Admin: cadastra usuários, cria treinamentos (com lições em vídeo/PDF/texto/link),
  cria provas com questões de múltipla escolha, verdadeiro/falso e múltiplas
  respostas, atribui treinamentos, publica/despublica.
- Painel administrativo com números gerais (usuários, treinamentos, progresso,
  certificados emitidos, média de notas).
- Técnico/RC: painel "Meus treinamentos", assiste ao conteúdo, "continuar de
  onde parou", faz a prova (com limite de tentativas), vê nota e gabarito.
- Ao ser aprovado: certificado em PDF gerado automaticamente (com QR code de
  validação e link público de autenticidade), e-mail simulado registrado
  (para o usuário e para o gestor direto, quando cadastrado).
- Gestor: acompanha o status de treinamento da sua equipe.
- Log de auditoria (login, criação de usuário/treinamento, provas, certificados).

## O que é simplificado de propósito (protótipo)

- **Banco de dados**: Postgres (Neon/Supabase têm camada gratuita permanente,
  não é trial). É o mesmo banco recomendado para produção com os ~500
  usuários reais — não precisa trocar nada na estrutura.
- **E-mail**: por enquanto só fica registrado no sistema (histórico de
  notificações) e aparece no console do servidor — não é enviado de verdade.
  Nenhum provedor foi contratado. Quando decidirmos o provedor (Resend, SendGrid
  ou Amazon SES — todos têm camada gratuita), é uma troca pontual no arquivo
  `src/lib/notifications.ts`.
- **Vídeos**: para os treinamentos reais, recomendo hospedar os vídeos no
  YouTube (não listado) ou Vimeo, e só colar o link — assim não pagamos
  hospedagem de vídeo.
- **Gabarito das 8 provas reais**: pendente, ver seção acima.
- **Cor/marca**: usei o azul extraído das logos que você enviou como
  aproximação. A cor oficial em hex e o manual de marca completo ficam
  pendentes (você disse que vê isso depois).
- **Gisele e demais gestores/admins**: ainda não foram cadastrados de verdade —
  nenhum contato foi inventado. Quando você validar a ideia e me passar quem
  são, cadastro certinho.
- **Comunicação ao gestor**: hoje notifica o gestor direto cadastrado do
  usuário (campo "gestor responsável"). O aviso mais amplo aos administradores
  (você + Gisele) entra quando os contatos forem confirmados.
- **Integração com o SAB**: não iniciada (é a última etapa do projeto, como
  combinado).
- Tipo de questão "associação" e recursos de matriz de capacitação, WhatsApp e
  relatórios avançados ficam para as próximas fases.

## Próximos passos sugeridos

1. Você testa este protótipo com a Gisele.
2. Confirma o gabarito das 8 provas reais (ver seção acima) e me passa os
   contatos reais dos gestores/admins.
3. Publicamos de verdade na internet (GitHub + Vercel + Neon/Supabase — tudo
   gratuito).
4. Seguimos fase a fase pelo roadmap do Prompt Mestre (matriz de capacitação,
   WhatsApp, relatórios avançados, integração SAB por último).
