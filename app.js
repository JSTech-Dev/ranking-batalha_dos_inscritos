// app.js

document.addEventListener("DOMContentLoaded", () => {
    const containerVideos = document.getElementById("lista-videos");
    // Carrega os vídeos na tela inicial
    LISTA_DE_VIDEOS.forEach(video => {
        const card = document.createElement("div");
        card.className = "card-video";
        card.onclick = () => carregarRanking(video); 

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

let dadosAtuais = []; 

function carregarRanking(video) {
    document.getElementById("secao-videos").style.display = "none";
    document.getElementById("area-ranking").style.display = "block";
    document.getElementById("titulo-ranking-atual").innerText = video.titulo;
    document.getElementById("lista-jogadores").innerHTML = "<p style='padding:20px; text-align:center'>Carregando dados...</p>";

    fetch(video.arquivo)
        .then(res => res.json())
        .then(json => {
            dadosAtuais = json.placar; 
            renderizarLista(dadosAtuais); 
        })
        .catch(erro => console.error("Erro ao ler JSON:", erro));
}

function renderizarLista(lista) {
    const container = document.getElementById("lista-jogadores");
    container.innerHTML = "";
    
    // Mostra a lista completa
    const fragmento = document.createDocumentFragment();

    lista.forEach(jogador => {
        const div = document.createElement("div");
        div.className = "linha-jogador";
        
        // --- AQUI A MUDANÇA: CLICAR NO JOGADOR ABRE O PERFIL ---
        div.onclick = () => abrirPerfilCompleto(jogador.nome);
        div.style.cursor = "pointer"; 
        // -------------------------------------------------------

        let classeRank = "rank-comum";
        if(jogador.posicao === 1) classeRank = "rank-1";
        else if(jogador.posicao === 2) classeRank = "rank-2";
        else if(jogador.posicao === 3) classeRank = "rank-3";

        // Avatar simples (Iniciais)
        let iniciais = jogador.nome.substring(0, 2).toUpperCase();
        let avatarHtml = `<div class="foto-perfil" style="background:${stringToColor(jogador.nome)}; display:inline-flex; align-items:center; justify-content:center; color:white; font-weight:bold; font-size:14px;">${iniciais}</div>`;

        div.innerHTML = `
            <div class="rank-box ${classeRank}">#${jogador.posicao}</div>
            <div class="info-box">
                ${avatarHtml}
                <div class="nome-jogador">${jogador.nome}</div>
            </div>
            <div class="kill-box">⚔ ${jogador.kills}</div>
        `;
        fragmento.appendChild(div);
    });

    container.appendChild(fragmento);
}

// =========================================================
// SISTEMA DE PERFIL GLOBAL (A Parte Importante)
// =========================================================

async function abrirPerfilCompleto(nomeJogador) {
    // 1. Abre o Modal e mostra "Carregando"
    const modal = document.getElementById("modal-perfil");
    modal.style.display = "block";
    
    document.getElementById("perfil-nome").innerText = nomeJogador;
    document.getElementById("perfil-avatar").innerText = nomeJogador.substring(0,2).toUpperCase();
    document.getElementById("perfil-avatar").style.backgroundColor = stringToColor(nomeJogador);
    
    document.getElementById("perfil-historico").innerHTML = "<p style='text-align:center; padding:20px'>Analisando histórico de batalhas...</p>";

    // 2. Variáveis para somar os dados
    let totalKills = 0;
    let totalVitorias = 0;
    let partidasJogadas = 0;
    let historicoHTML = "";

    // 3. Varre TODOS os vídeos configurados no config.js
    // Isso acontece em paralelo para ser rápido
    const promessas = LISTA_DE_VIDEOS.map(video => 
        fetch(video.arquivo).then(res => res.ok ? res.json() : null)
    );

    const resultados = await Promise.all(promessas);

    // 4. Analisa os resultados
    resultados.forEach((dadosJson, index) => {
        if(!dadosJson) return; // Pula se deu erro no arquivo

        const tituloVideo = LISTA_DE_VIDEOS[index].titulo;
        
        // Procura o jogador nesta partida específica
        const jogadorNaPartida = dadosJson.placar.find(p => p.nome === nomeJogador);

        if (jogadorNaPartida) {
            partidasJogadas++;
            totalKills += jogadorNaPartida.kills;
            if (jogadorNaPartida.posicao === 1) totalVitorias++;

            // Cria o item da lista
            let classePos = "pos-ruim";
            let textoPos = `#${jogadorNaPartida.posicao}`;
            
            if (jogadorNaPartida.posicao === 1) { classePos = "pos-1"; textoPos = "🏆 CAMPEÃO"; }
            else if (jogadorNaPartida.posicao <= 10) { classePos = "pos-top10"; textoPos = "TOP 10"; }

            historicoHTML += `
                <div class="item-historico">
                    <div>
                        <div style="font-weight:bold; color:white">${tituloVideo}</div>
                        <div style="font-size:0.8em; color:#888">Abates: ${jogadorNaPartida.kills}</div>
                    </div>
                    <div class="tag-posicao ${classePos}">${textoPos}</div>
                </div>
            `;
        }
    });

    // 5. Atualiza a tela com os números finais
    document.getElementById("stat-vitorias").innerText = totalVitorias;
    document.getElementById("stat-kills").innerText = totalKills;
    document.getElementById("stat-partidas").innerText = partidasJogadas;
    
    if(historicoHTML === "") {
        document.getElementById("perfil-historico").innerHTML = "<p>Nenhuma partida encontrada (estranho...).</p>";
    } else {
        document.getElementById("perfil-historico").innerHTML = historicoHTML;
    }
}

function fecharPerfil() {
    document.getElementById("modal-perfil").style.display = "none";
}

// Fecha se clicar fora
window.onclick = function(event) {
    const modal = document.getElementById("modal-perfil");
    if (event.target == modal) fecharPerfil();
}

function filtrarLista() {
    const termo = document.getElementById("searchBox").value.toLowerCase();
    const filtrados = dadosAtuais.filter(p => p.nome.toLowerCase().includes(termo));
    renderizarLista(filtrados);
}

function voltarParaVideos() {
    document.getElementById("secao-videos").style.display = "block";
    document.getElementById("area-ranking").style.display = "none";
    document.getElementById("searchBox").value = ""; 
}

// Função auxiliar para gerar cor baseada no nome (para ficar consistente)
function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    let color = '#';
    for (let i = 0; i < 3; i++) {
        let value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
}
