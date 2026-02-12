// app.js

// 1. Ao carregar a página, monta a lista de vídeos
document.addEventListener("DOMContentLoaded", () => {
    const containerVideos = document.getElementById("lista-videos");

    LISTA_DE_VIDEOS.forEach(video => {
        const card = document.createElement("div");
        card.className = "card-video";
        card.onclick = () => carregarRanking(video); // Define o que acontece ao clicar

        card.innerHTML = `
            <img src="${video.thumb}" alt="Thumb">
            <div class="card-info">
                <span class="card-title">${video.titulo}</span>
                <span class="card-date">${video.data}</span>
            </div>
        `;
        containerVideos.appendChild(card);
    });
});

let dadosAtuais = []; // Guarda a lista do vídeo aberto

// 2. Função para abrir um vídeo e ler o JSON
function carregarRanking(video) {
    // Esconde vídeos, mostra ranking
    document.getElementById("secao-videos").style.display = "none";
    document.getElementById("area-ranking").style.display = "block";
    document.getElementById("titulo-ranking-atual").innerText = video.titulo;
    document.getElementById("lista-jogadores").innerHTML = "<p style='padding:20px; text-align:center'>Carregando dados...</p>";

    // Busca o arquivo JSON da pasta dados/
    fetch(video.arquivo)
        .then(response => {
            if (!response.ok) throw new Error("Arquivo não encontrado");
            return response.json();
        })
        .then(json => {
            dadosAtuais = json.placar; // Salva na memória
            renderizarLista(dadosAtuais); // Desenha na tela
        })
        .catch(erro => {
            document.getElementById("lista-jogadores").innerHTML = "<p style='padding:20px; color:red'>Erro ao carregar ranking. Verifique se o arquivo JSON existe na pasta dados/.</p>";
            console.error(erro);
        });
}

// 3. Função que desenha a lista de jogadores na tela
function renderizarLista(lista) {
    const container = document.getElementById("lista-jogadores");
    container.innerHTML = "";

    if (lista.length === 0) {
        container.innerHTML = "<p style='padding:20px; text-align:center'>Nenhum jogador encontrado com esse nome.</p>";
        return;
    }

    // Limita a mostrar apenas os primeiros 100 se não estiver pesquisando (para não travar o site se tiver 5000)
    // Se quiser mostrar todos, remova o .slice(0, 100)
    const listaParaExibir = document.getElementById("searchBox").value === "" ? lista.slice(0, 200) : lista;

    listaParaExibir.forEach(jogador => {
        const div = document.createElement("div");
        div.className = "linha-jogador";
        
        // Estilo especial para top 3
        let classeRank = "rank-comum";
        if(jogador.posicao === 1) classeRank = "rank-1";
        else if(jogador.posicao === 2) classeRank = "rank-2";
        else if(jogador.posicao === 3) classeRank = "rank-3";

        div.innerHTML = `
            <div class="rank-box ${classeRank}">#${jogador.posicao}</div>
            <div class="info-box">
                <div class="nome-jogador">${jogador.nome}</div>
            </div>
            <div class="kill-box">⚔ ${jogador.kills}</div>
        `;
        container.appendChild(div);
    });

    if (listaParaExibir.length < lista.length) {
        const aviso = document.createElement("div");
        aviso.style.padding = "15px";
        aviso.style.textAlign = "center";
        aviso.style.color = "#888";
        aviso.innerText = `... e mais ${lista.length - listaParaExibir.length} jogadores. Use a busca para encontrar alguém específico.`;
        container.appendChild(aviso);
    }
}

// 4. Função de Pesquisa
function filtrarLista() {
    const termo = document.getElementById("searchBox").value.toLowerCase();
    
    const filtrados = dadosAtuais.filter(jogador => 
        jogador.nome.toLowerCase().includes(termo)
    );

    renderizarLista(filtrados);
}

// 5. Botão Voltar
function voltarParaVideos() {
    document.getElementById("secao-videos").style.display = "block";
    document.getElementById("area-ranking").style.display = "none";
    document.getElementById("searchBox").value = ""; // Limpa a busca
    dadosAtuais = [];
}