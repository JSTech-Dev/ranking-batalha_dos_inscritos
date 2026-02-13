// ==================== APP.JS MOBILE ====================

// --- UTILIDADES ---
function extrairIdYoutube(url) {
    if (!url) return null;
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return (match && match[2].length === 11) ? match[2] : null;
}

async function getMediaData(video) {
    const placeholder = "https://placehold.co/600x400/1a1b26/00ffcc?text=JS+Tech";
    const dados = {
        thumb: (video.thumb && video.thumb.length > 10) ? video.thumb : placeholder,
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
        if (!video.thumb) {
            try {
                // Tentativa rápida de capa
                const controller = new AbortController();
                setTimeout(() => controller.abort(), 2000); 
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent('https://www.tikwm.com/api/?url='+video.videoUrl)}`;
                const res = await fetch(proxyUrl, { signal: controller.signal });
                const json = await res.json();
                if (json.data?.cover) dados.thumb = json.data.cover;
            } catch (e) {}
        }
    }
    return dados;
}

function gerarAvatar(nome, url) {
    const nomeLimpo = nome ? nome.replace('@', '').trim() : "User";
    const src = url || `https://unavatar.io/${nomeLimpo}?ttl=1h`;
    const fallback = `https://ui-avatars.com/api/?name=${nome}&background=random&color=fff&size=128`;
    return `<img src="${src}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='${fallback}'">`;
}

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
    carregarVideos();
});

function carregarVideos() {
    const container = document.getElementById("lista-videos-container");
    if(!container) return;
    container.innerHTML = "";
    
    if(typeof LISTA_DE_VIDEOS !== 'undefined') {
        LISTA_DE_VIDEOS.forEach(async (video) => {
            const media = await getMediaData(video);
            
            const card = document.createElement("div");
            card.className = "card-video";
            card.onclick = () => abrirRanking(video);
            
            card.innerHTML = `
                <div class="thumb-container">
                    <img src="${media.thumb}" alt="Capa">
                    <div class="play-badge"><i class="${media.icon}"></i></div>
                </div>
                <div class="card-info">
                    <span class="card-title">${video.titulo}</span>
                    <span class="card-date">${video.data} • Toque para ver Ranking</span>
                </div>
            `;
            container.appendChild(card);
        });
    }
}

let dadosAtuais = [];

function abrirRanking(video) {
    document.getElementById("view-videos").classList.add("hidden");
    document.getElementById("view-ranking").classList.remove("hidden");
    document.getElementById("page-title").innerText = "Ranking";
    
    // Botão Assistir no Header
    const headerAction = document.getElementById("header-action");
    headerAction.innerHTML = "";
    if(video.videoUrl) {
        headerAction.innerHTML = `
            <button onclick="window.open('${video.videoUrl}', '_blank')" class="btn-watch-header" style="background:#00ffcc; border:none; border-radius:20px; padding:5px 15px; font-weight:bold; font-size:12px;">
                Assistir <i class="fas fa-play"></i>
            </button>`;
    }

    const listaContainer = document.getElementById("lista-jogadores");
    listaContainer.innerHTML = `<div style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin"></i> Carregando...</div>`;

    fetch(video.arquivo)
        .then(res => {
            if(!res.ok) throw new Error("404");
            return res.json();
        })
        .then(json => {
            dadosAtuais = json.placar;
            renderizarLista(dadosAtuais);
            
            // Stats
            document.getElementById("total-players-count").innerText = dadosAtuais.length;
            if(dadosAtuais.length > 0) {
                const top1 = dadosAtuais[0];
                document.getElementById("top-kill-count").innerText = `${top1.kills} (${top1.nome})`;
            }
        })
        .catch(err => {
            listaContainer.innerHTML = `<div style="text-align:center; padding:20px; color:#ff4444">Erro ao abrir arquivo.<br><small>${video.arquivo}</small></div>`;
        });
}

function renderizarLista(lista) {
    const container = document.getElementById("lista-jogadores");
    container.innerHTML = "";
    const frag = document.createDocumentFragment();
    
    // Limite visual para celular (carrega 200 para não travar scroll)
    const listaVisual = lista.slice(0, 200);

    listaVisual.forEach(p => {
        const row = document.createElement("div");
        row.className = `player-row ${p.posicao === 1 ? 'top-1' : ''}`;
        row.onclick = () => abrirPerfil(p.nome);

        row.innerHTML = `
            <div class="rank-num">#${p.posicao}</div>
            <div class="p-avatar">${gerarAvatar(p.nome, p.foto_url)}</div>
            <div class="p-info">
                <div class="p-name">${p.nome}</div>
                <div class="p-detail">${p.posicao === 1 ? '🏆 Campeão' : 'Sobrevivente'}</div>
            </div>
            <div class="p-kills">${p.kills} K</div>
        `;
        frag.appendChild(row);
    });
    container.appendChild(frag);
    
    if(lista.length > 200) {
        const more = document.createElement("div");
        more.innerHTML = "<small style='display:block; text-align:center; padding:10px; color:#666'>... use a busca para ver mais ...</small>";
        container.appendChild(more);
    }
}

async function abrirPerfil(nome) {
    const modal = document.getElementById("modal-perfil");
    modal.style.display = "flex";
    
    document.getElementById("perfil-nome").innerText = nome;
    document.getElementById("perfil-avatar").innerHTML = gerarAvatar(nome, ""); // Busca foto

    const histContainer = document.getElementById("perfil-historico");
    histContainer.innerHTML = `<div style="text-align:center; padding:20px"><i class="fas fa-spinner fa-spin"></i></div>`;

    let wins=0, kills=0, matches=0;
    let html = "";

    // Analisa histórico
    const promises = LISTA_DE_VIDEOS.map(v => fetch(v.arquivo).then(r => r.ok ? r.json() : null).catch(()=>null));
    const results = await Promise.all(promises);

    results.forEach((data, idx) => {
        if(!data || !data.placar) return;
        const p = data.placar.find(x => x.nome === nome);
        if(p) {
            matches++; kills += p.kills;
            if(p.posicao === 1) wins++;
            const color = p.posicao === 1 ? "gold" : "";
            html += `
                <div class="hist-item">
                    <span style="color:#fff">${LISTA_DE_VIDEOS[idx].titulo}</span>
                    <span class="${color}">#${p.posicao} (${p.kills} Kills)</span>
                </div>`;
        }
    });

    document.getElementById("stat-vitorias").innerText = wins;
    document.getElementById("stat-kills").innerText = kills;
    document.getElementById("stat-partidas").innerText = matches;
    document.getElementById("perfil-badge").innerText = wins > 0 ? "Lenda" : "Guerreiro";
    
    histContainer.innerHTML = html || "<p style='text-align:center; padding:10px'>Sem histórico.</p>";
}

function fecharPerfil() { document.getElementById("modal-perfil").style.display = "none"; }
function voltarHome() {
    document.getElementById("view-ranking").classList.add("hidden");
    document.getElementById("view-videos").classList.remove("hidden");
    document.getElementById("page-title").innerText = "JS TECH";
    document.getElementById("header-action").innerHTML = "";
}

// Fechar ao clicar fora (no fundo escuro)
document.getElementById("modal-perfil").onclick = (e) => {
    if(e.target.id === "modal-perfil") fecharPerfil();
}

function filtrarListaGlobal() {
    const termo = document.getElementById("globalSearch").value.toLowerCase();
    // Se estiver no ranking, filtra jogadores
    if(!document.getElementById("view-ranking").classList.contains("hidden")) {
        const filtrados = dadosAtuais.filter(p => p.nome.toLowerCase().includes(termo));
        renderizarLista(filtrados);
    } else {
        // Se estiver nos vídeos, filtra vídeos
        document.querySelectorAll(".card-video").forEach(card => {
            const txt = card.innerText.toLowerCase();
            card.style.display = txt.includes(termo) ? "block" : "none";
        });
    }
}
