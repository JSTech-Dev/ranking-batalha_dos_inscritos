// =========================================================
// APP.JS - VERSÃO FINAL (CORREÇÃO DE CAMINHOS + PROXY NOVO)
// =========================================================

// --- FUNÇÕES DE UTILIDADE ---
function extrairIdYoutube(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

async function getMediaData(video) {
    // Placeholder bonito se tudo falhar
    const placeholder = "https://placehold.co/400x225/1a1b26/FFF?text=JS+Tech+Arena";

    const dados = {
        thumb: video.thumb || placeholder,
        link: video.videoUrl || "#",
        plataforma: "link",
        icon: "fas fa-play"
    };

    if (!video.videoUrl) return dados;

    // 1. YouTube (Infalível)
    const ytId = extrairIdYoutube(video.videoUrl);
    if (ytId) {
        dados.thumb = `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
        dados.plataforma = "youtube";
        dados.icon = "fab fa-youtube";
        return dados;
    }

    // 2. TikTok (Novo Método Anti-Bloqueio)
    if (video.videoUrl.includes("tiktok.com")) {
        dados.plataforma = "tiktok";
        dados.icon = "fab fa-tiktok";
        
        try {
            // Tentativa 1: API TikWM via AllOrigins (Mais estável que corsproxy)
            const targetUrl = `https://www.tikwm.com/api/?url=${video.videoUrl}`;
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
            
            const resposta = await fetch(proxyUrl);
            if(resposta.ok) {
                const json = await resposta.json();
                if (json.data && json.data.cover) {
                    dados.thumb = json.data.cover;
                }
            }
        } catch (erro) {
            console.warn("Proxy TikTok falhou, usando capa padrão.");
            // Mantém o placeholder, não quebra o site
        }
    }
    return dados;
}

// --- FUNÇÃO DE AVATAR ---
function gerarHtmlAvatar(nome, urlFotoOriginal, isLarge = false) {
    const nomeLimpo = nome ? nome.replace('@', '').trim() : "User";
    let srcImagem = urlFotoOriginal;
    
    // Tenta adivinhar a foto se não tiver
    if (!srcImagem) srcImagem = `https://unavatar.io/${nomeLimpo}?ttl=1h`;

    const backupAvatar = `https://ui-avatars.com/api/?name=${nome}&background=random&color=fff&size=128`;
    const cssClass = isLarge ? "avatar-large" : "foto-mini";

    return `<img src="${srcImagem}" class="${cssClass}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='${backupAvatar}'">`;
}

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
    carregarGradeVideos();
});

function carregarGradeVideos() {
    const container = document.getElementById("view-videos");
    if(!container) return;
    container.innerHTML = "";
    
    if(typeof LISTA_DE_VIDEOS !== 'undefined') {
        LISTA_DE_VIDEOS.forEach(async (video) => {
            const card = document.createElement("div");
            card.className = "card-video";
            card.onclick = () => abrirRanking(video);

            // Placeholder inicial enquanto carrega
            card.innerHTML = `
                <div class="thumb-container">
                    <img src="https://placehold.co/400x225/1a1b26/FFF?text=Carregando..." class="thumb-img">
                    <div class="play-overlay"><div class="play-btn"><i class="fas fa-play"></i></div></div>
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

            const media = await getMediaData(video);
            const img = card.querySelector(".thumb-img");
            const icon = card.querySelector(".play-btn i");
            if(img) img.src = media.thumb;
            if(icon) icon.className = media.icon;
        });
    }
}

let dadosPartidaAtual = [];

function abrirRanking(video) {
    document.getElementById("view-videos").style.display = "none";
    document.getElementById("view-ranking").style.display = "block";
    document.getElementById("page-title").innerText = video.titulo;
    
    const containerLista = document.getElementById("lista-jogadores");
    containerLista.innerHTML = `<div style="padding:40px; text-align:center; color:#666;"><i class="fas fa-circle-notch fa-spin fa-2x"></i><br>Buscando arquivo...</div>`;

    // Botão Assistir
    const searchWrapper = document.querySelector('.search-wrapper');
    const btnExistente = document.getElementById('btn-watch-action');
    if(btnExistente) btnExistente.remove();

    if(video.videoUrl) {
        const btn = document.createElement('button');
        btn.id = 'btn-watch-action';
        btn.className = 'nav-btn active'; 
        btn.style.width = 'auto';
        btn.style.marginRight = '20px';
        btn.innerHTML = `<i class="fas fa-play"></i> Assistir`;
        btn.onclick = () => window.open(video.videoUrl, '_blank');
        if(searchWrapper && searchWrapper.parentNode) searchWrapper.parentNode.insertBefore(btn, searchWrapper);
    }

    // --- CARREGAMENTO DO JSON ---
    fetch(video.arquivo)
        .then(res => {
            if (!res.ok) {
                throw new Error(`Arquivo não encontrado (${res.status}). Verifique se "${video.arquivo}" está na pasta correta.`);
            }
            return res.json();
        })
        .then(json => {
            if(!json.placar) throw new Error("O arquivo JSON existe, mas não tem a lista 'placar'.");
            dadosPartidaAtual = json.placar;
            renderizarTabela(dadosPartidaAtual);
            
            // Atualiza Topo
            document.getElementById("total-players-count").innerText = dadosPartidaAtual.length;
            if(dadosPartidaAtual.length > 0) {
                const top1 = dadosPartidaAtual[0]; 
                document.getElementById("top-kill-count").innerText = `${top1.kills} (${top1.nome})`;
            }
        })
        .catch(err => {
            console.error(err);
            // MENSAGEM DE ERRO AMIGÁVEL NA TELA
            containerLista.innerHTML = `
                <div style="padding:30px; text-align:center; color:#ff7777; background:rgba(255,0,0,0.1); border-radius:15px; border:1px solid rgba(255,0,0,0.3);">
                    <i class="fas fa-folder-open fa-3x" style="margin-bottom:15px"></i><br>
                    <h3 style="color:#fff; margin-bottom:10px">Arquivo Não Encontrado</h3>
                    <p>O sistema procurou por: <strong>"${video.arquivo}"</strong></p>
                    <p style="font-size:12px; color:#aaa; margin-top:10px">
                        Dica: Verifique se o nome do arquivo no config.js é igual ao nome do arquivo na pasta.
                    </p>
                </div>`;
        });
}

function renderizarTabela(lista) {
    const container = document.getElementById("lista-jogadores");
    container.innerHTML = "";
    
    if(!lista || lista.length === 0) {
        container.innerHTML = "<p style='padding:20px; text-align:center'>Lista vazia.</p>"; return;
    }

    // Otimização: Mostra os primeiros 200, o resto carrega ao pesquisar
    const maxShow = 200; 
    const listaVisual = lista.slice(0, maxShow); 
    
    const frag = document.createDocumentFragment();

    listaVisual.forEach(p => {
        const row = document.createElement("div");
        row.className = `linha-jogador rank-${p.posicao}`;
        if(p.posicao <= 3) row.classList.add(`top-3`);
        row.onclick = () => abrirPerfil(p.nome);

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

    if(lista.length > maxShow) {
        const aviso = document.createElement("div");
        aviso.style.padding = "15px";
        aviso.style.textAlign = "center";
        aviso.style.color = "#666";
        aviso.innerHTML = `Exibindo top ${maxShow}. Use a pesquisa acima para encontrar jogadores específicos.`;
        container.appendChild(aviso);
    }
}

// --- PERFIL ---
async function abrirPerfil(nome) {
    const modal = document.getElementById("modal-perfil");
    modal.style.display = "flex";
    document.getElementById("perfil-nome").innerText = nome;
    document.getElementById("perfil-avatar").innerHTML = gerarHtmlAvatar(nome, "", true);

    const historyContainer = document.getElementById("perfil-historico");
    historyContainer.innerHTML = `<div style="text-align:center; padding:20px"><i class="fas fa-spinner fa-spin"></i></div>`;

    let kills=0, wins=0, matches=0;
    let htmlHistory = "";

    const promises = LISTA_DE_VIDEOS.map(v => fetch(v.arquivo).then(r => r.ok ? r.json() : null).catch(()=>null));
    const results = await Promise.all(promises);

    results.forEach((data, idx) => {
        if(!data || !data.placar) return;
        const p = data.placar.find(x => x.nome === nome);
        if(p) {
            matches++; kills += p.kills;
            if(p.posicao === 1) wins++;
            const icon = p.posicao===1 ? "fa-trophy" : "fa-crosshairs";
            const colorClass = p.posicao===1 ? "rank-gold" : "";
            
            htmlHistory += `
                <div class="hist-item">
                    <div>
                        <div style="font-weight:600; font-size:12px; color:#fff">${LISTA_DE_VIDEOS[idx].titulo}</div>
                        <div style="font-size:11px; color:#888"><i class="fas ${icon}"></i> ${p.kills} Kills</div>
                    </div>
                    <div class="hist-rank ${colorClass}">#${p.posicao}</div>
                </div>`;
        }
    });

    document.getElementById("stat-vitorias").innerText = wins;
    document.getElementById("stat-kills").innerText = kills;
    document.getElementById("stat-partidas").innerText = matches;
    document.getElementById("perfil-badge").innerText = wins > 0 ? "Lenda" : (matches > 5 ? "Veterano" : "Recruta");
    historyContainer.innerHTML = htmlHistory || "<p style='text-align:center; padding:20px; color:#888'>Sem histórico.</p>";
}

function fecharPerfil() { document.getElementById("modal-perfil").style.display = "none"; }
function voltarHome() {
    document.getElementById("view-ranking").style.display = "none";
    document.getElementById("view-videos").style.display = "grid";
    document.getElementById("page-title").innerText = "Últimas Batalhas";
    const btn = document.getElementById('btn-watch-action'); if(btn) btn.remove();
}
function filtrarListaGlobal() {
    const termo = document.getElementById("globalSearch").value.toLowerCase();
    if(document.getElementById("view-ranking").style.display === "block") {
        if(dadosPartidaAtual) {
            const filtrados = dadosPartidaAtual.filter(p => p.nome.toLowerCase().includes(termo));
            renderizarTabela(filtrados);
        }
    } else {
        document.querySelectorAll(".card-video").forEach(card => {
            const title = card.querySelector(".card-title").innerText.toLowerCase();
            card.style.display = title.includes(termo) ? "block" : "none";
        });
    }
}
document.getElementById("modal-perfil").onclick = (e) => { if(e.target.id === "modal-perfil") fecharPerfil(); }
