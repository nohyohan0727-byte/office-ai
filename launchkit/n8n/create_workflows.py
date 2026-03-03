# -*- coding: utf-8 -*-
"""
LaunchKit n8n workflow auto-create script
Run: python create_workflows.py
"""
import json, urllib.request, urllib.error, uuid, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

N8N_URL = "https://jknetworks.app.n8n.cloud"
N8N_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMTM4NWNiNC1mZmVkLTQ5YmItYjdlYi1iZWZkMGZmZWEwOGUiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzcwNjk1NTY2LCJleHAiOjE3Nzg0MjUyMDB9.uIz72k9V_t5Z-AX3airrdYhkWDZLBdxv4cOnUmGoRd8"

# Supabase (garaon-bros 기존 프로젝트 공유)
SB_URL = "https://mkmxhmoocqnkltjxdfbm.supabase.co"
SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbXhobW9vY3Fua2x0anhkZmJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MDE0ODIsImV4cCI6MjA4NzQ3NzQ4Mn0.tYPVpoEs_9Qbw3kcUzkImDv0d6lQ69wAZ5YKz2GqqM8"

# OpenAI credential (n8n에 저장된 기존 크리덴셜)
OPENAI_CRED_ID   = "3Ce5sE9uZ6LPb2sk"
OPENAI_CRED_NAME = "OpenAi account 0206"


def nid():
    return str(uuid.uuid4())


def make_webhook(node_id, path, pos):
    return {
        "id": node_id, "name": "Webhook",
        "type": "n8n-nodes-base.webhook",
        "typeVersion": 2, "position": pos,
        "parameters": {
            "path": path,
            "httpMethod": "POST",
            "responseMode": "responseNode",
        }
    }


def make_respond(node_id, pos):
    return {
        "id": node_id, "name": "Respond",
        "type": "n8n-nodes-base.respondToWebhook",
        "typeVersion": 1, "position": pos,
        "parameters": {
            "respondWith": "json",
            "responseBody": "={{ JSON.stringify($json) }}",
        }
    }


def make_code(node_id, name, code, pos):
    return {
        "id": node_id, "name": name,
        "type": "n8n-nodes-base.code",
        "typeVersion": 2, "position": pos,
        "parameters": {"jsCode": code, "mode": "runOnceForAllItems"}
    }


def make_http_openai(node_id, name, pos):
    """OpenAI 저장 크리덴셜 사용하는 HTTP Request 노드"""
    return {
        "id": node_id, "name": name,
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2, "position": pos,
        "credentials": {
            "openAiApi": {"id": OPENAI_CRED_ID, "name": OPENAI_CRED_NAME}
        },
        "parameters": {
            "method": "POST",
            "url": "https://api.openai.com/v1/chat/completions",
            "authentication": "predefinedCredentialType",
            "nodeCredentialType": "openAiApi",
            "sendBody": True,
            "contentType": "raw",
            "rawContentType": "application/json",
            "body": "={{ JSON.stringify({ model: 'gpt-4o', messages: $json.messages, temperature: 0.7, max_tokens: $json.max_tokens || 2000 }) }}",
            "options": {},
        }
    }


def connect(from_name, to_name):
    return {from_name: {"main": [[{"node": to_name, "type": "main", "index": 0}]]}}


def merge_connections(*conn_list):
    result = {}
    for c in conn_list:
        result.update(c)
    return result


def create_workflow(workflow_data):
    url = f"{N8N_URL}/api/v1/workflows"
    body = json.dumps(workflow_data).encode()
    req = urllib.request.Request(url, data=body, headers={
        "Content-Type": "application/json",
        "X-N8N-API-KEY": N8N_KEY
    }, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
            return result.get("id"), True, ""
    except urllib.error.HTTPError as e:
        return None, False, e.read().decode()


def activate_workflow(wf_id):
    url = f"{N8N_URL}/api/v1/workflows/{wf_id}/activate"
    req = urllib.request.Request(url, data=b'{}', headers={
        "Content-Type": "application/json",
        "X-N8N-API-KEY": N8N_KEY
    }, method="PATCH")
    try:
        with urllib.request.urlopen(req):
            return True
    except Exception:
        return False


# ──────────────────────────────────────────────────────────────────────
# SHARED JS 헬퍼 (Code 노드에 삽입)
# ──────────────────────────────────────────────────────────────────────
SB_HELPERS = f"""
const SB_URL = '{SB_URL}';
const SB_KEY = '{SB_KEY}';
const SB_HDR = {{
  'apikey': SB_KEY,
  'Authorization': 'Bearer ' + SB_KEY,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
}};
const PLAN_TOKENS = {{ free: 100, pro: 500, pro_max: 2500 }};
const TOKEN_COST  = {{ ir_simple: 80, ir_detail: 200, landing_simple: 120, landing_detail: 300 }};

async function sb(method, path, body) {{
  const opts = {{ method, url: SB_URL + '/rest/v1/' + path, headers: SB_HDR }};
  if (body) opts.body = body;
  return $helpers.httpRequest(opts);
}}

async function validateSession(token) {{
  if (!token) return null;
  const rows = await sb('GET', `lk_users?session_token=eq.${{encodeURIComponent(token)}}&select=*`);
  if (!rows || !rows.length) return null;
  const u = rows[0];
  if (!u.is_active) return null;
  if (new Date(u.session_expires) < new Date()) return null;
  return u;
}}
"""


# ──────────────────────────────────────────────────────────────────────
# 1. launchkit-register
# ──────────────────────────────────────────────────────────────────────
def wf_register():
    wid, cid, rid = nid(), nid(), nid()
    code = SB_HELPERS + """
const b = $input.first().json.body || $input.first().json;
const { name, email, password, plan = 'free' } = b;

if (!name || !email || !password)
  return [{ json: { success: false, message: '이름, 이메일, 비밀번호를 입력해주세요.' } }];
if (password.length < 8)
  return [{ json: { success: false, message: '비밀번호는 8자 이상이어야 합니다.' } }];
if (!['free','pro','pro_max'].includes(plan))
  return [{ json: { success: false, message: '올바른 플랜을 선택해주세요.' } }];

const exists = await sb('GET', `lk_users?email=eq.${encodeURIComponent(email)}&select=id`);
if (exists && exists.length > 0)
  return [{ json: { success: false, message: '이미 사용 중인 이메일입니다.' } }];

const crypto = require('crypto');
const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
const session_token   = crypto.randomUUID();
const session_expires = new Date(Date.now() + 30*24*60*60*1000).toISOString();
const tokens_total    = PLAN_TOKENS[plan] || 100;

const rows = await sb('POST', 'lk_users', {
  name, email,
  password_hash: `pbkdf2:${salt}:${hash}`,
  plan, tokens_total, tokens_used: 0,
  session_token, session_expires,
});
const user = rows[0];
return [{ json: {
  success: true, session_token,
  user: { id: user.id, name: user.name, email: user.email,
          plan: user.plan, tokens_total: user.tokens_total, tokens_used: 0 }
}}];
"""
    nodes = [
        make_webhook(wid, "launchkit-register", [240, 300]),
        make_code(cid, "RegisterLogic", code, [480, 300]),
        make_respond(rid, [720, 300]),
    ]
    conns = merge_connections(connect("Webhook", "RegisterLogic"), connect("RegisterLogic", "Respond"))
    return {"name": "launchkit-register", "nodes": nodes, "connections": conns, "settings": {"executionOrder": "v1"}}


# ──────────────────────────────────────────────────────────────────────
# 2. launchkit-login
# ──────────────────────────────────────────────────────────────────────
def wf_login():
    wid, cid, rid = nid(), nid(), nid()
    code = SB_HELPERS + """
const b = $input.first().json.body || $input.first().json;
const { email, password } = b;
if (!email || !password)
  return [{ json: { success: false, message: '이메일과 비밀번호를 입력해주세요.' } }];

const users = await sb('GET', `lk_users?email=eq.${encodeURIComponent(email)}&select=*`);
if (!users || !users.length)
  return [{ json: { success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' } }];

const user = users[0];
if (!user.is_active)
  return [{ json: { success: false, message: '비활성화된 계정입니다.' } }];

const crypto = require('crypto');
const [, salt, storedHash] = user.password_hash.split(':');
const inputHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
if (inputHash !== storedHash)
  return [{ json: { success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' } }];

const session_token   = crypto.randomUUID();
const session_expires = new Date(Date.now() + 30*24*60*60*1000).toISOString();
await sb('PATCH', `lk_users?id=eq.${user.id}`, { session_token, session_expires });

return [{ json: {
  success: true, session_token,
  user: { id: user.id, name: user.name, email: user.email,
          plan: user.plan, tokens_total: user.tokens_total, tokens_used: user.tokens_used }
}}];
"""
    nodes = [
        make_webhook(wid, "launchkit-login", [240, 300]),
        make_code(cid, "LoginLogic", code, [480, 300]),
        make_respond(rid, [720, 300]),
    ]
    conns = merge_connections(connect("Webhook", "LoginLogic"), connect("LoginLogic", "Respond"))
    return {"name": "launchkit-login", "nodes": nodes, "connections": conns, "settings": {"executionOrder": "v1"}}


# ──────────────────────────────────────────────────────────────────────
# 3. launchkit-get-projects
# ──────────────────────────────────────────────────────────────────────
def wf_get_projects():
    wid, cid, rid = nid(), nid(), nid()
    code = SB_HELPERS + """
const b = $input.first().json.body || $input.first().json;
const user = await validateSession(b.session_token);
if (!user) return [{ json: { success: false, message: '인증이 필요합니다.' } }];

const projects = await sb('GET',
  `lk_projects?user_id=eq.${user.id}&order=created_at.desc&select=*`);

const total   = projects.length;
const ir      = projects.filter(p => p.ir_html).length;
const landing = projects.filter(p => p.landing_html).length;
const tokens  = projects.reduce((s, p) => s + (p.tokens_used || 0), 0);

return [{ json: {
  success: true,
  projects,
  stats: { total, ir, landing, tokens_used: user.tokens_used }
}}];
"""
    nodes = [
        make_webhook(wid, "launchkit-get-projects", [240, 300]),
        make_code(cid, "GetProjects", code, [480, 300]),
        make_respond(rid, [720, 300]),
    ]
    conns = merge_connections(connect("Webhook", "GetProjects"), connect("GetProjects", "Respond"))
    return {"name": "launchkit-get-projects", "nodes": nodes, "connections": conns, "settings": {"executionOrder": "v1"}}


# ──────────────────────────────────────────────────────────────────────
# 4. launchkit-get-project
# ──────────────────────────────────────────────────────────────────────
def wf_get_project():
    wid, cid, rid = nid(), nid(), nid()
    code = SB_HELPERS + """
const b = $input.first().json.body || $input.first().json;
const user = await validateSession(b.session_token);
if (!user) return [{ json: { success: false, message: '인증이 필요합니다.' } }];

const pid = b.project_id;
const projs = await sb('GET',
  `lk_projects?id=eq.${pid}&user_id=eq.${user.id}&select=*`);
if (!projs || !projs.length)
  return [{ json: { success: false, message: '프로젝트를 찾을 수 없습니다.' } }];

const msgs = await sb('GET',
  `lk_messages?project_id=eq.${pid}&order=created_at.asc&select=*`);

return [{ json: { success: true, project: projs[0], messages: msgs || [] }}];
"""
    nodes = [
        make_webhook(wid, "launchkit-get-project", [240, 300]),
        make_code(cid, "GetProject", code, [480, 300]),
        make_respond(rid, [720, 300]),
    ]
    conns = merge_connections(connect("Webhook", "GetProject"), connect("GetProject", "Respond"))
    return {"name": "launchkit-get-project", "nodes": nodes, "connections": conns, "settings": {"executionOrder": "v1"}}


# ──────────────────────────────────────────────────────────────────────
# 5. launchkit-interview  (AI 인터뷰)
# ──────────────────────────────────────────────────────────────────────
def wf_interview():
    wid, c1id, aiid, c2id, rid = nid(), nid(), nid(), nid(), nid()

    SYSTEM_PROMPT = """당신은 AI 비즈니스 전략가입니다. 사용자의 사업 아이디어를 구체화하는 인터뷰를 진행합니다.
규칙:
1. 한 번에 하나의 질문만 합니다 (짧고 명확하게)
2. 아래 정보를 자연스럽게 수집합니다: 회사/서비스명, 해결하는 문제, 타겟 고객, 핵심 솔루션, 비즈니스 모델, 경쟁 우위
3. 6~8번 대화 후 충분한 정보가 모이면 IR 목차와 랜딩페이지 섹션 구성안을 제안합니다
4. 구성안 제안 시 반드시 응답 마지막에 [CONFIRMING] 태그를 추가합니다
5. 한국어로만 응답합니다"""

    code1 = SB_HELPERS + f"""
const b = $input.first().json.body || $input.first().json;
const user = await validateSession(b.session_token);
if (!user) return [{{ json: {{ messages: [], max_tokens: 800, _error: '인증 필요' }} }}];

const action = b.action;
let projectId = b.project_id;
let messages = [];

const systemMsg = {{ role: 'system', content: `{SYSTEM_PROMPT}` }};

if (action === 'start') {{
  const projType = b.project_type || 'ir_detail';
  const title    = b.title || '새 프로젝트';
  const rows = await sb('POST', 'lk_projects', {{
    user_id: user.id, title,
    ir_type:      projType.includes('ir')      ? (projType.includes('simple') ? 'simple' : 'detail') : null,
    landing_type: projType.includes('landing') ? (projType.includes('simple') ? 'simple' : 'detail') : null,
    status: 'interview'
  }});
  projectId = rows[0].id;
  const typeNames = {{ ir_simple:'간단 IR 자료', ir_detail:'상세 IR 자료', landing_simple:'간단 랜딩페이지', landing_detail:'상세 랜딩페이지', 'ir_detail+landing_detail':'IR + 랜딩 세트' }};
  messages = [
    systemMsg,
    {{ role: 'user', content: `작업 유형: ${{typeNames[projType] || projType}}. 인터뷰를 시작해주세요.` }}
  ];
}} else {{
  const userMsg = b.message;
  const prevMsgs = await sb('GET', `lk_messages?project_id=eq.${{projectId}}&order=created_at.asc&select=role,content`);
  messages = [systemMsg, ...(prevMsgs || []), {{ role: 'user', content: userMsg }}];
  await sb('POST', 'lk_messages', {{ project_id: projectId, role: 'user', content: userMsg }});
}}

return [{{ json: {{ messages, projectId, userId: user.id, action, max_tokens: 1000 }} }}];
"""

    code2 = SB_HELPERS + """
const prev = $input.first().json;
if (prev._error) {
  return [{ json: { success: false, message: prev._error } }];
}

const aiRaw     = prev.choices?.[0]?.message?.content || prev.message || '응답을 생성하지 못했습니다.';
const projectId = prev.projectId;
const userId    = prev.userId;
const action    = prev.action;
const isConfirming = aiRaw.includes('[CONFIRMING]');
const aiMsg     = aiRaw.replace('[CONFIRMING]', '').trim();

// AI 메시지 저장
await sb('POST', 'lk_messages', { project_id: projectId, role: 'assistant', content: aiMsg });

// 처음 시작 시 user 메시지도 여기서 함께 처리됨 (start action은 DB저장 필요없음 - 위 Code1에서 저장함)

// 상태 업데이트
if (isConfirming) {
  await sb('PATCH', `lk_projects?id=eq.${projectId}`, { status: 'confirming' });
}

return [{ json: {
  success: true,
  message: aiMsg,
  project_id: projectId,
  stage: isConfirming ? 'confirming' : 'interview',
}}];
"""

    nodes = [
        make_webhook(wid,  "launchkit-interview",    [240, 300]),
        make_code(c1id,    "PrepareInterview",  code1, [480, 300]),
        make_http_openai(aiid, "CallOpenAI",          [720, 300]),
        make_code(c2id,    "SaveAndRespond",    code2, [960, 300]),
        make_respond(rid,                              [1200, 300]),
    ]
    conns = merge_connections(
        connect("Webhook",          "PrepareInterview"),
        connect("PrepareInterview", "CallOpenAI"),
        connect("CallOpenAI",       "SaveAndRespond"),
        connect("SaveAndRespond",   "Respond"),
    )
    return {"name": "launchkit-interview", "nodes": nodes, "connections": conns, "settings": {"executionOrder": "v1"}}


# ──────────────────────────────────────────────────────────────────────
# 6. launchkit-generate-ir  (IR 문서 & 랜딩페이지 생성)
# ──────────────────────────────────────────────────────────────────────
def wf_generate_ir():
    wid, c1id, aiid, c2id, rid = nid(), nid(), nid(), nid(), nid()

    code1 = SB_HELPERS + """
const b = $input.first().json.body || $input.first().json;
const user = await validateSession(b.session_token);
if (!user) return [{ json: { messages: [], _error: '인증 필요' } }];

const pid = b.project_id;
const projs = await sb('GET', `lk_projects?id=eq.${pid}&user_id=eq.${user.id}&select=*`);
if (!projs || !projs.length) return [{ json: { messages: [], _error: '프로젝트 없음' } }];

const project = projs[0];
const irType  = project.ir_type || 'detail';
const lType   = project.landing_type;

// 토큰 확인
const irCost  = TOKEN_COST['ir_' + irType] || 200;
const lCost   = lType ? (TOKEN_COST['landing_' + lType] || 120) : 0;
const needed  = irCost + lCost;
const remain  = (PLAN_TOKENS[user.plan] || 100) - (user.tokens_used || 0);
if (remain < needed)
  return [{ json: { messages: [], _error: `토큰 부족 (필요: ${needed}, 남음: ${remain})` } }];

const msgs = await sb('GET', `lk_messages?project_id=eq.${pid}&order=created_at.asc&select=role,content`);
const convHistory = (msgs || []).map(m => `[${m.role === 'user' ? '사용자' : 'AI'}]: ${m.content}`).join('\\n');

const irSection = irType === 'simple'
  ? '비전/미션, 해결하는 문제, 솔루션, 비즈니스 모델, 팀'
  : '비전/미션, 문제 정의, 솔루션, 시장 분석, 경쟁 분석, 비즈니스 모델, 수익 구조, 팀, 투자 포인트, 마일스톤';

const systemPrompt = `당신은 전문 IR 사업계획서 작성 AI입니다. 아래 인터뷰 내용을 바탕으로 HTML IR 문서를 작성하세요.

HTML 규칙:
- h2, h3, p, ul, li, table 태그 사용
- <style> 태그 없이 순수 HTML 구조만
- 전문적이고 투자자가 읽기 쉬운 형식
- 섹션: ${irSection}

${lType ? `랜딩페이지도 함께 생성하세요.
랜딩페이지 HTML 규칙:
- 완전한 HTML 문서 (<!DOCTYPE html> 포함)
- 인라인 스타일로 디자인 (밝은 테마, 브랜드 컬러)
- 섹션: 히어로, 문제/솔루션, 주요 기능, CTA
- IR 문서와 랜딩페이지를 JSON으로 구분하여 반환:
  {"ir_html": "...", "landing_html": "..."}`
  : '응답 형식: {"ir_html": "..."}'}`;

await sb('PATCH', `lk_projects?id=eq.${pid}`, { status: 'generating' });

return [{ json: {
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `인터뷰 내용:\\n${convHistory}\\n\\n위 내용으로 IR 문서를 HTML로 작성해주세요.` }
  ],
  max_tokens: 4000,
  projectId: pid, userId: user.id, irCost, lCost, needed
}}];
"""

    code2 = SB_HELPERS + """
const prev = $input.first().json;
if (prev._error) return [{ json: { success: false, message: prev._error } }];

const rawContent = prev.choices?.[0]?.message?.content || '';
const pid = prev.projectId;
const uid = prev.userId;
const needed = prev.needed || 0;

let ir_html = '', landing_html = '';
try {
  const jsonMatch = rawContent.match(/\\{[\\s\\S]*"ir_html"[\\s\\S]*\\}/);
  if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0]);
    ir_html      = parsed.ir_html || '';
    landing_html = parsed.landing_html || '';
  } else {
    ir_html = rawContent;
  }
} catch {
  ir_html = rawContent;
}

// DB 업데이트
const updateData = {
  ir_html, tokens_used: needed,
  status: landing_html ? 'complete' : 'ir_done'
};
if (landing_html) updateData.landing_html = landing_html;

await sb('PATCH', `lk_projects?id=eq.${pid}`, updateData);

// 토큰 차감
const users = await sb('GET', `lk_users?id=eq.${uid}&select=tokens_used`);
const curUsed = users?.[0]?.tokens_used || 0;
await sb('PATCH', `lk_users?id=eq.${uid}`, { tokens_used: curUsed + needed });

// 토큰 로그
await sb('POST', 'lk_token_logs', {
  user_id: uid, project_id: pid,
  action: 'ir_generate', tokens_delta: -needed,
  memo: `IR(${ir_html ? 'ok' : 'fail'}) Landing(${landing_html ? 'ok' : 'none'})`
});

return [{ json: {
  success: true, done: true,
  message: `IR 문서${landing_html ? '와 랜딩페이지가' : '가'} 생성되었습니다! 결과 페이지로 이동합니다.`,
  project_id: pid
}}];
"""

    nodes = [
        make_webhook(wid,  "launchkit-generate-ir",     [240, 300]),
        make_code(c1id,    "PrepareGenerate",      code1, [480, 300]),
        make_http_openai(aiid, "CallOpenAI",              [720, 300]),
        make_code(c2id,    "SaveResult",           code2, [960, 300]),
        make_respond(rid,                                 [1200, 300]),
    ]
    conns = merge_connections(
        connect("Webhook",        "PrepareGenerate"),
        connect("PrepareGenerate","CallOpenAI"),
        connect("CallOpenAI",     "SaveResult"),
        connect("SaveResult",     "Respond"),
    )
    return {"name": "launchkit-generate-ir", "nodes": nodes, "connections": conns, "settings": {"executionOrder": "v1"}}


# ──────────────────────────────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    workflows = [
        ("launchkit-register",       wf_register()),
        ("launchkit-login",          wf_login()),
        ("launchkit-get-projects",   wf_get_projects()),
        ("launchkit-get-project",    wf_get_project()),
        ("launchkit-interview",      wf_interview()),
        ("launchkit-generate-ir",    wf_generate_ir()),
    ]

    print("=" * 55)
    print("  LaunchKit n8n 워크플로우 생성")
    print("=" * 55)
    created_ids = []
    for name, wf in workflows:
        wf_id, ok, err = create_workflow(wf)
        if ok:
            print(f"  ✓  {name}  (ID: {wf_id})")
            created_ids.append(wf_id)
        else:
            print(f"  ✗  {name}  → {err[:80]}")

    print()
    print("활성화 중...")
    for wf_id in created_ids:
        ok = activate_workflow(wf_id)
        print(f"  {'✓' if ok else '✗'}  {wf_id}")

    print()
    print("완료!")
    print("웹훅 URL 예시:")
    print("  https://jknetworks.app.n8n.cloud/webhook/launchkit-register")
    print("  https://jknetworks.app.n8n.cloud/webhook/launchkit-login")
    print("  https://jknetworks.app.n8n.cloud/webhook/launchkit-interview")
    print("  https://jknetworks.app.n8n.cloud/webhook/launchkit-generate-ir")
    print("  https://jknetworks.app.n8n.cloud/webhook/launchkit-get-projects")
    print("  https://jknetworks.app.n8n.cloud/webhook/launchkit-get-project")
