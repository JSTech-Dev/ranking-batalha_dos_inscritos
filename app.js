// ==================== APP.JS MOBILE (FINAL: LISTA DE GUERREIROS COM ANÚNCIO INTERCALADO) ====================

// --- VARIÁVEIS GLOBAIS ---
let listaCompletaGlobal = []; 
let itensRenderizados = 0;    
const LOTE_CARREGAMENTO = 50; 
let carregandoBloqueio = false; 

// --- UTILIDADES DE MÍDIA ---
function extrairIdYoutube(url) {
    if (!url) return null;
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return (match && match[2].length === 11) ? match[2] : null;
}

async function getMediaData(video) {
    const placeholder = "https://placehold.co/600x400/1a1b26/00ffcc?text=Lista+de+Guerreiros";
    
    const dados = {
        thumb: (video.thumb && video.thumb.length > 10) ? video.thumb : placeholder,
        link: video.videoUrl || "#",
        plataforma: "link",
        icon: "fas fa-play"
    };

    if (!video.videoUrl) return dados;

    // 1. YouTube
    const ytId = extrairIdYoutube(video.videoUrl);
    if (ytId) {
        dados.thumb = `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
        dados.plataforma = "youtube";
        dados.icon = "fab fa-youtube";
        return dados;
    }

    // 2. TikTok
    if (video.videoUrl.includes("tiktok.com")) {
        dados.plataforma = "tiktok";
        dados.icon = "fab fa-tiktok";
        if (!video.thumb) {
            try {
                const controller = new AbortController();
                setTimeout(() => controller.abort(), 2000); 
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent('https://www.tikwm.com/api/?url='+video.videoUrl)}`;
                const res = await fetch(proxyUrl, { signal: controller.signal });
                if(res.ok) {
                    const json = await res.json();
                    if (json.data?.cover) dados.thumb = json.data.cover;
                }
            } catch (e) {}
        }
        return dados;
    }

    // 3. Instagram
    if (video.videoUrl.includes("instagram.com")) {
        dados.plataforma = "instagram";
        dados.icon = "fab fa-instagram";
        return dados;
    }

    return dados;
}

function gerarAvatar(nome, url) {
    const nomeLimpo = nome ? nome.replace('@', '').trim() : "User";
    let src = url;
    if (!src || src === "") {
        src = `https://unavatar.io/tiktok/${nomeLimpo}?ttl=24h&fallback=false`;
    }
    const fallback = `https://ui-avatars.com/api/?name=${nome}&background=1a1a1a&color=00ffcc&size=128&bold=true&font-size=0.5`;
    return `<img src="${src}" referrerpolicy="no-referrer" loading="lazy" onerror="this.onerror=null; this.src='${fallback}'">`;
}

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
    carregarVideos();
    window.addEventListener('scroll', () => {
        if (document.getElementById("view-ranking").classList.contains("hidden")) return;
        if (carregandoBloqueio) return;
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 300) {
            carregarMaisItens();
        }
    });
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
            
            card.innerHTML = `
                <div class="thumb-container">
                    <img src="https://placehold.co/600x400/1a1b26/FFF?text=Carregando..." class="thumb-img" alt="Lista de Guerreiros">
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

function abrirRanking(video) {
    document.getElementById("view-videos").classList.add("hidden");
    document.getElementById("view-ranking").classList.remove("hidden");
    document.getElementById("page-title").innerText = "Ranking";
    
    const headerAction = document.getElementById("header-action");
    headerAction.innerHTML = "";
    
    if(video.videoUrl) {
        let btnStyle = "background:#333; color:#fff;";
        let iconClass = "fas fa-play";
        let btnText = "Ver Vídeo";

        if (video.videoUrl.includes("tiktok")) {
            btnStyle = "background:#000; border:1px solid #333; color:#00ffcc;";
            iconClass = "fab fa-tiktok";
        } else if (video.videoUrl.includes("instagram")) {
            btnStyle = "background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); color:white; border:none;";
            iconClass = "fab fa-instagram";
            btnText = "Ver no Insta";
        } else if (video.videoUrl.includes("youtube") || video.videoUrl.includes("youtu.be")) {
            btnStyle = "background:#ff0000; color:#fff;";
            iconClass = "fab fa-youtube";
        }

        headerAction.innerHTML = `
            <button onclick="window.open('${video.videoUrl}', '_blank')" class="btn-watch-header" style="${btnStyle} border-radius:20px; padding:6px 15px; font-weight:bold; font-size:12px; cursor:pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
                <i class="${iconClass}"></i> ${btnText}
            </button>`;
    }

    // ALTERAÇÃO: Mensagem de carregamento vai para a div de cima
    const listaTopo = document.getElementById("lista-jogadores-topo");
    const listaResto = document.getElementById("lista-jogadores-resto");
    
    listaTopo.innerHTML = `<div style="text-align:center; padding:50px; color:#888;"><i class="fas fa-circle-notch fa-spin fa-2x"></i><br><br>Carregando guerreiros...</div>`;
    listaResto.innerHTML = ""; // Deixa a de baixo vazia enquanto carrega

    fetch(video.arquivo)
        .then(res => {
            if(!res.ok) throw new Error("Arquivo não encontrado");
            return res.json();
        })
        .then(json => {
            listaCompletaGlobal = json.placar;
            document.getElementById("total-players-count").innerText = listaCompletaGlobal.length;
            if(listaCompletaGlobal.length > 0) {
                const topKiller = listaCompletaGlobal.reduce((prev, curr) => (prev.kills > curr.kills) ? prev : curr);
                document.getElementById("top-kill-count").innerText = `${topKiller.kills} (${topKiller.nome})`;
            }
            iniciarRenderizacao();
        })
        .catch(err => {
            console.error(err);
            listaTopo.innerHTML = `
                <div style="text-align:center; padding:30px; color:#ff5555; background:rgba(255,0,0,0.1); border-radius:12px; margin:20px;">
                    <i class="fas fa-exclamation-triangle fa-2x"></i><br><br>
                    <strong>Arquivo não encontrado</strong><br>
                    <small style="opacity:0.7">${video.arquivo}</small>
                </div>`;
            document.getElementById("total-players-count").innerText = "0";
            document.getElementById("top-kill-count").innerText = "-";
        });
}

function iniciarRenderizacao() {
    // ALTERAÇÃO: Limpa as duas listas novas
    document.getElementById("lista-jogadores-topo").innerHTML = ""; 
    document.getElementById("lista-jogadores-resto").innerHTML = ""; 
    itensRenderizados = 0;    
    carregarMaisItens();      
}

function carregarMaisItens() {
    if (itensRenderizados >= listaCompletaGlobal.length) return; 
    
    carregandoBloqueio = true; 
    
    // ALTERAÇÃO: Puxa as duas listas
    const containerTopo = document.getElementById("lista-jogadores-topo");
    const containerResto = document.getElementById("lista-jogadores-resto");
    
    const fim = Math.min(itensRenderizados + LOTE_CARREGAMENTO, listaCompletaGlobal.length);
    const lote = listaCompletaGlobal.slice(itensRenderizados, fim);

    lote.forEach((p, indexLote) => {
        const indexReal = itensRenderizados + indexLote; // Precisamos saber a posição real do jogador na lista completa

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
        
        // ALTERAÇÃO: Se for um dos 3 primeiros, vai pra cima do anúncio. Se não, vai pra baixo.
        if (indexReal < 3) {
            containerTopo.appendChild(row);
        } else {
            containerResto.appendChild(row);
        }
    });

    itensRenderizados = fim;
    carregandoBloqueio = false; 
    
    const loadingOld = document.getElementById("loading-scroll");
    if(loadingOld) loadingOld.remove();

    if (itensRenderizados < listaCompletaGlobal.length) {
        const loadingDiv = document.createElement("div");
        loadingDiv.id = "loading-scroll";
        loadingDiv.innerHTML = `<div style="text-align:center; padding:10px; color:#666; font-size:12px;"><i class="fas fa-spinner fa-spin"></i> Carregando mais...</div>`;
        containerResto.appendChild(loadingDiv); // O loading de rolagem agora fica na caixa de baixo
    }
}

async function abrirPerfil(nome) {
    const modal = document.getElementById("modal-perfil");
    modal.style.display = "flex";
    document.getElementById("perfil-nome").innerText = nome;
    
    const avatarHtml = gerarAvatar(nome, ""); 
    document.getElementById("perfil-avatar").innerHTML = avatarHtml.replace('<img', '<img style="width:100%; height:100%; object-fit:cover; border-radius:50%; border:3px solid #00ffcc;"');

    const histContainer = document.getElementById("perfil-historico");
    histContainer.innerHTML = `<div style="text-align:center; padding:30px; color:#666"><i class="fas fa-circle-notch fa-spin"></i></div>`;

    let wins=0, kills=0, matches=0;
    let html = "";

    const promises = LISTA_DE_VIDEOS.map(v => fetch(v.arquivo).then(r => r.ok ? r.json() : null).catch(()=>null));
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
    
    listaCompletaGlobal = [];
    itensRenderizados = 0;
}

document.getElementById("modal-perfil").onclick = (e) => {
    if(e.target.id === "modal-perfil") fecharPerfil();
}

function filtrarListaGlobal() {
    const termo = document.getElementById("globalSearch").value.toLowerCase();
    const rankingVisible = !document.getElementById("view-ranking").classList.contains("hidden");

    if(rankingVisible) {
        const filtrados = listaCompletaGlobal.filter(p => p.nome.toLowerCase().includes(termo));
        
        // ALTERAÇÃO: Na busca, ele também separa para não bugar o anúncio
        const containerTopo = document.getElementById("lista-jogadores-topo");
        const containerResto = document.getElementById("lista-jogadores-resto");
        
        containerTopo.innerHTML = "";
        containerResto.innerHTML = "";
        
        filtrados.slice(0, 100).forEach((p, index) => {
             const row = document.createElement("div");
             row.className = `player-row ${p.posicao === 1 ? 'top-1' : ''}`;
             row.onclick = () => abrirPerfil(p.nome);
             row.innerHTML = `
                <div class="rank-num">#${p.posicao}</div>
                <div class="p-avatar">${gerarAvatar(p.nome, p.foto_url)}</div>
                <div class="p-info">
                    <div class="p-name">${p.nome}</div>
                    <div class="p-detail">Resultado da busca</div>
                </div>
                <div class="p-kills">${p.kills}</div>`;
             
             if (index < 3) {
                 containerTopo.appendChild(row);
             } else {
                 containerResto.appendChild(row);
             }
        });
    } else {
        document.querySelectorAll(".card-video").forEach(card => {
            const txt = card.innerText.toLowerCase();
            card.style.display = txt.includes(termo) ? "block" : "none";
        });
    }
}
