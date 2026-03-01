// =============================================
// 가라온브로스 — 추천 앱 메인 로직
// =============================================

// --- 상태 ---
let state = {
  mode: null,       // 'board' | 'hand'
  step: 0,
  filters: {},
  results: [],
};

// --- 추천 엔진 ---

function filterBoardGames(filters) {
  return BOARD_GAMES.filter(g => {
    if (!g.is_available && g.is_available !== undefined) return false;

    // 인원수
    if (filters.players) {
      if (g.min_players > filters.players || g.max_players < filters.players) return false;
    }
    // 난이도
    if (filters.difficulty) {
      if (g.difficulty > filters.difficulty) return false;
    }
    // 카테고리 (하나라도 포함되면 OK)
    if (filters.categories && filters.categories.length > 0) {
      const match = filters.categories.some(c => g.categories.includes(c));
      if (!match) return false;
    }
    // 플레이 시간
    if (filters.maxTime) {
      if (g.play_time_min > filters.maxTime) return false;
    }
    return true;
  }).sort((a, b) => b.fun_score - a.fun_score); // 재미도 높은 순
}

function filterHandGames(filters) {
  return HAND_GAMES.filter(g => {
    if (filters.players) {
      if (g.min_players > filters.players || g.max_players < filters.players) return false;
    }
    if (filters.categories && filters.categories.length > 0) {
      const match = filters.categories.some(c => g.categories.includes(c));
      if (!match) return false;
    }
    if (filters.maxTime) {
      if (g.play_time_min > filters.maxTime) return false;
    }
    return true;
  }).sort((a, b) => b.fun_score - a.fun_score);
}

// Supabase에서 게임 로드 (DB 우선, 실패 시 로컬 데이터 사용)
async function loadGamesFromDB() {
  const db = getDB();
  if (!db) return { board: BOARD_GAMES, hand: HAND_GAMES };

  try {
    const [bgRes, hgRes] = await Promise.all([
      db.from('board_games').select('*').eq('is_available', true),
      db.from('hand_games').select('*'),
    ]);
    const board = bgRes.data && bgRes.data.length > 0 ? bgRes.data : BOARD_GAMES;
    const hand  = hgRes.data && hgRes.data.length > 0 ? hgRes.data : HAND_GAMES;
    return { board, hand };
  } catch (e) {
    console.warn('DB 로드 실패, 로컬 데이터 사용:', e);
    return { board: BOARD_GAMES, hand: HAND_GAMES };
  }
}

// Supabase에 게임 추가 (admin용)
async function addBoardGame(game) {
  const db = getDB();
  if (!db) throw new Error('DB 연결 안됨');
  const { data, error } = await db.from('board_games').insert([game]).select();
  if (error) throw error;
  return data[0];
}

async function addHandGame(game) {
  const db = getDB();
  if (!db) throw new Error('DB 연결 안됨');
  const { data, error } = await db.from('hand_games').insert([game]).select();
  if (error) throw error;
  return data[0];
}

async function toggleAvailable(id, available) {
  const db = getDB();
  if (!db) throw new Error('DB 연결 안됨');
  const { error } = await db.from('board_games').update({ is_available: available }).eq('id', id);
  if (error) throw error;
}

// --- UI 헬퍼 ---

function el(id) { return document.getElementById(id); }

function showStep(stepId) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  const t = el(stepId);
  if (t) { t.classList.add('active'); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
}

function renderStars(score, max = 5) {
  return '★'.repeat(score) + '☆'.repeat(max - score);
}

function renderDifficulty(d) {
  const labels = ['', '쉬움', '쉬움', '보통', '어려움', '매우 어려움'];
  return labels[d] || '보통';
}

function renderTime(min) {
  if (min < 60) return `${min}분`;
  return `${Math.floor(min / 60)}시간 ${min % 60 ? (min % 60) + '분' : ''}`.trim();
}

function renderPlayers(min, max) {
  if (max >= 99) return `${min}명+`;
  if (min === max) return `${min}명`;
  return `${min}-${max}명`;
}
