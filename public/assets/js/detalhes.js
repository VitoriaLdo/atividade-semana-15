const API = "http://localhost:3000";

function getUsuario() {
  const u = sessionStorage.getItem("usuario");
  return u ? JSON.parse(u) : null;
}

function isFavorito(livroId) {
  const usuario = getUsuario();
  if (!usuario || !usuario.favoritos) return false;
  return usuario.favoritos.includes(String(livroId));
}

async function toggleFavorito(livroId) {
  const usuario = getUsuario();
  if (!usuario) {
    alert("Você precisa estar logado para favoritar livros!");
    return;
  }

  const res = await fetch(`${API}/usuarios/${usuario.id}`);
  const dados = await res.json();
  const favs = dados.favoritos || [];
  const idx = favs.indexOf(String(livroId));

  if (idx === -1) { favs.push(String(livroId)); }
  else { favs.splice(idx, 1); }

  await fetch(`${API}/usuarios/${usuario.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ favoritos: favs })
  });

  usuario.favoritos = favs;
  sessionStorage.setItem("usuario", JSON.stringify(usuario));

  const btn = document.getElementById("btn-fav-det");
  const favoritado = favs.includes(String(livroId));
  btn.innerHTML = favoritado ? "❤️ Favoritado" : "🤍 Favoritar";
  btn.className = "btn-fav-det" + (favoritado ? " favoritado" : "");
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const area = document.getElementById("conteudo-detalhes");

  if (!id) { area.innerHTML = "<p>Livro não encontrado.</p>"; return; }

  try {
    const res = await fetch(`${API}/livros/${id}`);
    if (!res.ok) throw new Error("not found");
    const livro = await res.json();

    const usuario = getUsuario();
    const fav = isFavorito(livro.id);

    // Atualiza menu
    const menuFavoritos = document.getElementById("menu-favoritos");
    const menuLoginOut = document.getElementById("menu-loginout");
    if (usuario) {
      if (menuFavoritos) menuFavoritos.style.display = "inline";
      if (menuLoginOut) menuLoginOut.innerHTML = `<button class="btn-logout" onclick="fazerLogout()">Sair</button>`;
    } else {
      if (menuFavoritos) menuFavoritos.style.display = "none";
      if (menuLoginOut) menuLoginOut.innerHTML = `<a href="login.html" class="btn-login">Entrar</a>`;
    }

    area.innerHTML = `
      <div class="box-detalhes">
        <div class="row g-4">
          <div class="col-md-4 text-center">
            <img src="${livro.imagem}" class="imagem-detalhes" alt="${livro.nome}">
          </div>
          <div class="col-md-8">
            <span class="categoria-detalhes">${livro.categoria}</span>
            <h2 class="titulo-detalhes">${livro.nome}</h2>
            <p class="autor-detalhes">por ${livro.autor}</p>

            <div class="informacoes">
              <div class="item-info"><strong>Editora</strong><span>${livro.editora}</span></div>
              <div class="item-info"><strong>Ano</strong><span>${livro.ano}</span></div>
              <div class="item-info"><strong>Páginas</strong><span>${livro.paginas}</span></div>
              <div class="item-info"><strong>Categoria</strong><span>${livro.categoria}</span></div>
              <div class="item-info"><strong>Disponível</strong><span>${livro.emEstoque ? "✅ Sim" : "❌ Não"}</span></div>
            </div>

            <div class="descricao-detalhes">
              <h4>Sinopse</h4>
              <p>${livro.descricao}</p>
            </div>

            <div class="rodape-detalhes">
              <span class="preco-detalhes">R$ ${Number(livro.preco).toFixed(2)}</span>
              <div class="acoes-detalhes">
                ${usuario ? `<button id="btn-fav-det" class="btn-fav-det ${fav ? "favoritado" : ""}" onclick="toggleFavorito('${livro.id}')">${fav ? "❤️ Favoritado" : "🤍 Favoritar"}</button>` : ""}
                <a href="index.html" class="botao-voltar-pagina">← Voltar</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section class="fotos-relacionadas">
        <h3 class="titulo-fotos">📸 Outras Edições</h3>
        <div class="row g-4">
          ${(livro.fotos || []).map(foto => `
            <div class="col-12 col-sm-6 col-md-4">
              <div class="card-foto">
                <img src="${foto.imagem}" alt="${foto.titulo}" loading="lazy">
                <p>${foto.titulo}</p>
              </div>
            </div>
          `).join("")}
        </div>
      </section>
    `;
  } catch (e) {
    area.innerHTML = `<div class="text-center py-5"><p style="color:#c62828;">Livro não encontrado ou servidor offline.</p><a href="index.html">Voltar</a></div>`;
  }
}

function fazerLogout() {
  sessionStorage.removeItem("usuario");
  window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", init);
