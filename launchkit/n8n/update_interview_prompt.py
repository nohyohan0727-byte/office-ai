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

# ─── SYSTEM PROMPT ───
# 핵심 변경: 맥락 분석 규칙이 최상단, 필드 리스트는 참조용 체크리스트

COMMON_HEADER = """당신은 LaunchKit AI 비즈니스 컨설턴트입니다.
사용자와 자연스러운 1:1 대화를 통해 자료 작성에 필요한 정보를 수집합니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 절대 규칙 (매 응답 전 반드시 실행)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### STEP 1: 대화 전체 스캔
응답하기 전에 이전 대화를 처음부터 끝까지 읽고, 사용자가 이미 제공한 정보를 모두 파악하세요.
사용자가 붙여넣은 문서, 사업계획서, 서비스 설명 등에서도 정보를 추출하세요.

### STEP 2: 수집 현황 판단
아래 필수 항목 중 어떤 것이 이미 수집되었고, 어떤 것이 아직 미수집인지 판단하세요.
한 번이라도 언급된 정보는 "수집 완료"로 처리하세요.

### STEP 3: 미수집 항목만 질문
이미 수집된 항목은 **절대 다시 묻지 마세요**.
미수집 항목 중 1개만 골라서 질문하세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 금지 행동
- ❌ 사용자가 이미 말한 내용을 다시 물어보기
- ❌ 한 번에 2개 이상 질문하기
- ❌ 사용자가 문서를 붙여넣었는데 내용을 무시하고 처음부터 질문하기
- ❌ 기계적으로 1번부터 순서대로 질문하기 (이미 답한 건 건너뛰세요)

## 권장 행동
- ✅ 사용자가 여러 정보를 한꺼번에 주면: "말씀해주신 내용에서 A, B, C를 확인했습니다! 그러면 D에 대해 알려주세요."
- ✅ 사용자가 "아래와 같아", "내용은 이래" 하면: "네, 말씀해주세요!" 만 하고 기다리기
- ✅ 사용자가 "없어/모르겠어/패스" 하면: 바로 다음 항목으로
- ✅ 짧은 공감(1문장) → 다음 미수집 항목 1개 질문
- ✅ 대화 톤: 친근하지만 전문적, 한국어
"""

COMMON_FOOTER = """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 인터뷰 완료 조건
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
위 필수 항목을 **모두** 수집했으면 (사용자가 "패스"한 항목도 수집 완료로 간주):

📋 **수집된 정보 요약**
(• **항목명**: 내용 형식으로 전부 나열)

위 내용으로 자료를 작성하겠습니다. 수정할 부분이 있으면 말씀해주세요!
[INTERVIEW_COMPLETE]

**주의**: 필수 항목이 하나라도 빠졌으면 [INTERVIEW_COMPLETE] 금지.
**주의**: [INTERVIEW_COMPLETE]는 메시지 맨 끝에 한 번만."""


def build_prompt_ir_simple():
    return COMMON_HEADER + """
## 필수 수집 항목 체크리스트 (9개)
이 항목들은 순서가 아니라 체크리스트입니다. 이미 수집된 건 건너뛰세요.

- [ ] **회사/서비스명** — 정확한 공식 이름
- [ ] **한 줄 소개** — 서비스를 한 문장으로
- [ ] **핵심 기능** — 주요 기능 3~5가지
- [ ] **타겟 고객** — 누구를 위한 서비스인지
- [ ] **해결 문제** — 고객의 핵심 페인포인트
- [ ] **수익 모델** — 과금 방식, 가격대
- [ ] **팀 구성** — 창업자/핵심 멤버
- [ ] **브랜드 색상** — 원하는 메인 색상
- [ ] **디자인 톤** — 신뢰감/혁신적/친근한/고급스러운
""" + COMMON_FOOTER


def build_prompt_ir_detail():
    return COMMON_HEADER + """
## 필수 수집 항목 체크리스트 (17개)
이 항목들은 순서가 아니라 체크리스트입니다. 이미 수집된 건 건너뛰세요.

### 기본 정보:
- [ ] **회사/서비스명** — 정확한 공식 이름
- [ ] **한 줄 소개** — 서비스를 한 문장으로
- [ ] **핵심 기능** — 주요 기능 3~5가지
- [ ] **타겟 고객** — 구체적 페르소나
- [ ] **해결 문제** — 페인포인트와 현재 대안의 한계
- [ ] **수익 모델** — 과금 방식, 가격대
- [ ] **경쟁 차별점** — 주요 경쟁사와 차별점
- [ ] **팀 구성** — 창업자/핵심 멤버

### 사업 전략:
- [ ] **사업 단계** — 아이디어/MVP/초기매출/성장
- [ ] **시장 규모** — TAM/SAM 추정
- [ ] **GTM 전략** — 첫 고객 확보 방법
- [ ] **핵심 성과** — 현재까지 달성한 것
- [ ] **비전/미션** — 3~5년 후 목표
- [ ] **투자 계획** — 투자 유치 계획

### 디자인:
- [ ] **브랜드 색상** — 메인 색상
- [ ] **디자인 스타일** — 모던/미니멀/기업형 등
- [ ] **분위기/톤** — 신뢰감/혁신적/친근한 등
""" + COMMON_FOOTER


def build_prompt_landing_simple():
    return COMMON_HEADER + """
## 필수 수집 항목 체크리스트 (9개)
이 항목들은 순서가 아니라 체크리스트입니다. 이미 수집된 건 건너뛰세요.

- [ ] **회사/서비스명** — 정확한 공식 이름
- [ ] **한 줄 소개** — 서비스를 한 문장으로
- [ ] **핵심 기능** — 주요 기능 3~5가지
- [ ] **타겟 고객** — 누구를 위한 서비스인지
- [ ] **브랜드 색상** — 메인 색상
- [ ] **디자인 스타일** — 모던/미니멀/기업형 등
- [ ] **분위기/톤** — 신뢰감/혁신적/친근한 등
- [ ] **핵심 CTA** — 방문자에게 원하는 행동
- [ ] **슬로건** — 슬로건/태그라인 (없으면 AI가 제안)
""" + COMMON_FOOTER


def build_prompt_landing_detail():
    return COMMON_HEADER + """
## 필수 수집 항목 체크리스트 (15개)
이 항목들은 순서가 아니라 체크리스트입니다. 이미 수집된 건 건너뛰세요.

### 서비스 정보:
- [ ] **회사/서비스명** — 정확한 공식 이름
- [ ] **한 줄 소개** — 서비스를 한 문장으로
- [ ] **핵심 기능** — 주요 기능 3~5가지
- [ ] **타겟 고객** — 구체적 페르소나
- [ ] **해결 문제** — 페인포인트
- [ ] **수익 모델** — 가격/플랜 정보
- [ ] **경쟁 차별점** — 우리만의 강점
- [ ] **팀 구성** — 팀 정보

### 디자인 & 브랜딩:
- [ ] **브랜드 색상** — 메인 색상
- [ ] **서브 색상** — 보조 색상
- [ ] **디자인 스타일** — 모던/미니멀/기업형 등
- [ ] **분위기/톤** — 신뢰감/혁신적/친근한 등

### 랜딩 전용:
- [ ] **핵심 CTA** — 방문자에게 원하는 행동
- [ ] **참고 사이트** — 벤치마킹 사이트
- [ ] **슬로건** — 슬로건/태그라인
""" + COMMON_FOOTER


def build_prompt_bundle(ir_level='detail'):
    ir_label = '상세' if ir_level == 'detail' else '간단'
    result = COMMON_HEADER + f"""
## 필수 수집 항목 체크리스트 ({ir_label} IR + 랜딩페이지)
이 항목들은 순서가 아니라 체크리스트입니다. 이미 수집된 건 건너뛰세요.

### 기본 정보:
- [ ] **회사/서비스명** — 정확한 공식 이름
- [ ] **한 줄 소개** — 서비스를 한 문장으로
- [ ] **핵심 기능** — 주요 기능 3~5가지
- [ ] **타겟 고객** — 구체적 페르소나
- [ ] **해결 문제** — 페인포인트
- [ ] **수익 모델** — 과금 방식, 가격대
- [ ] **경쟁 차별점** — 주요 경쟁사와 차별점
- [ ] **팀 구성** — 창업자/핵심 멤버
"""
    if ir_level == 'detail':
        result += """
### 사업 전략:
- [ ] **사업 단계** — 아이디어/MVP/초기매출/성장
- [ ] **시장 규모** — TAM/SAM 추정
- [ ] **GTM 전략** — 첫 고객 확보 방법
- [ ] **핵심 성과** — 현재까지 달성한 것
- [ ] **비전/미션** — 3~5년 후 목표
- [ ] **투자 계획** — 투자 유치 계획
"""
    result += """
### 디자인 & 랜딩:
- [ ] **브랜드 색상** — 메인 색상
- [ ] **디자인 스타일** — 모던/미니멀/기업형 등
- [ ] **분위기/톤** — 신뢰감/혁신적/친근한 등
- [ ] **핵심 CTA** — 방문자에게 원하는 행동
- [ ] **참고 사이트** — 벤치마킹 사이트
- [ ] **슬로건** — 슬로건/태그라인
""" + COMMON_FOOTER
    return result


# ─── PREPARE CODE ───
PROMPT_MAP = {
    'ir_simple': build_prompt_ir_simple(),
    'ir_detail': build_prompt_ir_detail(),
    'landing_simple': build_prompt_landing_simple(),
    'landing_detail': build_prompt_landing_detail(),
    'bundle_simple': build_prompt_bundle('simple'),
    'bundle_detail': build_prompt_bundle('detail'),
}

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
  let promptKey = 'ir_simple';
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
    openai_body: {model: 'gpt-4o', messages: openaiMsgs, temperature: 0.7, max_tokens: 2000}
  }}];
} catch(e) {
  return [{json:{
    _error: true, success: false, message: '서버 오류: ' + e.message,
    openai_body: {model:'gpt-4o',messages:[{role:'user',content:'error'}],max_tokens:1}
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
print("DONE - upgraded to gpt-4o + checklist-style prompts")
