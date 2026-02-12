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

// app.js - Versão Inteligente (Busca fotos sozinha)

function renderizarLista(lista) {
    const container = document.getElementById("lista-jogadores");
    container.innerHTML = "";

    if (lista.length === 0) {
        container.innerHTML = "<p style='padding:20px; text-align:center'>Nenhum jogador encontrado.</p>";
        return;
    }

    // LISTA COMPLETA (Sem limite de 200)
    const listaParaExibir = lista; 
    const fragmento = document.createDocumentFragment();

    listaParaExibir.forEach(jogador => {
        const div = document.createElement("div");
        div.className = "linha-jogador";
        
        // Define as cores do Top 3
        let classeRank = "rank-comum";
        if(jogador.posicao === 1) classeRank = "rank-1";
        else if(jogador.posicao === 2) classeRank = "rank-2";
        else if(jogador.posicao === 3) classeRank = "rank-3";

        // --- MÁGICA DA FOTO AUTOMÁTICA ---
        // 1. Limpa o nome (tira o @ e espaços extras)
        let nomeLimpo = jogador.nome.replace('@', '').trim();
        
        // 2. Monta o link do Unavatar (Tenta achar a foto na web)
        // O "?ttl=1h" faz cache por 1 hora para o site ficar rápido
        let urlFoto = `https://unavatar.io/${nomeLimpo}?ttl=1h`;

        // 3. Monta o link de Fallback (Iniciais coloridas caso não ache a foto)
        let urlFallback = `https://ui-avatars.com/api/?name=${nomeLimpo}&background=random&color=fff&size=128`;
        // ----------------------------------

        div.innerHTML = `
            <div class="rank-box ${classeRank}">#${jogador.posicao}</div>
            
            <div class="info-box">
                <img src="${urlFoto}" class="foto-perfil" onerror="this.src='${urlFallback}'">
                
                <div class="nome-jogador">${jogador.nome}</div>
            </div>
            
            <div class="kill-box">⚔ ${jogador.kills}</div>
        `;
        fragmento.appendChild(div);
    });

    container.appendChild(fragmento);

    // Mostra o total no final
    const contador = document.createElement("div");
    contador.style.padding = "20px";
    contador.style.textAlign = "center";
    contador.style.color = "#666";
    contador.innerText = `Total de guerreiros: ${listaParaExibir.length}`;
    container.appendChild(contador);
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

