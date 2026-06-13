const API = "http://localhost:3000";

function getUsuario() {
  const u = sessionStorage.getItem("usuario");
  return u ? JSON.parse(u) : null;
}

async function fazerLogin(e) {
  e.preventDefault();
  const login = document.getElementById("login").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const erro = document.getElementById("msg-erro");

  erro.style.display = "none";

  try {
    const res = await fetch(`${API}/usuarios?login=${encodeURIComponent(login)}&senha=${encodeURIComponent(senha)}`);
    const usuarios = await res.json();

    if (usuarios.length === 0) {
      erro.textContent = "Login ou senha incorretos.";
      erro.style.display = "block";
      return;
    }

    const usuario = usuarios[0];
    sessionStorage.setItem("usuario", JSON.stringify(usuario));

    const redirect = new URLSearchParams(window.location.search).get("redirect") || "index.html";
    window.location.href = redirect;
  } catch (err) {
    erro.textContent = "Erro ao conectar ao servidor. Verifique se o JSONServer está ativo.";
    erro.style.display = "block";
  }
}

async function fazerCadastro(e) {
  e.preventDefault();
  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const login = document.getElementById("login").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const confirmar = document.getElementById("confirmar").value.trim();
  const erro = document.getElementById("msg-erro");
  const sucesso = document.getElementById("msg-sucesso");

  erro.style.display = "none";
  sucesso.style.display = "none";

  if (senha !== confirmar) {
    erro.textContent = "As senhas não conferem.";
    erro.style.display = "block";
    return;
  }

  if (login.length < 3) {
    erro.textContent = "O login deve ter pelo menos 3 caracteres.";
    erro.style.display = "block";
    return;
  }

  try {
   
    const check = await fetch(`${API}/usuarios?login=${encodeURIComponent(login)}`);
    const existe = await check.json();

    if (existe.length > 0) {
      erro.textContent = "Este login já está em uso. Escolha outro.";
      erro.style.display = "block";
      return;
    }

    const novoUsuario = {
      id: crypto.randomUUID(),
      login, senha, nome, email,
      favoritos: []
    };

    await fetch(`${API}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novoUsuario)
    });

    sucesso.textContent = "Cadastro realizado com sucesso! Redirecionando...";
    sucesso.style.display = "block";

    setTimeout(() => { window.location.href = "login.html"; }, 1800);
  } catch (err) {
    erro.textContent = "Erro ao cadastrar. Verifique se o JSONServer está ativo.";
    erro.style.display = "block";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  
  if (getUsuario() && document.getElementById("form-login")) {
    window.location.href = "index.html";
  }

  document.getElementById("form-login")?.addEventListener("submit", fazerLogin);
  document.getElementById("form-cadastro")?.addEventListener("submit", fazerCadastro);
});
