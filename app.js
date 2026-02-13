// ==================== APP.JS MOBILE (VERSÃO FINAL: FOTOS PELO NOME) ====================

// --- UTILIDADES ---
function extrairIdYoutube(url) {
    if (!url) return null;
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return (match && match[2].length === 11) ? match[2] : null;
}

async function getMediaData(video) {
    // Capa padrão se falhar
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
        
        // Se não tiver capa manual, tenta buscar
        if (!video.thumb) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000); 
                
                // Usa AllOrigins para tentar pegar a capa
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent('https://www.tikwm.com/api/?url='+video.videoUrl)}`;
                
                const res = await fetch(proxyUrl, { signal: controller.signal });
                clearTimeout(timeoutId);
                
                if(res.ok) {
                    const json = await res.json();
                    if (json.data?.cover) dados.thumb = json.data.cover;
                }
            } catch (e) { }
        }
    }
    return dados;
}

// --- AQUI ESTÁ A MÁGICA PARA CARREGAR A FOTO SÓ COM O NOME ---
function gerarAvatar(nome, urlDoJson) {
    // 1. Limpa o nome (tira o @ e espaços)
    const nomeLimpo = nome ? nome.replace('@', '').trim() : "User";
    
    // 2. MONTA O LINK DO TIKTOK
    // Como o JSON veio vazio, a gente ignora o 'urlDoJson' e usa direto o unavatar
    const src = `https://unavatar.io/tiktok/${nomeLimpo}?ttl=1h`;
    
    // 3. Link de emergência (Iniciais coloridas)
    const fallback = `https://ui-avatars.com/api/?name=${nome}&background=random&color=fff&size=128`;
    
    // 4. Retorna a imagem com proteção 'no-referrer' (ESSENCIAL pro TikTok não bloquear)
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
            const card = document.createElement("div");
            card.className = "card-video";
            card.onclick = () => abrirRanking(video);
            
            // Placeholder inicial
            card.innerHTML = `
                <div class="thumb-container">
                    <img src="https://placehold.co/600x400/1a1b26/FFF?text=Carregando..." class="thumb-img" alt="Capa">
                    <div class="play-badge"><i class="fas fa-play"></i></div>
                </div>
                <div class="card-info">
                    <span class="card-title">${video.titulo}</span>
                    <span class="card-date">${video.data} • Toque para ver Ranking</span>
                </div>
            `;
            container.appendChild(card);

            const media = await getMediaData(video);
            const img = card.querySelector(".thumb-img");
            const badge = card.querySelector(".play-badge i");
            
            if(img) img.src = media.thumb;
            if(badge) badge.className = media.icon;
        });
    }
}

let dadosAtuais = [];

function abrirRanking(video) {
    document.getElementById("view-videos").classList.add("hidden");
    document.getElementById("view-ranking").classList.remove("hidden");
    document.getElementById("page-title").innerText = "Ranking";
    
    const headerAction = document.getElementById("header-action");
    headerAction.innerHTML = "";
    
    if(video.videoUrl) {
        const btnStyle = video.videoUrl.includes("tiktok") 
            ? "background:#000; border:1px solid #333; color:#00ffcc;" 
            : "background:#ff0000; color:#fff;";
        const iconClass = video.videoUrl.includes("tiktok") ? "fab fa-tiktok" : "fab fa-youtube";

        headerAction.innerHTML = `
            <button onclick="window.open('${video.videoUrl}', '_blank')" class="btn-watch-header" style="${btnStyle} border-radius:20px; padding:6px 15px; font-weight:bold; font-size:12px; cursor:pointer;">
                <i class="${iconClass}"></i> Ver Vídeo
            </button>`;
    }

    const listaContainer = document.getElementById("lista-jogadores");
    listaContainer.innerHTML = `<div style="text-align:center; padding:50px; color:#888;"><i class="fas fa-circle-notch fa-spin fa-2x"></i><br><br>Carregando guerreiros...</div>`;

    fetch(video.arquivo)
        .then(res => {
            if(!res.ok) throw new Error("Arquivo não encontrado");
            return res.json();
        })
        .then(json => {
            dadosAtuais = json.placar;
            renderizarLista(dadosAtuais);
            
            document.getElementById("total-players-count").innerText = dadosAtuais.length;
            if(dadosAtuais.length > 0) {
                const topKiller = dadosAtuais.reduce((prev, curr) => (prev.kills > curr.kills) ? prev : curr);
                document.getElementById("top-kill-count").innerText = `${topKiller.kills} (${topKiller.nome})`;
            }
        })
        .catch(err => {
            console.error(err);
            listaContainer.innerHTML = `
                <div style="text-align:center; padding:30px; color:#ff5555; background:rgba(255,0,0,0.1); border-radius:12px; margin:20px;">
                    <i class="fas fa-exclamation-triangle fa-2x"></i><br><br>
                    <strong>Arquivo não encontrado</strong><br>
                    <small style="opacity:0.7">${video.arquivo}</small>
                </div>`;
            document.getElementById("total-players-count").innerText = "0";
            document.getElementById("top-kill-count").innerText = "-";
        });
}

function renderizarLista(lista) {
    const container = document.getElementById("lista-jogadores");
    container.innerHTML = "";
    
    if(!lista || lista.length === 0) {
        container.innerHTML = "<p style='text-align:center; padding:20px; color:#666'>Nenhum jogador na lista.</p>";
        return;
    }

    const frag = document.createDocumentFragment();
    
    // Carrega 200 itens para não travar o celular
    const listaVisual = lista.slice(0, 200);

    listaVisual.forEach(p => {
        const row = document.createElement("div");
        row.className = `player-row ${p.posicao === 1 ? 'top-1' : ''}`;
        row.onclick = () => abrirPerfil(p.nome);

        let statusText = 'Sobrevivente';
        if(p.posicao === 1) statusText = '🏆 Campeão';
        else if(p.posicao <= 10) statusText = '🔥 Top 10';

        row.innerHTML = `
            <div class="rank-num">#${p.posicao}</div>
            
            <div class="p-avatar">${gerarAvatar(p.nome, p.foto_url)}</div>
            
            <div class="p-info">
                <div class="p-name">${p.nome}</div>
                <div class="p-detail">${statusText}</div>
            </div>
            <div class="p-kills">${p.kills}</div>
        `;
        frag.appendChild(row);
    });
    container.appendChild(frag);
    
    if(lista.length > 200) {
        const more = document.createElement("div");
        more.innerHTML = `<small style='display:block; text-align:center; padding:20px; color:#666'>
            Exibindo top 200 de ${lista.length}.<br>Use a busca para encontrar o restante.
        </small>`;
        container.appendChild(more);
    }
}

async function abrirPerfil(nome) {
    const modal = document.getElementById("modal-perfil");
    modal.style.display = "flex";
    
    document.getElementById("perfil-nome").innerText = nome;
    
    // FOTO GRANDE NO PERFIL (Usando a mesma lógica)
    const avatarHtml = gerarAvatar(nome, ""); 
    document.getElementById("perfil-avatar").innerHTML = avatarHtml.replace('<img', '<img style="width:100%; height:100%; object-fit:cover; border-radius:50%; border:3px solid #00ffcc;"');

    const histContainer = document.getElementById("perfil-historico");
    histContainer.innerHTML = `<div style="text-align:center; padding:30px; color:#666"><i class="fas fa-circle-notch fa-spin"></i></div>`;

    let wins=0, kills=0, matches=0;
    let html = "";

    const promises = LISTA_DE_VIDEOS.map(v => 
        fetch(v.arquivo).then(r => r.ok ? r.json() : null).catch(()=>null)
    );
    const results = await Promise.all(promises);

    results.forEach((data, idx) => {
        if(!data || !data.placar) return;
        
        const p = data.placar.find(x => x.nome === nome);
        if(p) {
            matches++; kills += p.kills;
            if(p.posicao === 1) wins++;
            
            const colorClass = p.posicao === 1 ? "color:#ffd700;" : "color:#fff;";
            const icon = p.posicao === 1 ? "fa-trophy" : "fa-crosshairs";
            
            html += `
                <div class="hist-item">
                    <span style="color:#bbb">${LISTA_DE_VIDEOS[idx].titulo}</span>
                    <span style="${colorClass} font-weight:bold;">
                        <i class="fas ${icon}" style="font-size:10px; margin-right:5px;"></i>
                        #${p.posicao} (${p.kills} K)
                    </span>
                </div>`;
        }
    });

    document.getElementById("stat-vitorias").innerText = wins;
    document.getElementById("stat-kills").innerText = kills;
    document.getElementById("stat-partidas").innerText = matches;
    document.getElementById("perfil-badge").innerText = wins > 0 ? "Lenda" : (kills > 50 ? "Exterminador" : "Guerreiro");
    
    histContainer.innerHTML = html || "<p style='text-align:center; padding:20px; color:#666'>Nenhum histórico encontrado.</p>";
}

function fecharPerfil() { document.getElementById("modal-perfil").style.display = "none"; }

function voltarHome() {
    document.getElementById("view-ranking").classList.add("hidden");
    document.getElementById("view-videos").classList.remove("hidden");
    document.getElementById("page-title").innerText = "JS TECH";
    document.getElementById("header-action").innerHTML = "";
    document.getElementById("globalSearch").value = "";
    filtrarListaGlobal();
}

document.getElementById("modal-perfil").onclick = (e) => {
    if(e.target.id === "modal-perfil") fecharPerfil();
}

function filtrarListaGlobal() {
    const termo = document.getElementById("globalSearch").value.toLowerCase();
    
    if(!document.getElementById("view-ranking").classList.contains("hidden")) {
        const filtrados = dadosAtuais.filter(p => p.nome.toLowerCase().includes(termo));
        renderizarLista(filtrados);
    } else {
        document.querySelectorAll(".card-video").forEach(card => {
            const txt = card.innerText.toLowerCase();
            card.style.display = txt.includes(termo) ? "block" : "none";
        });
    }
}
