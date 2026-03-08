// discovery-api.js — Supabase API 호출 래퍼

const API = (() => {
  const headers = () => ({
    'apikey': DISC_ENV.SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + DISC_ENV.SUPABASE_ANON_KEY,
    'Content-Type': 'application/json'
  });

  async function get(path) {
    const res = await fetch(DISC_ENV.SUPABASE_URL + path, { headers: headers() });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function post(path, body, prefer = 'return=representation') {
    const res = await fetch(DISC_ENV.SUPABASE_URL + path, {
      method: 'POST',
      headers: { ...headers(), 'Prefer': prefer },
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

  return {
    // 해당 날짜의 run_seq 목록 조회
    async getRunVersions(date) {
      const d = date || new Date().toISOString().split('T')[0];
      try {
        const rows = await get(`/rest/v1/sc_recommendations?date=eq.${d}&select=run_seq&order=run_seq.asc&limit=200`);
        if (!Array.isArray(rows)) return [1];
        const seqs = [...new Set(rows.map(r => r.run_seq || 1))].sort((a,b) => a-b);
        return seqs.length ? seqs : [1];
      } catch(e) { return [1]; }
    },

    // 오늘의 추천 목록 (deep 분석 포함, run_seq 필터)
    async getRecommendations(date, runSeq) {
      const d = date || new Date().toISOString().split('T')[0];
      let filter = `/rest/v1/sc_recommendations?date=eq.${d}`;
      if (runSeq && runSeq > 0) filter += `&run_seq=eq.${runSeq}`;
      return get(`${filter}&select=id,rank,status,run_seq,sc_analysis(id,opportunity_score,demand_score,supply_gap_score,growth_score,differentiation_score,longevity_score,entry_barrier_score,calendar_bonus,longevity_type,suggested_angle,suggested_format,format_reasoning,target_audience,recommended_tone,recommended_duration,comment_gap_analysis,existing_video_analysis,sc_trends(id,title,source,category,related_keywords,status,raw_data,sc_analysis(calendar_event_id,sc_calendar_events(title))))&order=rank.asc`);
    },

    // 다가오는 이벤트 (14일 이내)
    async getUpcomingEvents(days = 14) {
      const today = new Date().toISOString().split('T')[0];
      const future = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
      return get(`/rest/v1/sc_calendar_events?event_date=gte.${today}&event_date=lte.${future}&status=eq.active&order=event_date.asc`);
    },

    // 모든 캘린더 이벤트
    async getCalendarEvents(year, month) {
      const start = `${year}-${String(month).padStart(2,'0')}-01`;
      const end = `${year}-${String(month).padStart(2,'0')}-31`;
      return get(`/rest/v1/sc_calendar_events?event_date=gte.${start}&event_date=lte.${end}&status=eq.active&order=event_date.asc`);
    },

    // 히스토리 (분석 이력)
    async getHistory(limit = 30) {
      return get(`/rest/v1/sc_analysis?analysis_phase=eq.deep&select=id,opportunity_score,suggested_format,longevity_type,analyzed_at,sc_trends(title,source)&order=analyzed_at.desc&limit=${limit}`);
    },

    // 승인된 큐
    async getApprovedQueue() {
      return get(`/rest/v1/sc_recommendations?status=eq.approved&select=id,date,rank,sc_analysis(opportunity_score,suggested_format,suggested_angle,sc_trends(title,status)),sc_reviews(reviewer_note,priority,style_hint,reviewed_at)&order=date.desc,rank.asc`);
    },

    // 설정
    async getSettings() {
      const rows = await get('/rest/v1/sc_settings?select=key,value&order=key.asc');
      const map = {};
      for (const r of rows) map[r.key] = r.value;
      return map;
    },

    async updateSetting(key, value) {
      return post('/rest/v1/sc_settings', { key, value, updated_at: new Date().toISOString() }, 'resolution=merge-duplicates,return=minimal');
    },

    // 리뷰 제출
    async submitReview(data) {
      return webhook(DISC_ENV.SC_REVIEW_WEBHOOK, data);
    },

    // 캘린더 이벤트 등록/수정
    async upsertCalendarEvent(data) {
      return webhook(DISC_ENV.SC_CALENDAR_WEBHOOK, data);
    },

    // 추천 수동 실행
    async runRecommend() {
      return webhook(DISC_ENV.SC_RECOMMEND_WEBHOOK, {});
    }
  };
})();
