const API = "http://localhost:3000";

function getUsuario() {
  const u = sessionStorage.getItem("usuario");
  return u ? JSON.parse(u) : null;
}

function fazerLogout() {
  sessionStorage.removeItem("usuario");
  window.location.href = "index.html";
}

async function toggleFavorito(livroId, btn) {
  const usuario = getUsuario();
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

  // Remove card se não é mais favorito
  if (!favs.includes(String(livroId))) {
    btn.closest(".col-12").remove();
    const area = document.getElementById("lista-favs");
    if (area.children.length === 0) renderVazio();
  } else {
    btn.textContent = "❤️";
  }
}

function renderVazio() {
  document.getElementById("lista-favs").innerHTML = `
    <div class="vazio-msg">
      <span>📚</span>
      <h3>Nenhum favorito ainda</h3>
      <p>Explore os livros e adicione aos seus favoritos!</p>
      <a href="index.html">Ver livros</a>
    </div>`;
}

async function init() {
  const usuario = getUsuario();
  if (!usuario) {
    window.location.href = "login.html?redirect=favoritos.html";
    return;
  }

  document.getElementById("nome-usuario").textContent = usuario.nome.split(" ")[0];

  const dadosAtual = await fetch(`${API}/usuarios/${usuario.id}`).then(r => r.json());
  const favIds = dadosAtual.favoritos || [];
  usuario.favoritos = favIds;
  sessionStorage.setItem("usuario", JSON.stringify(usuario));

  const area = document.getElementById("lista-favs");

  if (favIds.length === 0) {
    renderVazio();
    return;
  }

  const livros = await fetch(`${API}/livros`).then(r => r.json());
  const favLivros = livros.filter(l => favIds.includes(String(l.id)));

  if (favLivros.length === 0) {
    renderVazio();
    return;
  }

  area.innerHTML = favLivros.map(l => `
    <div class="col-12 col-sm-6 col-lg-3">
      <div class="card-livro">
        <div class="imagem-card">
          <img src="${l.imagem}" alt="${l.nome}" loading="lazy">
          <button class="btn-favorito" title="Remover dos favoritos" onclick="toggleFavorito('${l.id}', this)">❤️</button>
        </div>
        <div class="conteudo-card" onclick="window.location='detalhes.html?id=${l.id}'" style="cursor:pointer;">
          <span class="categoria-card">${l.categoria}</span>
          <h3 class="titulo-card">${l.nome}</h3>
          <p class="autor-card">${l.autor}</p>
          <div class="rodape-card">
            <span class="preco-card">R$ ${Number(l.preco).toFixed(2)}</span>
            <a href="detalhes.html?id=${l.id}" class="botao-card" onclick="event.stopPropagation()">Ver mais</a>
          </div>
        </div>
      </div>
    </div>
  `).join("");
}

document.addEventListener("DOMContentLoaded", init);
