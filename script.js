// Seleciona o canvas do bloco NEXT (o segundo canvas na página)
const nextCanvas = document.querySelectorAll('canvas')[1]; // Pega o canvas de NEXT
const nextCtx = nextCanvas.getContext('2d'); // Obtém o contexto de desenho 2D para o canvas NEXT

let speed = 500; // Define a velocidade inicial de queda dos blocos em milissegundos (500ms = 0,5s entre quedas)

let score = 0; // Pontuação atual do jogador, começa em zero
let scores = []; // Array para guardar o histórico de pontuações dos jogadores

let gameInterval; // Variável que vai armazenar o intervalo do loop do jogo (setInterval)

const COLS = 10; // Número de colunas do tabuleiro (10 blocos de largura)
const ROWS = 20; // Número de linhas do tabuleiro (20 blocos de altura)
const BLOCK_SIZE = 30; // Tamanho de cada bloco em pixels (cada quadradinho tem 30px)

let gameOver = false; // Controla se o jogo acabou (true = fim de jogo)

const canvas = document.querySelector('canvas'); // Seleciona o primeiro canvas da página (tabuleiro principal)
const ctx = canvas.getContext('2d'); // Obtém o contexto de desenho 2D para o canvas principal

let time = 0; // Tempo da partida em segundos (cronômetro)
let timeInterval; // Variável para o intervalo do cronômetro

// Cria o tabuleiro: matriz com 20 linhas e 10 colunas, preenchida de zeros (vazio)
const board = Array.from({length: ROWS}, () => Array(COLS).fill(0));

// Define os tipos de tetrominos (blocos do Tetris), cada um é uma matriz de 1s e 0s
const tetrominos = [
  [[1, 1, 0], [0, 1, 1]], // Tetromino 0
  [[1, 1, 0], [1, 1, 0], [0, 0, 0]], // Tetromino quadrado 1
  [[1, 1, 1], [1, 1, 0], [0, 0, 0]], // Tetromino 2
  [[1, 1, 1], [0, 1, 0], [0, 0, 0]], // Tetromino 3
  [[1, 0, 0], [1, 0, 0], [1, 1, 0]], // Tetromino 4
  [[1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0]], // Tetromino 5
];

// Estado do bloco atual (current) e do próximo bloco (nextTetromino)
let current = {
  tetromino: tetrominos[Math.floor(Math.random()*tetrominos.length)], // Escolhe aleatoriamente o tipo do bloco atual
  row: 0, // Linha inicial do bloco atual (topo do tabuleiro)
  col: 4  // Coluna inicial do bloco atual (centralizado horizontalmente)
};

let nextTetromino = tetrominos[Math.floor(Math.random() * tetrominos.length)]; // Sorteia o próximo bloco

// Função para desenhar o bloco de NEXT no canvas pequeno
function drawNext() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height); // Limpa o canvas NEXT

  const rows = nextTetromino.length; // Quantas linhas tem o bloco próximo
  const cols = nextTetromino[0].length; // Quantas colunas tem o bloco próximo

  // Centraliza o bloco dentro do canvas NEXT
  // offsetX = Arredonda um número para baixo (largura do canvas - largura do bloco desenhado) / 2
  const offsetX = Math.floor((nextCanvas.width - cols * BLOCK_SIZE) / 2);
  // offsetY = Arredonda um número para baixo (altura do canvas - altura do bloco desenhado) / 2
  const offsetY = Math.floor((nextCanvas.height - rows * BLOCK_SIZE) / 2);

  // Percorre cada célula da matriz do próximo bloco
  for (let r = 0; r < rows; r++) { // loop por linhas
    for (let c = 0; c < cols; c++) { // loop por colunas
      if (nextTetromino[r][c]) { // Se o valor é 1, desenha o bloco
        nextCtx.fillStyle = 'blue'; // Cor azul para o bloco
        // fillRect(x, y, width, height) desenha o quadrado
        nextCtx.fillRect(
          offsetX + c * BLOCK_SIZE, // Calcula posição X
          offsetY + r * BLOCK_SIZE, // Calcula posição Y
          BLOCK_SIZE, BLOCK_SIZE    // Tamanho do bloco
        );
      }
    }
  }
}

// Função para desenhar o tabuleiro principal e a peça atual
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height); // Limpa o canvas principal

  // Desenha todos os blocos fixos no tabuleiro
  for (let r=0; r<ROWS; r++) { // Para cada linha
    for (let c=0; c<COLS; c++) { // Para cada coluna
      if (board[r][c]) { // Se há bloco fixo (valor 1)
        ctx.fillStyle = 'gray'; // Cor do bloco fixo
        ctx.fillRect(c*BLOCK_SIZE, r*BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE); // Desenha o bloco
      }
    }
  }

  // Desenha a peça atual em movimento
  for (let r=0; r<current.tetromino.length; r++) {     
  // percorre as linhas da matriz da peça atual
    for (let c=0; c<current.tetromino[0].length; c++) {
    // percorre as colunas da primeira linha (todas têm mesmo tamanho)
      if (current.tetromino[r][c]) {    // se existe um bloco na célula da peça
        ctx.fillStyle = 'blue';         // define cor de preenchimento como azul
        ctx.fillRect(
          (current.col+c)*BLOCK_SIZE,   // posição X = coluna base + deslocamento da peça
          (current.row+r)*BLOCK_SIZE,   // posição Y = linha base + deslocamento da peça
          BLOCK_SIZE, BLOCK_SIZE        // desenha um quadradinho
        );
      }
    }
  }

  // Atualiza a pontuação na tela (score-value)
  document.querySelector('.score-value').textContent =
    score.toString().padStart(6, '0');
  // seleciona o elemento da página com classe "score-value"
  // converte score em string
  // padStart(6,'0') → deixa sempre com 6 dígitos, preenchendo zeros à esquerda
  // atribui esse texto ao elemento

  // Atualiza o número de linhas preenchidas
  document.querySelector('.lines p').textContent = countFilledLines();
  // seleciona o <p> que está dentro de algo com classe "lines"
  // chama a função countFilledLines() que retorna o número de linhas
  // coloca esse número como texto nesse <p>
}


// Função para detectar colisão do bloco atual com bordas ou blocos fixos
function collide(row, col) {
  for (let r=0; r<current.tetromino.length; r++) { // Para cada linha da peça
    for (let c=0; c<current.tetromino[0].length; c++) { // Para cada coluna da peça
      if (current.tetromino[r][c]) { // Se é bloco
        let nr = row + r; // Nova linha no tabuleiro
        let nc = col + c; // Nova coluna no tabuleiro
        // Se passou do fundo (nr >= ROWS), da esquerda (nc < 0), da direita (nc >= COLS), ou já tem bloco fixo
        if (nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc]) {
          return true; // Há colisão
        }
      }
    }
  }
  return false; // Não há colisão
}

// Função que faz o bloco atual cair uma linha
function drop() {
  if (gameOver) return; // Se acabou, não faz nada

  // Se não colide ao descer uma linha
  if (!collide(current.row+1, current.col)) {
    current.row++; // Move a peça para baixo
  } else {
  // fixa a peça atual no tabuleiro
  for (let r = 0; r < current.tetromino.length; r++) {      
    for (let c = 0; c < current.tetromino[0].length; c++) { 
      if (current.tetromino[r][c]) {                        
        board[current.row + r][current.col + c] = 1; // salva no tabuleiro
      }
    }
  }

  clearLines(); // remove linhas cheias
  // cria uma nova peça no topo
  current = {
    tetromino: nextTetromino,
    row: 0,
    col: 3
  };
  nextTetromino = tetrominos[Math.floor(Math.random() * tetrominos.length)];

  // se a nova peça já nasce colidindo → game over
  if (collide(current.row, current.col) && !gameOver) {
    gameOver = true;
    clearInterval(timeInterval);
    clearInterval(gameInterval);
    alert("Game Over!");
    saveScore(score);
    return;
  


    }
  }
  draw();     // Atualiza a tela do tabuleiro
  drawNext(); // Atualiza a tela do NEXT
}

// Desenha o tabuleiro e o bloco NEXT ao iniciar o jogo
draw();
drawNext();

// Função para limpar linhas completas no tabuleiro
function clearLines() {
  // olha todas as linhas, de baixo pra cima
  for (let r = ROWS - 1; r >= 0; r--) { 
    
    // se todos os quadradinhos dessa linha têm bloquinho (ou seja, linha cheia)
    if (board[r].every(cell => cell)) {
      
      // tira essa linha do tabuleiro
      board.splice(r, 1); 
      
      // coloca uma linha vazia lá em cima (como se d escesse tudo e abrisse espaço)
      board.unshift(Array(COLS).fill(0)); 
      
      // dá 100 pontos
      score += 100; 
      
      // faz o jogo ficar mais rápido (pra ficar mais difícil)
      updateSpeed(); 
    
      // volta um passo, porque como apagou a linha,
      // as de cima desceram e precisam ser verificadas de novo
      r++; 
    }
  }
}

// Adiciona os controles do teclado (setas e espaço)
document.addEventListener('keydown', function(e) {
   // se o foco estiver em um campo de input ou textarea, não mexe
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
    return;
  }

  // evita que espaço/ setas rolem a página ou cliquem em botões
  e.preventDefault();
  
  if (e.key === 'ArrowLeft') { 
    // seta ESQUERDA → tenta mover a peça pra esquerda
    // só move se não bater em nada (sem colisão)
    if (!collide(current.row, current.col - 1)) {//só anda pra esquerda se não bater em nada. Se tiver espaço livre, diminui a posição da coluna em 1
      current.col--;   // anda 1 coluna pra esquerda
      draw();          // redesenha o tabuleiro
      drawNext();      // redesenha a próxima peça
    }
  }

  if (e.key === 'ArrowRight') {
    // seta DIREITA → tenta mover a peça pra direita
    if (!collide(current.row, current.col + 1)) { //só anda pra direita se não bater em nada. Se tiver espaço livre, aumenta a posição da coluna em 1
      current.col++;   // anda 1 coluna pra direita
      draw();          // redesenha o tabuleiro
      drawNext();      // redesenha a próxima peça
    }
  }

  if (e.key === 'ArrowDown') {
    // seta PRA BAIXO → faz a peça descer mais rápido
    drop();
  }

  if (e.key === 'ArrowUp') {
    // seta PRA CIMA → rotaciona a peça
    rotate();
  }

  if (e.code === 'Space') {
    // BARRA DE ESPAÇO → "hard drop" (a peça cai direto até o fim)
    while (!collide(current.row + 1, current.col)) {
      current.row++; // vai descendo até não poder mais
    }
    drop();     // fixa a peça no lugar
    draw();     // redesenha o tabuleiro
    drawNext(); // redesenha a próxima peça
  }
});


// Função para rotacionar a peça atual (matriz 2D)
function rotate() {
  const oldTetromino = current.tetromino; // Guarda a peça atual
  const rows = oldTetromino.length; // Linhas da peça
  const cols = oldTetromino[0].length; // Colunas da peça

  // Cria matriz rotacionada: para cada coluna, cria array de linhas
  const rotated = Array.from({length: cols}, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Rotação 90 graus: [linha][coluna] vira [coluna][n-linha-1]
      rotated[c][rows - 1 - r] = oldTetromino[r][c];
    }
  }

  // Calcula centro da matriz antiga e nova
  const oldCenterRow = Math.floor(rows / 2); // Ex: 3 linhas -> centro na linha 1
  const oldCenterCol = Math.floor(cols / 2);
  const newCenterRow = Math.floor(rotated.length / 2);
  const newCenterCol = Math.floor(rotated[0].length / 2);

  // Determina o deslocamento para manter o centro
  const rowOffset = oldCenterRow - newCenterRow;
  const colOffset = oldCenterCol - newCenterCol;

  // Guarda estado anterior
  const prevTetromino = current.tetromino;
  const prevRow = current.row;
  const prevCol = current.col;

  current.tetromino = rotated; // Aplica rotação
  current.row += rowOffset; // Ajusta linha
  current.col += colOffset; // Ajusta coluna

  // Se rotacionar e colidir, volta ao estado anterior
  if (collide(current.row, current.col)) {
    current.tetromino = prevTetromino;
    current.row = prevRow;
    current.col = prevCol;
  }
  draw();
  drawNext();
}

// Função para salvar a pontuação do jogador
function saveScore(points) {
  const name = document.getElementById('playerName').value.trim(); // Pega nome do jogador
  if (!name) { // Se não informou nome
    alert('Digite seu nome antes de começar!');
    return;
  }
  scores.push({ name, points }); // Adiciona pontuação ao array
  scores.sort((a, b) => b.points - a.points); // Ordena da maior para a menor
  updateScoreTable(); // Atualiza a tabela na interface
}

// Função para atualizar a tabela de pontuação
function updateScoreTable() {
  const table = document.getElementById('scoreTable').getElementsByTagName('tbody')[0]; // Seleciona corpo da tabela
  table.innerHTML = ''; // Limpa tabela existente
  scores.forEach(score => { // Para cada pontuação
    const row = table.insertRow(); // Adiciona linha
    row.insertCell(0).textContent = score.name; // Coluna do nome
    row.insertCell(1).textContent = score.points; // Coluna dos pontos
  });
}

// Função para reiniciar o jogo (após clicar em "Começar jogo")
function resetGame() {
  speed = 500; // Velocidade inicial
  document.querySelector('.coluna1 p').textContent = "1.0x"; // Mostra speed inicial

  // Recria o tabuleiro vazio
  for (let r = 0; r < ROWS; r++) {
    board[r] = Array(COLS).fill(0);
  }
  score = 0; // Zera pontuação
  gameOver = false; // Ativa o jogo

  // Sorteia novas peças
  current = {
    tetromino: tetrominos[Math.floor(Math.random()*tetrominos.length)],
    row: 0,
    col: 4
  };
  nextTetromino = tetrominos[Math.floor(Math.random() * tetrominos.length)];

  // Redesenha tabuleiro e NEXT
  draw();
  drawNext();

  // Reinicia o intervalo do jogo
  clearInterval(gameInterval);
  gameInterval = setInterval(drop, speed);
}

// Cronômetro inicial: tempo = 0
time = 0; // Zera tempo
updateTimeDisplay(); // Atualiza tela
clearInterval(timeInterval); // Para cronômetro antigo

// Inicia cronômetro (incrementa time a cada segundo)
timeInterval = setInterval(() => {
  if (!gameOver) {
    time++; // Soma 1 segundo ao tempo
    updateTimeDisplay(); // Atualiza o cronômetro na tela
  }
}, 1000); // Executa a cada 1000ms = 1 segundo

// Evento do botão "Começar jogo"
document.querySelector('button[onclick="Enviar()"]').onclick = function() {
  const name = document.getElementById('playerName').value.trim(); // Pega nome
  if (!name) {
    alert('Digite seu nome antes de começar!'); // Se não tem nome, alerta
    return;
  }
  resetGame(); // Reinicia o jogo
  time = 0; // Zera tempo
  updateTimeDisplay(); // Atualiza tela
  clearInterval(timeInterval); // Para cronômetro antigo
  timeInterval = setInterval(() => {
    if (!gameOver) {
      time++;
      updateTimeDisplay();
    }
  }, 1000); // Inicia novo cronômetro
};

// Função para exibir o tempo no formato hh:mm:ss
function updateTimeDisplay() {
  // Calcula horas, minutos e segundos
  let horas = Math.floor(time / 3600); // Exemplo: se time = 3671, horas = 1
  let minutos = Math.floor((time % 3600) / 60); // Exemplo: (3671 % 3600) / 60 = 71/60 = 1
  let segundos = time % 60; // Exemplo: 3671 % 60 = 11

  // Formata com dois dígitos (ex: 01:01:11)
  let s = [horas, minutos, segundos]
    .map(v => v.toString().padStart(2, '0')) // Se for 1, vira '01'
    .join(':'); // Junta com dois pontos

  document.querySelector('.time p').textContent = s; // Atualiza texto no cronômetro
}
updateTimeDisplay(); // Exibe tempo inicial

// Função que conta quantas linhas do tabuleiro têm pelo menos um bloco
function countFilledLines() {
  // Para cada linha: row.some(cell => cell) retorna true se tem algum bloco
  // Filtra linhas não vazias e retorna a quantidade
  return board.filter(row => row.some(cell => cell)).length;
}

// Função para atualizar a velocidade do jogo conforme a pontuação
function updateSpeed() {
  // Para cada 1000 pontos, reduz o intervalo em 50ms, mínimo de 100ms
  // Math.floor(score / 1000) calcula quantos milhares de pontos
  // (500 - n*50) reduz o tempo de queda
  // Math.max(..., 100) garante que nunca fique abaixo de 100ms
  speed = Math.max(500 - Math.floor(score / 1000) * 50, 100);
  // Exibe o fator de velocidade: 500/speed, arredondado para 1 casa
  document.querySelector('.coluna1 p').textContent = (500 / speed).toFixed(1) + "x";
  clearInterval(gameInterval); // Para intervalo anterior
  gameInterval = setInterval(drop, speed); // Inicia novo intervalo com nova velocidade
}
