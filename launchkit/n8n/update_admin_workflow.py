# -*- coding: utf-8 -*-
"""
LaunchKit Admin n8n workflow updater (in-place, no toggle needed)
Run: python update_admin_workflow.py
"""
import json, urllib.request, urllib.error, sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

N8N_URL = os.environ.get("N8N_CLOUD_URL", "https://jknetworks.app.n8n.cloud")
N8N_KEY = os.environ.get("N8N_API_KEY", "")
if not N8N_KEY:
    print("ERROR: N8N_API_KEY 환경변수가 필요합니다.")
    sys.exit(1)

WF_ID = "qyMpqu2WnnkKHh8r"  # launchkit-admin workflow ID

SB_URL = "https://mkmxhmoocqnkltjxdfbm.supabase.co"
SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbXhobW9vY3Fua2x0anhkZmJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTkwMTQ4MiwiZXhwIjoyMDg3NDc3NDgyfQ.Ys-8RvkuTzXoQQWBujr3SEGa5UVRiPxpIhfWXawL_A8"
ADMIN_KEY = "lk_admin_00df7952c89c478eb8bbd65393c5a72d"

# JavaScript code using this.helpers.httpRequest() - n8n Cloud Task Runner compatible
CODE_JS = """
const SB_URL = '""" + SB_URL + """';
const SB_KEY = '""" + SB_KEY + """';
const SB_HDR = {
  'apikey': SB_KEY,
  'Authorization': 'Bearer ' + SB_KEY,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};
const PLAN_TOKENS = { free: 100, pro: 500, pro_max: 2500 };
const ADMIN_KEY = '""" + ADMIN_KEY + """';
const self = this;

async function sb(method, path, body) {
  const opts = {
    method,
    url: SB_URL + '/rest/v1/' + path,
    headers: {...SB_HDR},
    json: true,
  };
  if (body) opts.body = body;
  try {
    return await self.helpers.httpRequest(opts);
  } catch(e) {
    return [];
  }
}

const b = $input.first().json.body || $input.first().json;

if (b.admin_key !== ADMIN_KEY) {
  return [{ json: { success: false, message: 'Invalid admin key' } }];
}

const action = b.action;

switch (action) {

  case 'validate': {
    return [{ json: { success: true, message: 'Authenticated' } }];
  }

  case 'dashboard': {
    const users = await sb('GET', 'lk_users?select=id,name,email,plan,tokens_used,tokens_total,is_active,billing_cycle,discount_rate,created_at&order=created_at.desc');
    const projects = await sb('GET', 'lk_projects?select=id,status,tokens_used&order=created_at.desc');
    const total = users.length;
    const active = users.filter(u => u.is_active).length;
    const byPlan = { free: 0, pro: 0, pro_max: 0 };
    let totalTokensUsed = 0;
    users.forEach(u => {
      byPlan[u.plan] = (byPlan[u.plan] || 0) + 1;
      totalTokensUsed += u.tokens_used || 0;
    });
    const recent = users.slice(0, 10);
    const topToken = [...users].sort((a, b) => (b.tokens_used || 0) - (a.tokens_used || 0)).slice(0, 10);
    return [{ json: { success: true, stats: {
      total, active, byPlan, totalTokensUsed,
      totalProjects: projects.length,
      recent, topToken
    } } }];
  }

  case 'list_users': {
    let query = 'lk_users?select=id,name,email,plan,tokens_total,tokens_used,is_active,billing_cycle,discount_rate,subscription_start,subscription_end,created_at&order=created_at.desc';
    if (b.search) query += '&or=(email.ilike.*' + b.search + '*,name.ilike.*' + b.search + '*)';
    if (b.plan_filter) query += '&plan=eq.' + b.plan_filter;
    const users = await sb('GET', query);
    return [{ json: { success: true, users } }];
  }

  case 'create_user': {
    const { name, email, password, plan, billing_cycle, discount_rate } = b;
    if (!name || !email || !password)
      return [{ json: { success: false, message: 'name, email, password 필수' } }];
    const existing = await sb('GET', 'lk_users?email=eq.' + encodeURIComponent(email) + '&select=id');
    if (existing.length) return [{ json: { success: false, message: '이미 존재하는 이메일입니다.' } }];
    const crypto = require('crypto');
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    const password_hash = 'pbkdf2:' + salt + ':' + hash;
    const userPlan = (plan && ['free','pro','pro_max'].includes(plan)) ? plan : 'free';
    const newUser = {
      name, email, password_hash,
      plan: userPlan, tokens_total: PLAN_TOKENS[userPlan],
      tokens_used: 0, is_active: true,
      billing_cycle: billing_cycle || 'monthly',
      discount_rate: parseInt(discount_rate) || 0,
    };
    const created = await sb('POST', 'lk_users', newUser);
    return [{ json: { success: true, user: created[0], message: '유저가 생성되었습니다.' } }];
  }

  case 'edit_user': {
    const { user_id, name, email, plan, billing_cycle, discount_rate, subscription_end, password } = b;
    const update = {};
    if (name) update.name = name;
    if (email) update.email = email;
    if (plan && ['free', 'pro', 'pro_max'].includes(plan)) {
      update.plan = plan;
      update.tokens_total = PLAN_TOKENS[plan];
    }
    if (billing_cycle) update.billing_cycle = billing_cycle;
    if (discount_rate !== undefined && discount_rate !== null && discount_rate !== '')
      update.discount_rate = Math.max(0, Math.min(100, parseInt(discount_rate) || 0));
    if (subscription_end) update.subscription_end = subscription_end;
    if (password) {
      const crypto = require('crypto');
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
      update.password_hash = 'pbkdf2:' + salt + ':' + hash;
    }
    await sb('PATCH', 'lk_users?id=eq.' + user_id, update);
    return [{ json: { success: true, message: '유저 정보가 수정되었습니다.' } }];
  }

  case 'toggle_user': {
    const users = await sb('GET', 'lk_users?id=eq.' + b.user_id + '&select=is_active');
    if (!users.length) return [{ json: { success: false, message: 'User not found' } }];
    const newActive = !users[0].is_active;
    await sb('PATCH', 'lk_users?id=eq.' + b.user_id, { is_active: newActive });
    return [{ json: { success: true, is_active: newActive, message: newActive ? '활성화됨' : '비활성화됨' } }];
  }

  case 'delete_user': {
    await sb('DELETE', 'lk_token_logs?user_id=eq.' + b.user_id);
    await sb('DELETE', 'lk_users?id=eq.' + b.user_id);
    return [{ json: { success: true, message: '유저가 삭제되었습니다.' } }];
  }

  case 'change_plan': {
    const { user_id, new_plan, billing_cycle } = b;
    if (!['free', 'pro', 'pro_max'].includes(new_plan))
      return [{ json: { success: false, message: 'Invalid plan' } }];
    const update = { plan: new_plan, tokens_total: PLAN_TOKENS[new_plan] };
    if (billing_cycle) update.billing_cycle = billing_cycle;
    await sb('PATCH', 'lk_users?id=eq.' + user_id, update);
    await sb('POST', 'lk_token_logs', {
      user_id, action: 'plan_change', tokens_delta: 0,
      memo: '플랜 변경: ' + new_plan + (billing_cycle ? ' (' + billing_cycle + ')' : '')
    });
    return [{ json: { success: true, message: '플랜이 ' + new_plan + '으로 변경되었습니다.' } }];
  }

  case 'adjust_tokens': {
    const { user_id, delta, memo } = b;
    const users = await sb('GET', 'lk_users?id=eq.' + user_id + '&select=tokens_used,tokens_total');
    if (!users.length) return [{ json: { success: false, message: 'User not found' } }];
    const newUsed = Math.max(0, (users[0].tokens_used || 0) - (delta || 0));
    await sb('PATCH', 'lk_users?id=eq.' + user_id, { tokens_used: newUsed });
    await sb('POST', 'lk_token_logs', {
      user_id, action: 'admin_adjust', tokens_delta: delta,
      memo: memo || '관리자 조정'
    });
    return [{ json: { success: true, new_tokens_used: newUsed, message: '토큰 조정 완료' } }];
  }

  case 'set_discount': {
    const { user_id, discount_rate } = b;
    const rate = Math.max(0, Math.min(100, parseInt(discount_rate) || 0));
    await sb('PATCH', 'lk_users?id=eq.' + user_id, { discount_rate: rate });
    return [{ json: { success: true, message: '할인율 ' + rate + '% 적용됨' } }];
  }

  case 'set_subscription': {
    const { user_id, billing_cycle, subscription_end } = b;
    const update = {};
    if (billing_cycle) update.billing_cycle = billing_cycle;
    if (subscription_end) update.subscription_end = subscription_end;
    update.subscription_start = new Date().toISOString();
    await sb('PATCH', 'lk_users?id=eq.' + user_id, update);
    return [{ json: { success: true, message: '구독 설정이 변경되었습니다.' } }];
  }

  case 'token_logs': {
    const logs = await sb('GET', 'lk_token_logs?user_id=eq.' + b.user_id + '&order=created_at.desc&limit=50&select=*');
    return [{ json: { success: true, logs: logs || [] } }];
  }

  case 'list_projects': {
    let query = 'lk_projects?select=id,user_id,title,company_name,status,ir_type,landing_type,tokens_used,created_at&order=created_at.desc';
    if (b.user_id) query += '&user_id=eq.' + b.user_id;
    const projects = await sb('GET', query);
    const allUsers = await sb('GET', 'lk_users?select=id,email,name');
    const usersMap = {};
    allUsers.forEach(u => { usersMap[u.id] = u; });
    projects.forEach(p => {
      p.user_email = usersMap[p.user_id]?.email || '?';
      p.user_name = usersMap[p.user_id]?.name || '?';
    });
    return [{ json: { success: true, projects } }];
  }

  case 'delete_project': {
    await sb('DELETE', 'lk_projects?id=eq.' + b.project_id);
    return [{ json: { success: true, message: '프로젝트가 삭제되었습니다.' } }];
  }

  default:
    return [{ json: { success: false, message: 'Unknown action: ' + action } }];
}
"""


def update_workflow():
    """GET current workflow, update Code node, PUT back (preserves webhook)"""
    # 1. GET current workflow
    req = urllib.request.Request(
        f"{N8N_URL}/api/v1/workflows/{WF_ID}",
        headers={"X-N8N-API-KEY": N8N_KEY}
    )
    with urllib.request.urlopen(req) as resp:
        wf = json.loads(resp.read())

    # 2. Update AdminLogic node's jsCode
    for node in wf["nodes"]:
        if node["name"] == "AdminLogic":
            node["parameters"]["jsCode"] = CODE_JS

    # 3. PUT with only allowed fields (preserves webhook registration)
    put_body = {
        "name": wf["name"],
        "nodes": wf["nodes"],
        "connections": wf["connections"],
        "settings": wf["settings"],
    }

    body = json.dumps(put_body).encode()
    req2 = urllib.request.Request(
        f"{N8N_URL}/api/v1/workflows/{WF_ID}",
        data=body,
        headers={"Content-Type": "application/json", "X-N8N-API-KEY": N8N_KEY},
        method="PUT"
    )
    try:
        with urllib.request.urlopen(req2) as resp:
            result = json.loads(resp.read())
            return result.get("id"), result.get("active"), ""
    except urllib.error.HTTPError as e:
        return None, False, e.read().decode()


if __name__ == "__main__":
    print("=" * 50)
    print("  LaunchKit Admin 워크플로우 업데이트 (in-place)")
    print("=" * 50)

    wf_id, active, err = update_workflow()
    if wf_id:
        print(f"  [OK] Updated: {wf_id} (active: {active})")
        print(f"  토글 필요 없음!")
    else:
        print(f"  [FAIL] {err[:300]}")

    print()
    print(f"  Webhook: {N8N_URL}/webhook/launchkit-admin")
