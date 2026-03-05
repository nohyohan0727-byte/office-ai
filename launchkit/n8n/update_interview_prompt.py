import json, requests, sys

N8N_URL = "https://jknetworks.app.n8n.cloud/api/v1"
with open("C:/Users/김은정/.claude/settings.json") as f:
    API_KEY = json.load(f)["mcpServers"]["n8n-mcp"]["env"]["N8N_API_KEY"]

WF_ID = "rg7ELOblLrnzbOsb"
headers = {"X-N8N-API-KEY": API_KEY, "Content-Type": "application/json"}

# 1. Fetch current workflow
r = requests.get(f"{N8N_URL}/workflows/{WF_ID}", headers=headers)
wf = r.json()

SB_URL = "https://mkmxhmoocqnkltjxdfbm.supabase.co"
ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbXhobW9vY3Fua2x0anhkZmJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MDE0ODIsImV4cCI6MjA4NzQ3NzQ4Mn0.tYPVpoEs_9Qbw3kcUzkImDv0d6lQ69wAZ5YKz2GqqM8"

# ─── SYSTEM PROMPT (카테고리별 분리) ───

COMMON_RULES = """
## ★ 최우선 규칙: 대화 맥락 분석 (가장 중요!) ★
- **매 응답 전에 반드시** 이전 대화 전체를 분석하여 이미 수집된 정보를 파악하세요.
- 사용자가 이미 제공한 정보는 절대 다시 묻지 마세요. 바로 다음 미수집 항목으로 넘어가세요.
- 사용자가 한 메시지에 여러 정보를 한꺼번에 제공하면:
  → 제공된 정보를 간단히 확인 ("네, OO과 OO 확인했습니다!")
  → 바로 다음 미수집 항목 1개만 질문하세요.
- 사용자가 "아래와 같아", "내용은 이래", "서비스 설명:" 등 후속 정보를 예고하면:
  → "네, 말씀해주세요!" 등 짧게 응답하고 기다리세요. 다른 질문하지 마세요.
- 사용자가 긴 텍스트(사업계획서, 서비스 설명 등)를 한꺼번에 붙여넣으면:
  → 해당 텍스트에서 최대한 많은 항목을 추출하세요.
  → "말씀해주신 내용에서 OO, OO, OO을 확인했습니다." 식으로 요약하고
  → 남은 미수집 항목 중 1개만 물어보세요.

## 인터뷰 진행 규칙:
- **한 번에 반드시 1개 질문만** 하세요. 절대 2개 이상 동시에 묻지 마세요.
- 대략적인 순서대로 진행하되, 사용자가 먼저 제공한 정보는 건너뛰세요.
- 사용자 답변에 짧은 공감(1문장) → 바로 다음 미수집 항목 질문. 길게 칭찬하지 마세요.
- 답변이 모호하면 "예를 들면 어떤 건가요?" 같이 부드럽게 보충질문 1회.
- 사용자가 "없어", "모르겠어", "패스" 하면 바로 다음으로 넘어가세요.
- 대화 톤: 친근하지만 전문적, 한국어.

## 인터뷰 완료 시:
위 필수 정보를 모두 수집했으면 아래 형식으로 정리하고 마지막에 마커를 넣으세요:

📋 **수집된 정보 요약**
(수집된 항목별로 • **항목명**: 내용 형식으로 나열)

위 내용으로 자료를 작성하겠습니다. 수정할 부분이 있으면 말씀해주세요!
[INTERVIEW_COMPLETE]

**중요**: 필수 정보가 하나라도 빠졌으면 [INTERVIEW_COMPLETE]를 절대 포함하지 마세요.
**중요**: [INTERVIEW_COMPLETE]는 메시지 맨 끝에 한 번만 넣으세요."""


def build_prompt_ir_simple():
    return """당신은 LaunchKit AI 비즈니스 컨설턴트입니다.
사용자와 자연스러운 1:1 대화를 통해 **간단 IR 자료(사업계획서)** 를 만들기 위한 정보를 수집합니다.

## 수집해야 할 필수 정보 (9개)
1. **회사/서비스명** — 정확한 공식 이름
2. **한 줄 소개** — 서비스를 한 문장으로 설명
3. **핵심 기능** — 주요 기능 3~5가지
4. **타겟 고객** — 누구를 위한 서비스인지
5. **해결 문제** — 고객의 핵심 페인포인트
6. **수익 모델** — 과금 방식, 가격대
7. **팀 구성** — 창업자/핵심 멤버
8. **브랜드 색상** — 원하는 메인 색상 (예: "네이비", "#6366f1", "보라색 계열")
9. **디자인 톤** — 신뢰감/혁신적/친근한/고급스러운 등 원하는 느낌
""" + COMMON_RULES


def build_prompt_ir_detail():
    return """당신은 LaunchKit AI 비즈니스 컨설턴트입니다.
사용자와 자연스러운 1:1 대화를 통해 **상세 IR 자료(사업계획서)** 를 만들기 위한 정보를 수집합니다.

## 수집해야 할 필수 정보 (17개)

### [A] 기본 정보:
1. **회사/서비스명** — 정확한 공식 이름
2. **한 줄 소개** — 서비스를 한 문장으로 설명
3. **핵심 기능** — 주요 기능 3~5가지
4. **타겟 고객** — 구체적 페르소나 (연령, 직업, 상황, 니즈)
5. **해결 문제** — 고객의 핵심 페인포인트와 현재 대안의 한계
6. **수익 모델** — 과금 방식 (구독/수수료/광고/판매 등), 가격대
7. **경쟁 차별점** — 주요 경쟁사와 우리만의 차별점
8. **팀 구성** — 창업자/핵심 멤버 (경력, 역할)

### [B] 사업 전략:
9. **사업 단계** — 아이디어/MVP/초기매출/성장 중 어디인지
10. **시장 규모** — TAM/SAM 추정 또는 시장 크기
11. **GTM 전략** — 첫 고객 확보 방법
12. **핵심 성과** — 현재까지 달성한 것 (없으면 "아직 없음" OK)
13. **비전/미션** — 3~5년 후 목표
14. **투자 계획** — 투자 유치 필요 여부, 금액, 용도

### [C] 디자인:
15. **브랜드 색상** — 원하는 메인 색상
16. **디자인 스타일** — 모던/미니멀/기업형/캐주얼/감성적/테크/대담한
17. **분위기/톤** — 신뢰감/혁신적/친근한/고급스러운
""" + COMMON_RULES


def build_prompt_landing_simple():
    return """당신은 LaunchKit AI 비즈니스 컨설턴트입니다.
사용자와 자연스러운 1:1 대화를 통해 **간단 랜딩페이지** 를 만들기 위한 정보를 수집합니다.

## 수집해야 할 필수 정보 (9개)
1. **회사/서비스명** — 정확한 공식 이름
2. **한 줄 소개** — 서비스를 한 문장으로 설명
3. **핵심 기능** — 주요 기능 3~5가지
4. **타겟 고객** — 누구를 위한 서비스인지
5. **브랜드 색상** — 원하는 메인 색상
6. **디자인 스타일** — 모던/미니멀/기업형/캐주얼/감성적/테크/대담한
7. **분위기/톤** — 신뢰감/혁신적/친근한/고급스러운
8. **핵심 CTA** — 방문자에게 원하는 행동 (회원가입, 무료체험, 문의, 다운로드 등)
9. **슬로건** — 슬로건/태그라인 (없으면 AI가 제안)
""" + COMMON_RULES


def build_prompt_landing_detail():
    return """당신은 LaunchKit AI 비즈니스 컨설턴트입니다.
사용자와 자연스러운 1:1 대화를 통해 **상세 랜딩페이지** 를 만들기 위한 정보를 수집합니다.

## 수집해야 할 필수 정보 (15개)

### [A] 서비스 정보:
1. **회사/서비스명** — 정확한 공식 이름
2. **한 줄 소개** — 서비스를 한 문장으로 설명
3. **핵심 기능** — 주요 기능 3~5가지
4. **타겟 고객** — 구체적 페르소나
5. **해결 문제** — 고객의 핵심 페인포인트
6. **수익 모델** — 가격/플랜 정보 (가격표 섹션에 사용)
7. **경쟁 차별점** — 우리만의 강점
8. **팀 구성** — 소개 섹션에 표시할 팀 정보

### [B] 디자인 & 브랜딩:
9. **브랜드 색상** — 메인 색상
10. **서브 색상** — 보조 색상 (없으면 AI가 조합)
11. **디자인 스타일** — 모던/미니멀/기업형/캐주얼/감성적/테크/대담한
12. **분위기/톤** — 신뢰감/혁신적/친근한/고급스러운

### [C] 랜딩페이지 전용:
13. **핵심 CTA** — 방문자에게 원하는 행동
14. **참고 사이트** — 벤치마킹 웹사이트 (없으면 패스)
15. **슬로건** — 슬로건/태그라인 (없으면 AI가 제안)
""" + COMMON_RULES


def build_prompt_bundle(ir_level='detail'):
    ir_label = '상세' if ir_level == 'detail' else '간단'
    return f"""당신은 LaunchKit AI 비즈니스 컨설턴트입니다.
사용자와 자연스러운 1:1 대화를 통해 **{ir_label} IR 자료 + 랜딩페이지** 를 함께 만들기 위한 정보를 수집합니다.

## 수집해야 할 필수 정보

### [A] 기본 정보:
1. **회사/서비스명** — 정확한 공식 이름
2. **한 줄 소개** — 서비스를 한 문장으로 설명
3. **핵심 기능** — 주요 기능 3~5가지
4. **타겟 고객** — 구체적 페르소나
5. **해결 문제** — 고객의 핵심 페인포인트
6. **수익 모델** — 과금 방식, 가격대
7. **경쟁 차별점** — 주요 경쟁사와 차별점
8. **팀 구성** — 창업자/핵심 멤버
""" + ("""
### [B] 사업 전략:
9. **사업 단계** — 아이디어/MVP/초기매출/성장
10. **시장 규모** — TAM/SAM 추정
11. **GTM 전략** — 첫 고객 확보 방법
12. **핵심 성과** — 현재까지 달성한 것
13. **비전/미션** — 3~5년 후 목표
14. **투자 계획** — 투자 유치 계획
""" if ir_level == 'detail' else '') + """
### [C] 디자인 & 브랜딩:
15. **브랜드 색상** — 메인 색상
16. **디자인 스타일** — 모던/미니멀/기업형 등
17. **분위기/톤** — 신뢰감/혁신적/친근한 등

### [D] 랜딩페이지 전용:
18. **핵심 CTA** — 방문자에게 원하는 행동
19. **참고 사이트** — 벤치마킹 사이트 (없으면 패스)
20. **슬로건** — 슬로건/태그라인 (없으면 AI가 제안)
""" + COMMON_RULES


# ─── PREPARE CODE ───
# 프롬프트를 4종류 + 번들 2종류 = 6가지로 분리
PROMPT_MAP = {
    'ir_simple': build_prompt_ir_simple(),
    'ir_detail': build_prompt_ir_detail(),
    'landing_simple': build_prompt_landing_simple(),
    'landing_detail': build_prompt_landing_detail(),
    'bundle_simple': build_prompt_bundle('simple'),
    'bundle_detail': build_prompt_bundle('detail'),
}

# JS에서 사용할 프롬프트 맵 생성
def js_escape(s):
    return s.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')

prompt_map_js = "const PROMPTS = {\n"
for key, val in PROMPT_MAP.items():
    prompt_map_js += f"  '{key}': `{js_escape(val)}`,\n"
prompt_map_js += "};\n"

PREPARE_JS = prompt_map_js + """
const self = this;
const inp = $input.first().json;
const b = inp.body || inp;
const token = b.session_token;
const project_id = b.project_id;
const message = b.message || '';

const SB = '""" + SB_URL + """';
const ANON = '""" + ANON + """';

async function sb(method, path, body) {
  const opts = {method, url: SB + '/rest/v1/' + path,
    headers: {'apikey': ANON, 'Authorization': 'Bearer ' + ANON, 'Content-Type': 'application/json', 'Prefer': 'return=representation'},
    json: true};
  if (body) opts.body = JSON.stringify(body);
  return await self.helpers.httpRequest(opts);
}

try {
  if (!token) return [{json:{_error:true,success:false,message:'인증이 필요합니다.'}}];
  const users = await sb('GET', 'lk_users?select=id,email,name,plan,tokens_total,tokens_used,session_expires&session_token=eq.' + encodeURIComponent(token) + '&limit=1');
  const user = Array.isArray(users) ? users[0] : users;
  if (!user || !user.id) return [{json:{_error:true,success:false,message:'인증이 필요합니다.'}}];
  if (new Date(user.session_expires) < new Date()) return [{json:{_error:true,success:false,message:'세션이 만료되었습니다.'}}];
  if (!project_id) return [{json:{_error:true,success:false,message:'project_id가 필요합니다.'}}];
  if (!message) return [{json:{_error:true,success:false,message:'메시지를 입력해주세요.'}}];

  const projects = await sb('GET', 'lk_projects?select=id,ir_type,landing_type,title,company_name,status&id=eq.' + project_id + '&user_id=eq.' + user.id + '&limit=1');
  const project = Array.isArray(projects) ? projects[0] : projects;
  if (!project) return [{json:{_error:true,success:false,message:'프로젝트를 찾을 수 없습니다.'}}];

  // ir_type + landing_type → prompt key 결정
  const irT = project.ir_type || '';
  const ldT = project.landing_type || '';
  let promptKey = 'ir_simple'; // fallback
  if (irT && ldT) {
    promptKey = irT === 'detail' ? 'bundle_detail' : 'bundle_simple';
  } else if (irT) {
    promptKey = 'ir_' + irT;
  } else if (ldT) {
    promptKey = 'landing_' + ldT;
  }

  const msgs = await sb('GET', 'lk_messages?select=role,content&project_id=eq.' + project_id + '&order=created_at.asc&limit=50');
  const history = Array.isArray(msgs) ? msgs : [];

  const systemPrompt = PROMPTS[promptKey] || PROMPTS['ir_simple'];

  const openaiMsgs = [{role: 'system', content: systemPrompt}];
  for (const m of history) openaiMsgs.push({role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content});
  openaiMsgs.push({role: 'user', content: message});

  return [{json:{
    _error: false,
    project_id: project_id,
    user_message: message,
    user_id: user.id,
    prompt_key: promptKey,
    openai_body: {model: 'gpt-4o-mini', messages: openaiMsgs, temperature: 0.7, max_tokens: 2000}
  }}];
} catch(e) {
  return [{json:{
    _error: true, success: false, message: '서버 오류: ' + e.message,
    openai_body: {model:'gpt-4o-mini',messages:[{role:'user',content:'error'}],max_tokens:1}
  }}];
}
"""


# ─── PROCESS CODE ───
PROCESS_JS = """
const self = this;
const prep = $('Prepare').first().json;

if (prep._error) return [{json:{success: prep.success, message: prep.message}}];

const SB = '""" + SB_URL + """';
const ANON = '""" + ANON + """';

async function sb(method, path, body) {
  const opts = {method, url: SB + '/rest/v1/' + path,
    headers: {'apikey': ANON, 'Authorization': 'Bearer ' + ANON, 'Content-Type': 'application/json', 'Prefer': 'return=representation'},
    json: true};
  if (body) opts.body = JSON.stringify(body);
  return await self.helpers.httpRequest(opts);
}

try {
  const aiJson = $input.first().json;
  let aiText = aiJson.choices?.[0]?.message?.content || '응답을 생성할 수 없습니다.';

  // 인터뷰 완료 감지
  let stage = 'interviewing';
  if (aiText.includes('[INTERVIEW_COMPLETE]')) {
    stage = 'confirming';
    aiText = aiText.replace(/\\[INTERVIEW_COMPLETE\\]/g, '').trim();
    // 프로젝트 상태 업데이트
    await sb('PATCH', 'lk_projects?id=eq.' + prep.project_id + '&user_id=eq.' + prep.user_id,
      {status: 'confirming'});
  }

  // 메시지 저장
  await sb('POST', 'lk_messages', {project_id: Number(prep.project_id), role: 'user', content: prep.user_message});
  await sb('POST', 'lk_messages', {project_id: Number(prep.project_id), role: 'assistant', content: aiText});

  return [{json:{success: true, project_id: prep.project_id, message: aiText, stage: stage}}];
} catch(e) {
  return [{json:{success:false,message:'처리 오류: ' + e.message}}];
}
"""

# 2. Update nodes
for node in wf['nodes']:
    if node['name'] == 'Prepare':
        node['parameters']['jsCode'] = PREPARE_JS.strip()
    elif node['name'] == 'Process':
        node['parameters']['jsCode'] = PROCESS_JS.strip()

# 3. PUT updated workflow
payload = {
    "name": wf['name'],
    "nodes": wf['nodes'],
    "connections": wf['connections'],
    "settings": wf.get('settings', {})
}
r = requests.put(f"{N8N_URL}/workflows/{WF_ID}", headers=headers, json=payload)
print(f"PUT: {r.status_code}")
if r.status_code != 200:
    print(r.text[:500])
    sys.exit(1)

# 4. Reactivate
requests.post(f"{N8N_URL}/workflows/{WF_ID}/deactivate", headers=headers)
r2 = requests.post(f"{N8N_URL}/workflows/{WF_ID}/activate", headers=headers)
print(f"Activate: {r2.status_code}")
print("DONE - interview workflow updated with category-specific prompts")
