const API = "http://localhost:3000";

function getUsuario() {
  const u = sessionStorage.getItem("usuario");
  return u ? JSON.parse(u) : null;
}

async function atualizarMenu() {
  const usuario = getUsuario();
  const menuFavoritos = document.getElementById("menu-favoritos");
  const menuLoginOut = document.getElementById("menu-loginout");
  const menuUsuario = document.getElementById("menu-usuario");

  if (usuario) {
    if (menuFavoritos) menuFavoritos.style.display = "inline";
    if (menuLoginOut) menuLoginOut.innerHTML = `<button class="btn-logout" onclick="logout()">Sair</button>`;
    if (menuUsuario) menuUsuario.textContent = `Olá, ${usuario.nome.split(" ")[0]}`;
    if (menuUsuario) menuUsuario.style.display = "inline";
  } else {
    if (menuFavoritos) menuFavoritos.style.display = "none";
    if (menuLoginOut) menuLoginOut.innerHTML = `<a href="login.html" class="btn-login">Entrar</a>`;
    if (menuUsuario) menuUsuario.style.display = "none";
  }
}

function logout() {
  sessionStorage.removeItem("usuario");
  window.location.reload();
}

async function fetchLivros() {
  const res = await fetch(`${API}/livros`);
  return res.json();
}

async function fetchUsuario(id) {
  const res = await fetch(`${API}/usuarios/${id}`);
  return res.json();
}

async function toggleFavorito(livroId, btn) {
  const usuario = getUsuario();
  if (!usuario) {
    alert("Você precisa estar logado para favoritar livros!");
    return;
  }

  const dados = await fetchUsuario(usuario.id);
  const favs = dados.favoritos || [];
  const idx = favs.indexOf(String(livroId));

  if (idx === -1) {
    favs.push(String(livroId));
  } else {
    favs.splice(idx, 1);
  }

  await fetch(`${API}/usuarios/${usuario.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ favoritos: favs })
  });

  usuario.favoritos = favs;
  sessionStorage.setItem("usuario", JSON.stringify(usuario));

  btn.textContent = favs.includes(String(livroId)) ? "❤️" : "🤍";
  btn.title = favs.includes(String(livroId)) ? "Remover dos favoritos" : "Adicionar aos favoritos";
}

function isFavorito(livroId) {
  const usuario = getUsuario();
  if (!usuario || !usuario.favoritos) return false;
  return usuario.favoritos.includes(String(livroId));
}

async function mostrarDestaques(livros) {
  const area = document.getElementById("lista-destaques");
  if (!area) return;
  const destaques = livros.filter(l => l.destaque);

  area.innerHTML = destaques.map((livro, i) => `
    <div class="carousel-item ${i === 0 ? "active" : ""}">
      <a href="detalhes.html?id=${livro.id}" class="slide" style="text-decoration:none;">
        <div class="imagem-slide-area">
          <img src="${livro.imagem}" alt="${livro.nome}" class="imagem-slide">
        </div>
        <div class="slide-texto">
          <span class="categoria-slide">${livro.categoria}</span>
          <h3>${livro.nome}</h3>
          <p class="autor-slide">${livro.autor}</p>
        </div>
      </a>
    </div>
  `).join("");
}

function criarCard(livro) {
  const fav = isFavorito(livro.id);
  const icone = fav ? "❤️" : "🤍";
  const titulo = fav ? "Remover dos favoritos" : "Adicionar aos favoritos";
  const usuario = getUsuario();

  return `
    <div class="col-12 col-sm-6 col-lg-3">
      <div class="card-livro">
        <div class="imagem-card">
          <img src="${livro.imagem}" alt="${livro.nome}" loading="lazy">
          ${usuario ? `<button class="btn-favorito" title="${titulo}" onclick="event.stopPropagation(); toggleFavorito('${livro.id}', this)">${icone}</button>` : ""}
        </div>
        <div class="conteudo-card" onclick="window.location='detalhes.html?id=${livro.id}'" style="cursor:pointer;">
          <span class="categoria-card">${livro.categoria}</span>
          <h3 class="titulo-card">${livro.nome}</h3>
          <p class="autor-card">${livro.autor}</p>
          <div class="rodape-card">
            <span class="preco-card">R$ ${Number(livro.preco).toFixed(2)}</span>
            <a href="detalhes.html?id=${livro.id}" class="botao-card" onclick="event.stopPropagation()">Ver mais</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function mostrarLivros(lista) {
  const area = document.getElementById("lista-livros");
  if (!area) return;
  area.innerHTML = lista.map(criarCard).join("");
}

let todosLivros = [];

async function filtrarLivros() {
  const texto = document.getElementById("campo-busca")?.value.toLowerCase() || "";
  const categoria = document.getElementById("filtro-categoria")?.value || "Todas";

  const filtrado = todosLivros.filter(l =>
    (l.nome.toLowerCase().includes(texto) || l.descricao.toLowerCase().includes(texto)) &&
    (categoria === "Todas" || l.categoria === categoria)
  );

  mostrarLivros(filtrado);
}

function mostrarCategorias(livros) {
  const select = document.getElementById("filtro-categoria");
  if (!select) return;
  const cats = ["Todas", ...new Set(livros.map(l => l.categoria))];
  select.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join("");
}

async function mostrarGraficos(livros) {
  
  document.getElementById("stat-total").textContent = livros.length;
  document.getElementById("stat-estoque").textContent = livros.filter(l => l.emEstoque).length;
  document.getElementById("stat-indisponivel").textContent = livros.filter(l => !l.emEstoque).length;

  const categorias = {};
  livros.forEach(l => { categorias[l.categoria] = (categorias[l.categoria] || 0) + 1; });

  new Chart(document.getElementById("grafico-categorias"), {
    type: "doughnut",
    data: {
      labels: Object.keys(categorias),
      datasets: [{
        data: Object.values(categorias),
        backgroundColor: ["#234d20", "#4f772d", "#90a955", "#c9df8a", "#31572c", "#6a994e", "#a7c957"]
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } }
    }
  });

  const precoMedio = {};
  const contagem = {};
  livros.forEach(l => {
    if (!precoMedio[l.categoria]) { precoMedio[l.categoria] = 0; contagem[l.categoria] = 0; }
    precoMedio[l.categoria] += Number(l.preco);
    contagem[l.categoria]++;
  });
  Object.keys(precoMedio).forEach(k => { precoMedio[k] = (precoMedio[k] / contagem[k]).toFixed(2); });

  new Chart(document.getElementById("grafico-precos"), {
    type: "bar",
    data: {
      labels: Object.keys(precoMedio),
      datasets: [{
        label: "Preço médio (R$)",
        data: Object.values(precoMedio),
        backgroundColor: "#4f772d"
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } },
      plugins: { legend: { display: false } }
    }
  });
}

async function init() {
  await atualizarMenu();

  try {
    todosLivros = await fetchLivros();

    const usuario = getUsuario();
    if (usuario) {
      const dadosAtual = await fetchUsuario(usuario.id);
      usuario.favoritos = dadosAtual.favoritos || [];
      sessionStorage.setItem("usuario", JSON.stringify(usuario));
    }

    await mostrarDestaques(todosLivros);
    mostrarCategorias(todosLivros);
    await mostrarLivros(todosLivros);
    await mostrarGraficos(todosLivros);

    document.getElementById("campo-busca")?.addEventListener("input", filtrarLivros);
    document.getElementById("filtro-categoria")?.addEventListener("change", filtrarLivros);
  } catch (e) {
    console.error("Erro ao carregar dados:", e);
    document.getElementById("lista-livros").innerHTML = `
      <div class="col-12 text-center py-5">
        <p style="color:#c62828;">⚠️ Não foi possível conectar ao servidor. Verifique se o JSONServer está rodando na porta 3000.</p>
        <code>npm start</code>
      </div>`;
  }
}

document.addEventListener("DOMContentLoaded", init);
