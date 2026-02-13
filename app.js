// =========================================================
// APP.JS - VERSÃO PREMIUM (DESIGN + LÓGICA BLINDADA)
// =========================================================

// --- FUNÇÕES DE UTILIDADE ---
function extrairIdYoutube(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

async function getMediaData(video) {
    const dados = {
        thumb: video.thumb || "https://via.placeholder.com/400x225/111/333?text=Carregando",
        link: video.videoUrl || "#",
        plataforma: "link",
        icon: "fas fa-play"
    };

    if (!video.videoUrl) return dados;

    const ytId = extrairIdYoutube(video.videoUrl);
    if (ytId) {
        dados.thumb = `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
        dados.plataforma = "youtube";
        dados.icon = "fab fa-youtube";
        return dados;
    }

    if (video.videoUrl.includes("tiktok.com")) {
        dados.plataforma = "tiktok";
        dados.icon = "fab fa-tiktok";
        try {
            const apiUrl = `https://corsproxy.io/?` + encodeURIComponent(`https://www.tikwm.com/api/?url=${video.videoUrl}`);
            const resposta = await fetch(apiUrl);
            const json = await resposta.json();
            if (json.data && json.data.cover) {
                dados.thumb = json.data.cover;
            }
        } catch (erro) { console.error("TikTok Thumb Error:", erro); }
    }
    return dados;
}

// --- FUNÇÃO DE AVATAR (AQUELE CÓDIGO QUE VOCÊ MANDOU) ---
function gerarHtmlAvatar(nome, urlFotoOriginal, isLarge = false) {
    const nomeLimpo = nome.replace('@', '').trim();
    let srcImagem = urlFotoOriginal;
    
    if (!srcImagem || srcImagem === "") {
        srcImagem = `https://unavatar.io/${nomeLimpo}?ttl=1h`;
    }

    const backupAvatar = `https://ui-avatars.com/api/?name=${nome}&background=random&color=fff&size=128`;
    const cssClass = isLarge ? "avatar-large" : "foto-mini";

    return `
        <img src="${srcImagem}" 
             class="${cssClass}" 
             referrerpolicy="no-referrer" 
             onerror="this.onerror=null; this.src='${backupAvatar}'">
    `;
}

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
    carregarGradeVideos();
});

// Renderiza a grade inicial
function carregarGradeVideos() {
    const container = document.getElementById("view-videos");
    container.innerHTML = "";
    
    if(typeof LISTA_DE_VIDEOS !== 'undefined') {
        LISTA_DE_VIDEOS.forEach(async (video) => {
            const mediaData = await getMediaData(video);
            
            const card = document.createElement("div");
            card.className = "card-video";
            card.onclick = () => abrirRanking(video);

            card.innerHTML = `
                <div class="thumb-container">
                    <img src="${mediaData.thumb}" alt="Capa">
                    <div class="play-overlay">
                        <div class="play-btn"><i class="${mediaData.icon}"></i></div>
                    </div>
                </div>
                <div class="card-info">
                    <span class="card-title">${video.titulo}</span>
                    <div class="card-meta">
                        <span><i class="far fa-calendar"></i> ${video.data}</span>
                        <span><i class="fas fa-trophy"></i> Oficial</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }
}

let dadosPartidaAtual = [];

// Abre a tela de Ranking
function abrirRanking(video) {
    // Transição de telas
    document.getElementById("view-videos").style.display = "none";
    document.getElementById("view-ranking").style.display = "block";
    document.getElementById("page-title").innerText = video.titulo;
    
    // Reset Stats
    document.getElementById("lista-jogadores").innerHTML = `
        <div style="padding:40px; text-align:center; color:#666;">
            <i class="fas fa-circle-notch fa-spin fa-2x"></i><br>Carregando dados...
        </div>`;

    // Botão Assistir no Header
    const searchWrapper = document.querySelector('.search-wrapper');
    const btnExistente = document.getElementById('btn-watch-action');
    if(btnExistente) btnExistente.remove();

    if(video.videoUrl) {
        const btn = document.createElement('button');
        btn.id = 'btn-watch-action';
        btn.className = 'nav-btn active'; // Reutilizando estilo
        btn.style.width = 'auto';
        btn.style.marginRight = '20px';
        btn.innerHTML = `<i class="fas fa-play"></i> Assistir`;
        btn.onclick = () => window.open(video.videoUrl, '_blank');
        
        searchWrapper.parentNode.insertBefore(btn, searchWrapper);
    }

    // Fetch Dados
    fetch(video.arquivo)
        .then(res => res.json())
        .then(json => {
            dadosPartidaAtual = json.placar;
            renderizarTabela(dadosPartidaAtual);
            
            // Atualiza Stats do Header
            document.getElementById("total-players-count").innerText = dadosPartidaAtual.length;
            const topKiller = dadosPartidaAtual.reduce((prev, current) => (prev.kills > current.kills) ? prev : current);
            document.getElementById("top-kill-count").innerText = `${topKiller.kills} (${topKiller.nome})`;
        })
        .catch(err => {
            console.error(err);
            document.getElementById("lista-jogadores").innerHTML = "Erro ao carregar.";
        });
}

function renderizarTabela(lista) {
    const container = document.getElementById("lista-jogadores");
    container.innerHTML = "";
    const frag = document.createDocumentFragment();

    lista.forEach(p => {
        const row = document.createElement("div");
        row.className = `linha-jogador rank-${p.posicao}`;
        if(p.posicao <= 3) row.classList.add(`top-3`);
        
        row.onclick = () => abrirPerfil(p.nome);

        // Status Badge
        let statusHtml = `<span>Sobrevivente</span>`;
        if(p.posicao === 1) statusHtml = `<span>🏆 Campeão</span>`;
        else if(p.posicao <= 10) statusHtml = `<span>🔥 Top 10</span>`;

        row.innerHTML = `
            <div class="col-rank">#${p.posicao}</div>
            <div class="col-player">
                ${gerarHtmlAvatar(p.nome, p.foto_url)}
                <span>${p.nome}</span>
            </div>
            <div class="col-kills">${p.kills}</div>
            <div class="col-status">${statusHtml}</div>
        `;
        frag.appendChild(row);
    });
    container.appendChild(frag);
}

// --- PERFIL DO JOGADOR ---
async function abrirPerfil(nome) {
    const modal = document.getElementById("modal-perfil");
    modal.style.display = "flex";
    
    // Dados Básicos
    document.getElementById("perfil-nome").innerText = nome;
    document.getElementById("perfil-avatar").innerHTML = gerarHtmlAvatar(nome, "", true);

    // Calcular Stats Globais
    let totalKills = 0, totalWins = 0, matches = 0;
    const historyContainer = document.getElementById("perfil-historico");
    historyContainer.innerHTML = `<div style="text-align:center; padding:20px; color:#666"><i class="fas fa-spinner fa-spin"></i> Analisando...</div>`;

    let htmlHistory = "";
    
    // Busca paralela em todos os JSONs
    const promises = LISTA_DE_VIDEOS.map(v => fetch(v.arquivo).then(r => r.ok ? r.json() : null));
    const results = await Promise.all(promises);

    results.forEach((data, idx) => {
        if(!data) return;
        const player = data.placar.find(p => p.nome === nome);
        if(player) {
            matches++;
            totalKills += player.kills;
            if(player.posicao === 1) totalWins++;

            const isWin = player.posicao === 1;
            const rankClass = isWin ? "rank-gold" : "";
            const icon = isWin ? "fa-trophy" : "fa-crosshairs";

            htmlHistory += `
                <div class="hist-item">
                    <div>
                        <div style="font-weight:600; font-size:12px; color:#fff">${LISTA_DE_VIDEOS[idx].titulo}</div>
                        <div style="font-size:11px; color:#888"><i class="fas ${icon}"></i> ${player.kills} Kills</div>
                    </div>
                    <div class="hist-rank ${rankClass}">#${player.posicao}</div>
                </div>
            `;
        }
    });

    // Atualiza UI
    document.getElementById("stat-vitorias").innerText = totalWins;
    document.getElementById("stat-kills").innerText = totalKills;
    document.getElementById("stat-partidas").innerText = matches;
    
    // Badge Dinâmica
    let badgeText = "Recruta";
    if(totalWins > 0) badgeText = "Lenda";
    else if(totalKills > 50) badgeText = "Exterminador";
    else if(matches > 5) badgeText = "Veterano";
    
    document.getElementById("perfil-badge").innerText = badgeText;
    historyContainer.innerHTML = htmlHistory || "<p style='text-align:center; padding:20px'>Sem histórico.</p>";
}

function fecharPerfil() {
    document.getElementById("modal-perfil").style.display = "none";
}

// Filtro da Barra de Pesquisa
function filtrarListaGlobal() {
    const termo = document.getElementById("globalSearch").value.toLowerCase();
    
    // Se estiver na tela de ranking, filtra a tabela
    if(document.getElementById("view-ranking").style.display === "block") {
        const filtrados = dadosPartidaAtual.filter(p => p.nome.toLowerCase().includes(termo));
        renderizarTabela(filtrados);
    } 
    // Se estiver na home, filtra os vídeos (Opcional, mas legal)
    else {
        const cards = document.querySelectorAll(".card-video");
        cards.forEach(card => {
            const title = card.querySelector(".card-title").innerText.toLowerCase();
            card.style.display = title.includes(termo) ? "block" : "none";
        });
    }
}

function voltarHome() {
    document.getElementById("view-ranking").style.display = "none";
    document.getElementById("view-videos").style.display = "grid";
    document.getElementById("page-title").innerText = "Últimas Batalhas";
    
    // Remove botão assistir
    const btn = document.getElementById('btn-watch-action');
    if(btn) btn.remove();
}

// Fecha modal clicando fora
document.getElementById("modal-perfil").onclick = (e) => {
    if(e.target.id === "modal-perfil") fecharPerfil();
}
