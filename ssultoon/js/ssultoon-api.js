// ssultoon-api.js — Supabase API 호출 래퍼

const API = (() => {
  const headers = () => ({
    'apikey': ST_ENV.SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + ST_ENV.SUPABASE_ANON_KEY,
    'Content-Type': 'application/json'
  });

  async function get(path) {
    const res = await fetch(ST_ENV.SUPABASE_URL + path, { headers: headers() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function post(path, body, prefer = 'return=representation') {
    const res = await fetch(ST_ENV.SUPABASE_URL + path, {
      method: 'POST',
      headers: { ...headers(), 'Prefer': prefer },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(await res.text());
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  async function patch(path, body) {
    const res = await fetch(ST_ENV.SUPABASE_URL + path, {
      method: 'PATCH',
      headers: { ...headers(), 'Prefer': 'return=representation' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(await res.text());
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  async function webhook(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return res.json();
  }

  const CATEGORY_MAP = {
    villain: '빌런 대처',
    newbie: '신입/초년생',
    boss: '상사/팀장',
    colleague: '동료 관계',
    overtime: '연차/야근',
    salary: '월급/돈',
    afterwork: '퇴근 후',
    office_romance: '직장 내 연애',
    seasonal: '시즌'
  };

  return {
    CATEGORY_MAP,
    patch,

    // ─── Topics ───
    async getTopics(status, category) {
      let q = '/rest/v1/st_topics?order=empathy_score.desc,created_at.desc';
      if (status) q += `&status=eq.${status}`;
      if (category) q += `&category=eq.${category}`;
      return get(q);
    },

    async getTopic(id) {
      const rows = await get(`/rest/v1/st_topics?id=eq.${id}`);
      return rows[0] || null;
    },

    async createTopic(data) {
      return post('/rest/v1/st_topics', data);
    },

    async updateTopic(id, data) {
      return patch(`/rest/v1/st_topics?id=eq.${id}`, data);
    },

    async approveTopic(id, note) {
      return patch(`/rest/v1/st_topics?id=eq.${id}`, {
        status: 'approved',
        reviewer_note: note || null,
        approved_at: new Date().toISOString()
      });
    },

    async rejectTopic(id, note) {
      return patch(`/rest/v1/st_topics?id=eq.${id}`, {
        status: 'rejected',
        reviewer_note: note || null
      });
    },

    // ─── Scripts ───
    async getScripts(status) {
      let q = '/rest/v1/st_scripts?select=*,st_topics(title,category)&order=created_at.desc';
      if (status) q += `&status=eq.${status}`;
      return get(q);
    },

    async generateScript(topicId) {
      return webhook(ST_ENV.ST_GENERATE_SCRIPT_WEBHOOK, { topic_id: topicId });
    },

    async updateScript(id, data) {
      return patch(`/rest/v1/st_scripts?id=eq.${id}`, data);
    },

    // ─── Productions ───
    async getProductions(status) {
      let q = '/rest/v1/st_productions?select=*,st_scripts(youtube_title,st_topics(title,category))&order=created_at.desc';
      if (status) q += `&status=eq.${status}`;
      return get(q);
    },

    async startProduction(scriptId) {
      return webhook(ST_ENV.ST_PRODUCE_WEBHOOK, { script_id: scriptId });
    },

    // ─── Characters ───
    async getCharacters() {
      return get('/rest/v1/st_characters?order=created_at.asc');
    },

    async upsertCharacter(data) {
      return post('/rest/v1/st_characters', data, 'resolution=merge-duplicates,return=representation');
    },

    // ─── Uploads ───
    async getUploads() {
      return get('/rest/v1/st_uploads?select=*,st_productions(st_scripts(youtube_title))&order=created_at.desc');
    },

    async startUpload(productionId) {
      return webhook(ST_ENV.ST_UPLOAD_WEBHOOK, { production_id: productionId });
    },

    // ─── Performance ───
    async getPerformance() {
      return get('/rest/v1/st_performance?select=*,st_uploads(youtube_title,youtube_url)&order=measured_at.desc&limit=100');
    },

    // ─── Stats ───
    async getStats() {
      const [topics, scripts, productions] = await Promise.all([
        get('/rest/v1/st_topics?select=status'),
        get('/rest/v1/st_scripts?select=status'),
        get('/rest/v1/st_productions?select=status,cost_total')
      ]);
      return {
        topics: {
          total: topics.length,
          pending: topics.filter(t => t.status === 'pending').length,
          approved: topics.filter(t => t.status === 'approved').length
        },
        scripts: {
          total: scripts.length,
          review: scripts.filter(s => s.status === 'review').length,
          approved: scripts.filter(s => s.status === 'approved').length
        },
        productions: {
          total: productions.length,
          inProgress: productions.filter(p => !['approved','failed'].includes(p.status)).length,
          totalCost: productions.reduce((s, p) => s + (p.cost_total || 0), 0)
        }
      };
    }
  };
})();
