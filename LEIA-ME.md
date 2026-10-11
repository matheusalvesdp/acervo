# Meu Acervo

Site para registrar coisas da vida, organizado em seções no menu lateral:

| Seção | Subseções | Imagem e informações automáticas |
|---|---|---|
| Estante | Filmes, Séries, Animes, Livros | TMDB (filmes, séries, animes), Google Books / Open Library (livros) |
| Bebidas | Vinhos, Whiskys, Cervejas | Wikipédia (quando o rótulo for conhecido) |
| Viagens | Países, Cidades | Wikipédia |
| Jogos | PlayStation 5, Xbox, Nintendo, Steam, Mobile, Outras plataformas | RAWG |

Cada pessoa cria a própria conta e só vê os próprios registros. Tudo usa planos gratuitos: GitHub Pages (site), Supabase (login e banco de dados), TMDB e RAWG (capas e informações). A Wikipédia não precisa de chave.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html`, `style.css`, `app.js` | O site |
| `config.js` | **Onde você cola as suas chaves** (único arquivo que precisa editar) |
| `supabase.sql` | Cria a tabela e as regras de privacidade no Supabase |
| `manifest.webmanifest`, `icon.svg` | Permitem "instalar" o site na tela inicial do celular |

---

## Passo 1 — Supabase (login e banco de dados)

1. Entre em **supabase.com**, crie uma conta (pode usar o e-mail pessoal ou o GitHub) e clique em **New project**.
   - Nome: `estante`. Crie uma senha para o banco (guarde, mas o site não usa). Região: **South America (São Paulo)**.
2. Quando o projeto terminar de criar, abra **SQL Editor → New query**, cole todo o conteúdo de `supabase.sql` e clique em **Run**. Deve aparecer "Success".
3. Abra **Authentication → Sign In / Providers → Email** e **desligue "Confirm email"**. Salve.
   - Motivo: o envio de e-mails grátis do Supabase só funciona para os membros do projeto. Com a confirmação ligada, as outras pessoas não conseguiriam terminar o cadastro. Veja "Melhorias opcionais" para ligar de novo depois.
4. Abra **Project Settings → API Keys** (ou **API**) e copie:
   - **Project URL** (algo como `https://abcd1234.supabase.co`). Às vezes fica em **Project Settings → Data API**.
   - A chave pública: a **Publishable key** (começa com `sb_publishable_`) ou, em projetos mais antigos, a chave **anon / public** (começa com `eyJ`). As duas funcionam.
   - **Nunca** use a chave `service_role` / `secret` no site.

## Passo 2 — TMDB (capas e sinopses de filmes e séries)

1. Crie uma conta em **themoviedb.org**.
2. Vá em **Configurações → API** e peça uma chave do tipo **Desenvolvedor / uso pessoal**. O formulário pede um endereço de site: pode colocar o do GitHub Pages do Passo 4 (`https://SEU-USUARIO.github.io/estante`).
3. Copie a **Chave da API** (API Key).

## Passo 2b — RAWG (capas e informações de jogos)

1. Crie uma conta em **rawg.io** e abra **rawg.io/apidocs**.
2. Clique em **Get API Key**, preencha o formulário (uso pessoal) e copie a chave.
3. As descrições dos jogos vêm em inglês; você pode editar antes de salvar.

## Passo 3 — Colar as chaves

Abra `config.js` num editor de texto (Bloco de Notas serve) e troque os textos `COLE_AQUI_...` pelos valores copiados. Mantenha as aspas:

```js
SUPABASE_URL: "https://abcd1234.supabase.co",
SUPABASE_ANON_KEY: "eyJhbGciOi...",
TMDB_KEY: "1a2b3c4d...",
RAWG_KEY: "9f8e7d6c...",
```

Essas chaves podem ficar visíveis no site: a do Supabase é pública por natureza (quem protege os dados são as regras do `supabase.sql`) e as do TMDB e do RAWG só consultam informações de filmes e jogos.

## Passo 4 — Publicar no GitHub Pages (conta pessoal)

1. Entre no GitHub com a conta pessoal e crie um repositório **público** chamado `estante` (**New repository**). Marque "Add a README file" para ele já nascer com a branch `main`.
2. No repositório, clique em **Add file → Upload files** e arraste **os arquivos de dentro da pasta `estante`** (não a pasta em si), já com o `config.js` editado. Clique em **Commit changes**.
3. Vá em **Settings → Pages**. Em "Build and deployment", escolha **Deploy from a branch**, branch **main**, pasta **/ (root)** e clique em **Save**.
4. Em 1 ou 2 minutos o site fica no ar em `https://SEU-USUARIO.github.io/estante/`.

## Passo 5 — Avisar o Supabase do endereço do site

No Supabase, abra **Authentication → URL Configuration**:

- **Site URL**: `https://SEU-USUARIO.github.io/estante/`
- **Redirect URLs**: adicione o mesmo endereço.

Pronto. Abra o site, clique em **Criar conta** e adicione o primeiro registro. Para outras pessoas usarem, é só mandar o link: cada uma cria a própria conta.

---

## Atualizar o site depois

Quando houver uma versão nova dos arquivos, repita o **Add file → Upload files** no repositório com os arquivos novos. **Não envie o `config.js` de novo** se ele não mudou, para não apagar suas chaves.

### Atualização para o Meu Acervo (seções)

1. No Supabase, abra **SQL Editor → New query**, cole o `supabase.sql` novo inteiro e clique em **Run**. Seus registros atuais vão para a seção Estante, sem perder nada.
2. Faça o Passo 2b (chave do RAWG) e, no **seu** `config.js`, acrescente esta linha logo abaixo da linha do `TMDB_KEY`:
   ```js
   RAWG_KEY: "SUA_CHAVE_DO_RAWG",
   ```
   (Edite direto no GitHub: abra o `config.js` no repositório, clique no lápis, cole a linha e clique em **Commit changes**.)
3. Envie os arquivos novos: `index.html`, `app.js`, `style.css` e `manifest.webmanifest`.

## Importar e exportar

Use **Importar** no rodapé do menu lateral com um arquivo `.json`. O formato é o mesmo do botão **Exportar (JSON)**.

## Melhorias opcionais

- **Entrar com Google**: no Google Cloud Console, crie credenciais OAuth (tipo "Aplicativo da Web") com o endereço de retorno que o Supabase mostra em **Authentication → Sign In / Providers → Google**. Cole o Client ID e o Secret no Supabase, ative o provedor e mude `LOGIN_GOOGLE` para `true` no `config.js`.
- **Confirmação de e-mail**: configure um serviço de e-mail (por exemplo Resend, com plano grátis) em **Authentication → Emails → SMTP Settings** e religue "Confirm email".
- **Muitos livros sem resultado**: o Google Books limita buscas sem chave. Crie uma chave da "Books API" no Google Cloud Console e cole em `GOOGLE_BOOKS_KEY`. Sem ela, o site usa o Open Library quando o Google Books não responde.

## Limites dos planos gratuitos

- **Supabase**: 500 MB de banco (dá para centenas de milhares de registros) e 50 mil usuários ativos por mês. Projetos sem uso por 7 dias são pausados; basta entrar no painel do Supabase e clicar em "Restore".
- **GitHub Pages**: repositório precisa ser público no plano grátis.
