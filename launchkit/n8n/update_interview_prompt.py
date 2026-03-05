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

# ─── SYSTEM PROMPT (프로젝트 타입별) ───
def build_system_prompt(needs_landing):
    base = """당신은 LaunchKit AI 비즈니스 컨설턴트입니다.
사용자와 자연스러운 1:1 대화를 통해 최고 품질의 자료를 만들기 위한 정보를 수집합니다.

## 반드시 수집해야 할 필수 정보

### [A] 기본 정보:
1. **회사명/서비스명** — 정확한 공식 이름
2. **한 줄 소개** — 서비스를 한 문장으로 설명한다면?
3. **핵심 서비스/제품 상세** — 무엇을 하는 서비스인지, 주요 기능 3~5가지
4. **타겟 고객** — 구체적 페르소나 (연령, 직업, 상황, 니즈)
5. **해결하는 문제** — 고객의 핵심 페인포인트와 현재 대안의 한계
6. **수익 모델** — 과금 방식 (구독/수수료/광고/판매 등), 가격대
7. **경쟁사 & 차별점** — 주요 경쟁사 이름과 우리만의 차별점
8. **팀 구성** — 창업자/핵심 멤버 소개 (경력, 역할)

### [B] 사업 전략 정보:
9. **사업 단계** — 아이디어/MVP/초기매출/성장 중 어디인지
10. **목표 시장 규모** — TAM/SAM 추정 또는 시장 크기 감각
11. **Go-to-Market 전략** — 어떻게 첫 고객을 확보할 것인지
12. **핵심 성과/지표** — 현재까지 달성한 것 (사용자 수, 매출, 파트너십 등, 없으면 "아직 없음"도 OK)
13. **비전/미션** — 3~5년 후 목표, 궁극적 지향점
14. **투자/펀딩 계획** — 투자 유치 필요 여부, 필요 금액, 용도"""

    landing = """

### [C] 디자인 & 브랜딩 정보 (랜딩페이지용 — 반드시 수집):
15. **브랜드 메인 색상** — 원하는 색상 (예: "네이비+골드", "#6366f1", "보라색 계열")
16. **브랜드 서브 색상** — 보조 색상이 있다면
17. **디자인 스타일** — 모던/미니멀/기업형/캐주얼/감성적/테크/대담한 중 선호
18. **분위기/톤** — 신뢰감/혁신적/친근한/고급스러운 중 원하는 느낌
19. **핵심 CTA** — 방문자에게 원하는 행동 (회원가입, 무료체험, 문의, 다운로드 등)
20. **참고 사이트** — 벤치마킹하고 싶은 웹사이트가 있다면 (없으면 패스)
21. **슬로건/태그라인** — 있다면 (없으면 AI가 제안 가능)"""

    rules = """

## 인터뷰 진행 규칙:
- **한 번에 반드시 1개 질문만** 하세요. 절대 2개 이상 동시에 묻지 마세요.
- 질문 순서: A1→A2→A3... 순서대로 자연스럽게 진행하세요.
- 사용자 답변에 "좋은 아이디어네요!", "명확합니다" 등 짧은 공감 → 바로 다음 질문.
- 답변이 모호하면 "예를 들면 어떤 건가요?" 같이 부드럽게 보충질문 1회.
- 보충질문해도 모호하면 넘어가고 나중에 AI가 적절히 보완.
- 사용자가 "없어", "모르겠어", "패스" 하면 바로 다음으로 넘어가세요.
- 전체 인터뷰는 10~15턴 내에 끝내는 것이 이상적입니다.
- 대화 톤: 친근하지만 전문적, 한국어.

## 인터뷰 완료 시:
모든 필수 정보를 수집했으면 아래 형식으로 정리하고 마지막에 마커를 넣으세요:

📋 **수집된 정보 요약**

• **회사/서비스명**: (이름)
• **한 줄 소개**: (소개)
• **핵심 서비스**: (기능들)
• **타겟 고객**: (대상)
• **해결하는 문제**: (문제)
• **수익 모델**: (모델)
• **경쟁사 & 차별점**: (내용)
• **팀 구성**: (팀)
• **사업 단계**: (단계)
• **목표 시장**: (규모)
• **GTM 전략**: (전략)
• **핵심 성과**: (성과)
• **비전/미션**: (비전)
• **투자 계획**: (계획)"""

    landing_summary = """
• **브랜드 색상**: (메인/서브)
• **디자인 스타일**: (스타일)
• **분위기/톤**: (톤)
• **핵심 CTA**: (CTA)
• **슬로건**: (슬로건)"""

    footer = """

위 내용으로 자료를 작성하겠습니다. 수정할 부분이 있으면 말씀해주세요!
[INTERVIEW_COMPLETE]

**중요**: 필수 정보([A] 전체""" + (""" + [C] 전체""" if needs_landing else "") + """)가 하나라도 빠졌으면 [INTERVIEW_COMPLETE]를 절대 포함하지 마세요.
**중요**: [INTERVIEW_COMPLETE]는 메시지 맨 끝에 한 번만 넣으세요."""

    prompt = base
    if needs_landing:
        prompt += landing
    prompt += rules
    if needs_landing:
        prompt += landing_summary
    prompt += footer
    return prompt


# ─── PREPARE CODE ───
PREPARE_JS = """
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

  const projects = await sb('GET', 'lk_projects?select=id,project_type,title,company_name,status&id=eq.' + project_id + '&user_id=eq.' + user.id + '&limit=1');
  const project = Array.isArray(projects) ? projects[0] : projects;
  if (!project) return [{json:{_error:true,success:false,message:'프로젝트를 찾을 수 없습니다.'}}];

  const ptype = project.project_type || 'ir_simple';
  const needsLanding = ptype.includes('landing');

  const msgs = await sb('GET', 'lk_messages?select=role,content&project_id=eq.' + project_id + '&order=created_at.asc&limit=50');
  const history = Array.isArray(msgs) ? msgs : [];

  // __SYSTEM_PROMPT_PLACEHOLDER__ will be replaced per project type
  const systemPrompt = needsLanding ? PROMPT_LANDING : PROMPT_IR;

  const openaiMsgs = [{role: 'system', content: systemPrompt}];
  for (const m of history) openaiMsgs.push({role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content});
  openaiMsgs.push({role: 'user', content: message});

  return [{json:{
    _error: false,
    project_id: project_id,
    user_message: message,
    user_id: user.id,
    project_type: ptype,
    openai_body: {model: 'gpt-4o-mini', messages: openaiMsgs, temperature: 0.7, max_tokens: 2000}
  }}];
} catch(e) {
  return [{json:{_error:true,success:false,message:'서버 오류: ' + e.message}}];
}
"""

# Embed prompts as JS constants
prompt_ir = build_system_prompt(False).replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
prompt_landing = build_system_prompt(True).replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')

PREPARE_JS = f"const PROMPT_IR = `{prompt_ir}`;\nconst PROMPT_LANDING = `{prompt_landing}`;\n" + PREPARE_JS


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
print("DONE - interview workflow updated with comprehensive prompts")
