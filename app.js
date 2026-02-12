// =========================================================
// APP.JS - VERSÃO COM CARREGAMENTO DE FOTOS "BLINDADO"
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
    const containerVideos = document.getElementById("lista-videos");
    
    // Carrega os vídeos na tela inicial
    if(typeof LISTA_DE_VIDEOS !== 'undefined') {
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
    }
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
        .catch(erro => {
            console.error("Erro ao ler JSON:", erro);
            document.getElementById("lista-jogadores").innerHTML = "<p style='text-align:center; color:#ff4444'>Erro ao carregar o arquivo da partida.</p>";
        });
}

// --- AQUI ESTÁ A MÁGICA QUE VOCÊ PEDIU ---
// Função auxiliar para gerar a tag de imagem igual ao seu código de exemplo
function gerarHtmlAvatar(nome, urlFotoOriginal) {
    const nomeLimpo = nome.replace('@', '').trim();
    
    // 1. Tenta usar a foto que veio no JSON, se não tiver, tenta adivinhar pelo Unavatar
    // O segredo do seu código: adicionar um timestamp para forçar atualização
    const timestamp = new Date().getTime(); 
    
    // Se a URL original vier vazia do Unity, montamos a do Unavatar
    let srcImagem = urlFotoOriginal;
    if (!srcImagem || srcImagem === "") {
        // Tenta buscar no TikTok/Instagram genericamente
        srcImagem = `https://unavatar.io/${nomeLimpo}?ttl=1h`;
    }

    // Link de backup (Iniciais coloridas) igual ao seu código
    const backupAvatar = `https://ui-avatars.com/api/?name=${nome}&background=random&color=fff&size=128`;

    // RETORNA O HTML COM A PROTEÇÃO "no-referrer"
    // Essa tag 'referrerpolicy' é o segredo para o TikTok não bloquear a imagem
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
        
        // Clique para abrir perfil
        div.onclick = () => abrirPerfilCompleto(jogador.nome);
        div.style.cursor = "pointer"; 

        let classeRank = "rank-comum";
        if(jogador.posicao === 1) classeRank = "rank-1";
        else if(jogador.posicao === 2) classeRank = "rank-2";
        else if(jogador.posicao === 3) classeRank = "rank-3";

        // GERA O AVATAR USANDO A LÓGICA NOVA
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
    
    // Contador no final
    const contador = document.createElement("div");
    contador.style.padding = "15px";
    contador.style.textAlign = "center";
    contador.style.color = "#666";
    contador.style.fontSize = "0.8em";
    contador.innerText = `Total: ${lista.length} Jogadores`;
    container.appendChild(contador);
}

// =========================================================
// SISTEMA DE PERFIL (Também atualizado com a foto certa)
// =========================================================

async function abrirPerfilCompleto(nomeJogador) {
    const modal = document.getElementById("modal-perfil");
    modal.style.display = "block";
    
    document.getElementById("perfil-nome").innerText = nomeJogador;
    
    // Limpa o avatar anterior e coloca um carregando
    const divAvatar = document.getElementById("perfil-avatar");
    divAvatar.innerHTML = ""; 
    divAvatar.style.background = "transparent";
    divAvatar.style.border = "none";
    divAvatar.style.boxShadow = "none";
    
    // Aplica a mesma lógica de foto no perfil grande
    // Aqui usamos um truque: criamos a imagem grande usando a mesma função
    const imgHtml = gerarHtmlAvatar(nomeJogador, "");
    // Ajustamos o estilo via replace para caber no círculo grande
    divAvatar.innerHTML = imgHtml.replace('class="foto-perfil"', 'style="width:100%; height:100%; object-fit:cover; border-radius:50%; border:4px solid #fff;"');

    document.getElementById("perfil-historico").innerHTML = "<p style='text-align:center; padding:20px'>Analisando histórico...</p>";

    // Zera stats
    let totalKills = 0;
    let totalVitorias = 0;
    let partidasJogadas = 0;
    let historicoHTML = "";

    // Busca dados em todos os arquivos
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

