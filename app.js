// =========================================================
// APP.JS - VERSÃO FINAL (FOTOS BLINDADAS + VIDEO AUTO)
// =========================================================

// --- FUNÇÕES AUXILIARES DE MÍDIA (YOUTUBE/TIKTOK) ---

function extrairIdYoutube(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

async function getMediaData(video) {
    const dados = {
        thumb: video.thumb || "https://via.placeholder.com/300x160/1a1a1a/333333?text=Carregando...",
        link: video.videoUrl || "#",
        plataforma: "link"
    };

    if (!video.videoUrl) return dados;

    // 1. YouTube
    const ytId = extrairIdYoutube(video.videoUrl);
    if (ytId) {
        dados.thumb = `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
        dados.plataforma = "youtube";
        return dados;
    }

    // 2. TikTok (API via Proxy)
    if (video.videoUrl.includes("tiktok.com")) {
        dados.plataforma = "tiktok";
        try {
            const apiUrl = `https://corsproxy.io/?` + encodeURIComponent(`https://www.tikwm.com/api/?url=${video.videoUrl}`);
            const resposta = await fetch(apiUrl);
            const json = await resposta.json();
            if (json.data && json.data.cover) {
                dados.thumb = json.data.cover;
            }
        } catch (erro) {
            console.error("Erro capa TikTok:", erro);
        }
    }
    return dados;
}

// --- INICIALIZAÇÃO ---

document.addEventListener("DOMContentLoaded", () => {
    const containerVideos = document.getElementById("lista-videos");
    
    if(typeof LISTA_DE_VIDEOS !== 'undefined') {
        LISTA_DE_VIDEOS.forEach(async (video) => {
            const card = document.createElement("div");
            card.className = "card-video";
            
            // Layout inicial
            card.innerHTML = `
                <div class="thumb-container">
                    <img src="https://via.placeholder.com/300x160/1a1a1a/333333?text=Carregando..." class="thumb-img" alt="Capa">
                    <div class="play-icon"><i class="fas fa-spinner fa-spin"></i></div>
                </div>
                <div class="card-info">
                    <span class="card-title">${video.titulo}</span>
                    <span class="card-date"><i class="far fa-calendar-alt"></i> ${video.data}</span>
                </div>
            `;
            containerVideos.appendChild(card);

            // Carrega a capa real (Async)
            const mediaData = await getMediaData(video);
            
            const imgTag = card.querySelector(".thumb-img");
            imgTag.src = mediaData.thumb;
            
            const iconTag = card.querySelector(".play-icon");
            if (mediaData.plataforma === 'tiktok') iconTag.innerHTML = '<i class="fab fa-tiktok"></i>';
            else if (mediaData.plataforma === 'youtube') iconTag.innerHTML = '<i class="fab fa-youtube"></i>';
            else iconTag.innerHTML = '<i class="fas fa-play"></i>';

            card.onclick = () => carregarRanking(video);
        });
    }
});

let dadosAtuais = []; 

function carregarRanking(video) {
    document.getElementById("secao-videos").style.display = "none";
    document.getElementById("area-ranking").style.display = "block";
    document.getElementById("titulo-ranking-atual").innerText = video.titulo;
    document.getElementById("lista-jogadores").innerHTML = "<p style='padding:20px; text-align:center'>Carregando dados...</p>";

    // --- BOTÃO ASSISTIR (NOVO) ---
    const headerRanking = document.getElementById("titulo-ranking-atual");
    const btnAntigo = document.getElementById("btn-assistir-video");
    if(btnAntigo) btnAntigo.remove();

    if (video.videoUrl) {
        const btnAssistir = document.createElement("a");
        btnAssistir.id = "btn-assistir-video";
        btnAssistir.href = video.videoUrl;
        btnAssistir.target = "_blank";
        btnAssistir.className = "btn-assistir";
        
        if (video.videoUrl.includes("tiktok.com")) {
            btnAssistir.style.background = "#000000";
            btnAssistir.style.border = "1px solid #333";
            btnAssistir.innerHTML = '<i class="fab fa-tiktok" style="color:#00ffcc"></i> Ver no TikTok';
        } else {
            btnAssistir.innerHTML = '<i class="fab fa-youtube"></i> Assistir Batalha';
        }
        headerRanking.parentNode.insertBefore(btnAssistir, headerRanking.nextSibling);
    }

    // Carrega JSON
    fetch(video.arquivo)
        .then(res => res.json())
        .then(json => {
            dadosAtuais = json.placar; 
            renderizarLista(dadosAtuais); 
        })
        .catch(erro => {
            console.error("Erro ao ler JSON:", erro);
            document.getElementById("lista-jogadores").innerHTML = "<p style='text-align:center; color:#ff4444'>Erro ao carregar o arquivo da partida.</p>";
        });
}

// --- LÓGICA DE FOTOS BLINDADA (SEU PEDIDO) ---

function gerarHtmlAvatar(nome, urlFotoOriginal) {
    const nomeLimpo = nome.replace('@', '').trim();
    
    // Fallback Unavatar se não tiver foto no JSON
    let srcImagem = urlFotoOriginal;
    if (!srcImagem || srcImagem === "") {
        srcImagem = `https://unavatar.io/${nomeLimpo}?ttl=1h`;
    }

    // Fallback UI Avatars (Iniciais)
    const backupAvatar = `https://ui-avatars.com/api/?name=${nome}&background=random&color=fff&size=128`;

    // Retorna HTML com proteção no-referrer
    return `
        <img src="${srcImagem}" 
             class="foto-perfil" 
             referrerpolicy="no-referrer" 
             onerror="this.onerror=null; this.src='${backupAvatar}'">
    `;
}

function renderizarLista(lista) {
    const container = document.getElementById("lista-jogadores");
    container.innerHTML = "";
    
    const fragmento = document.createDocumentFragment();

    lista.forEach(jogador => {
        const div = document.createElement("div");
        div.className = "linha-jogador";
        div.onclick = () => abrirPerfilCompleto(jogador.nome);
        div.style.cursor = "pointer"; 

        let classeRank = "rank-comum";
        if(jogador.posicao === 1) classeRank = "rank-1";
        else if(jogador.posicao === 2) classeRank = "rank-2";
        else if(jogador.posicao === 3) classeRank = "rank-3";

        // GERA O AVATAR COM A FUNÇÃO SEGURA
        const avatarHtml = gerarHtmlAvatar(jogador.nome, jogador.foto_url);

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
    
    const contador = document.createElement("div");
    contador.style.padding = "15px";
    contador.style.textAlign = "center";
    contador.style.color = "#666";
    contador.style.fontSize = "0.8em";
    contador.innerText = `Total: ${lista.length} Jogadores`;
    container.appendChild(contador);
}

// --- SISTEMA DE PERFIL ---

async function abrirPerfilCompleto(nomeJogador) {
    const modal = document.getElementById("modal-perfil");
    modal.style.display = "block";
    
    document.getElementById("perfil-nome").innerText = nomeJogador;
    
    // Usa a mesma lógica de imagem para o avatar grande
    const divAvatar = document.getElementById("perfil-avatar");
    divAvatar.innerHTML = ""; 
    divAvatar.style.background = "transparent";
    divAvatar.style.border = "none";
    divAvatar.style.boxShadow = "none";
    
    const imgHtml = gerarHtmlAvatar(nomeJogador, "");
    divAvatar.innerHTML = imgHtml.replace('class="foto-perfil"', 'style="width:100%; height:100%; object-fit:cover; border-radius:50%; border:4px solid #fff;"');

    document.getElementById("perfil-historico").innerHTML = "<p style='text-align:center; padding:20px'>Analisando histórico...</p>";

    let totalKills = 0;
    let totalVitorias = 0;
    let partidasJogadas = 0;
    let historicoHTML = "";

    const promessas = LISTA_DE_VIDEOS.map(video => 
        fetch(video.arquivo).then(res => res.ok ? res.json() : null)
    );

    const resultados = await Promise.all(promessas);

    resultados.forEach((dadosJson, index) => {
        if(!dadosJson) return;

        const tituloVideo = LISTA_DE_VIDEOS[index].titulo;
        const jogadorNaPartida = dadosJson.placar.find(p => p.nome === nomeJogador);

        if (jogadorNaPartida) {
            partidasJogadas++;
            totalKills += jogadorNaPartida.kills;
            if (jogadorNaPartida.posicao === 1) totalVitorias++;

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

    document.getElementById("stat-vitorias").innerText = totalVitorias;
    document.getElementById("stat-kills").innerText = totalKills;
    document.getElementById("stat-partidas").innerText = partidasJogadas;
    
    if(historicoHTML === "") {
        document.getElementById("perfil-historico").innerHTML = "<p style='text-align:center; padding:20px; color:#888'>Nenhum registro encontrado.</p>";
    } else {
        document.getElementById("perfil-historico").innerHTML = historicoHTML;
    }
}

function fecharPerfil() {
    document.getElementById("modal-perfil").style.display = "none";
}

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
