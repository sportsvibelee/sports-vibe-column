(function () {
  const root = document.getElementById('comments-widget');
  if (!root) return;

  if (!document.getElementById('sv-comments-style')) {
    const style = document.createElement('style');
    style.id = 'sv-comments-style';
    style.textContent = `
      .sv-comments{font-family:"Pretendard",sans-serif;color:#17263a}
      .sv-comment-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 0 16px;border-bottom:1px solid #e9edf2;margin-bottom:20px}
      .sv-comment-head strong{font-size:17px;letter-spacing:-.02em}.sv-comment-head span{font-size:13px;color:#7a8798}
      .sv-comment-form{background:#f7f9fb;border:1px solid #e4e9ef;border-radius:0;padding:20px;margin-bottom:28px}
      .sv-comment-form label{display:block}.sv-comment-form label>span{display:block;font-size:13px;font-weight:700;color:#435267;margin-bottom:8px}
      .sv-comment-row{display:grid;grid-template-columns:minmax(0,220px);gap:12px;margin-bottom:14px}
      .sv-comment-form input,.sv-comment-form textarea{width:100%;box-sizing:border-box;border:1px solid #d6dde6;background:#fff;color:#17263a;border-radius:0;padding:12px 14px;font:inherit;font-size:14px;line-height:1.6;outline:none;transition:.2s border-color,.2s box-shadow}
      .sv-comment-form textarea{resize:vertical;min-height:125px}.sv-comment-form input:focus,.sv-comment-form textarea:focus{border-color:#b31e35;box-shadow:0 0 0 3px rgba(179,30,53,.08)}
      .sv-comment-hp{position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;opacity:0!important}
      .sv-comment-actions{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:14px}.sv-comment-actions span{font-size:13px;color:#657386;line-height:1.5}
      .sv-comment-actions button{border:0;border-radius:0;background:#a71930;color:#fff;font-weight:800;font-size:14px;padding:11px 18px;cursor:pointer;transition:.18s transform,.18s opacity,.18s background}.sv-comment-actions button:hover{background:#8f1428;transform:translateY(-1px)}.sv-comment-actions button:disabled{opacity:.55;cursor:not-allowed;transform:none}
      .sv-comment-list{display:grid;gap:12px}.sv-comment-item{border:1px solid #e5eaf0;border-radius:0;padding:18px 20px;background:#fff}.sv-comment-item-head{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:9px}.sv-comment-item-head strong{font-size:14px;color:#17263a}.sv-comment-item-head time{font-size:12px;color:#97a2af}.sv-comment-item p{white-space:pre-wrap;overflow-wrap:anywhere;margin:0;font-size:14px;color:#46566a;line-height:1.75}
      .sv-comment-empty,.sv-comment-loading,.sv-comment-error,.sv-comment-notice{border-radius:0;padding:18px;text-align:center;font-size:13px;line-height:1.7}.sv-comment-empty,.sv-comment-loading{background:#f8fafb;color:#8390a0}.sv-comment-error,.sv-comment-notice{background:#fff2f3;color:#9b2838}
      .sv-comment-privacy{margin:10px 0 0;font-size:12px;color:#7a8798;line-height:1.65}
      @media(max-width:700px){.sv-comment-head{align-items:flex-start;flex-direction:column;gap:5px}.sv-comment-row{grid-template-columns:1fr}.sv-comment-form{padding:16px}.sv-comment-actions{align-items:flex-start;flex-direction:column}.sv-comment-actions button{width:100%}.sv-comment-item-head{align-items:flex-start;flex-direction:column;gap:4px}}
    `;
    document.head.appendChild(style);
  }

  const cfg = (((window.SPORTS_VIBE_CONFIG || {}).comments || {}).supabase || {});
  const baseUrl = (cfg.url || '').replace(/\/$/, '');
  const apiKey = cfg.publishableKey || '';
  const table = cfg.table || 'comments';
  const pagePath = location.pathname || '/';
  const pageTitle = (document.title || '').slice(0, 200);
  const startedAt = Date.now();

  if (!baseUrl || !apiKey) {
    root.innerHTML = '<div class="sv-comment-notice">댓글 연결 정보가 비어 있습니다.</div>';
    return;
  }

  root.innerHTML = `
    <div class="sv-comments">
      <div class="sv-comment-head">
        <strong>댓글 <span id="sv-comment-count">0</span>개</strong>
        <span>로그인 없이 바로 남길 수 있습니다.</span>
      </div>
      <form id="sv-comment-form" class="sv-comment-form" autocomplete="off">
        <div class="sv-comment-row">
          <label>
            <span>이름</span>
            <input id="sv-comment-name" name="name" maxlength="30" placeholder="이름 또는 닉네임" required>
          </label>
        </div>
        <label class="sv-comment-body-label">
          <span>댓글</span>
          <textarea id="sv-comment-content" name="content" maxlength="1000" rows="5" placeholder="다른 해석, 아쉬운 점, 다음 분석 아이디어를 자유롭게 남겨주세요." required></textarea>
        </label>
        <p class="sv-comment-privacy">※ 입력한 이름·닉네임과 댓글은 공개됩니다. 이메일, 전화번호 등 개인정보는 작성하지 마세요.</p>
        <input class="sv-comment-hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
        <div class="sv-comment-actions">
          <span id="sv-comment-status" role="status" aria-live="polite"></span>
          <button id="sv-comment-submit" type="submit">댓글 남기기</button>
        </div>
      </form>
      <div id="sv-comment-list" class="sv-comment-list">
        <div class="sv-comment-loading">댓글을 불러오는 중입니다.</div>
      </div>
    </div>`;

  const form = document.getElementById('sv-comment-form');
  const nameInput = document.getElementById('sv-comment-name');
  const contentInput = document.getElementById('sv-comment-content');
  const statusEl = document.getElementById('sv-comment-status');
  const submitBtn = document.getElementById('sv-comment-submit');
  const listEl = document.getElementById('sv-comment-list');
  const countEl = document.getElementById('sv-comment-count');

  const savedName = localStorage.getItem('sports-vibe-comment-name');
  if (savedName) nameInput.value = savedName.slice(0, 30);

  function apiHeaders(extra) {
    return Object.assign({
      'apikey': apiKey,
      'Content-Type': 'application/json'
    }, extra || {});
  }

  function formatDate(value) {
    try {
      return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }).format(new Date(value));
    } catch (_) {
      return '';
    }
  }

  function makeComment(item) {
    const article = document.createElement('article');
    article.className = 'sv-comment-item';

    const top = document.createElement('div');
    top.className = 'sv-comment-item-head';

    const name = document.createElement('strong');
    name.textContent = item.name || '익명';

    const time = document.createElement('time');
    time.dateTime = item.created_at || '';
    time.textContent = formatDate(item.created_at);

    const body = document.createElement('p');
    body.textContent = item.content || '';

    top.append(name, time);
    article.append(top, body);
    return article;
  }

  async function loadComments(silent) {
    try {
      const url = new URL(`${baseUrl}/rest/v1/${encodeURIComponent(table)}`);
      url.searchParams.set('select', 'id,name,content,created_at');
      url.searchParams.set('page_path', `eq.${pagePath}`);
      url.searchParams.set('is_visible', 'eq.true');
      url.searchParams.set('order', 'created_at.desc');
      url.searchParams.set('limit', '100');

      const res = await fetch(url.toString(), { headers: apiHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();

      countEl.textContent = rows.length;
      listEl.innerHTML = '';
      if (!rows.length) {
        const empty = document.createElement('div');
        empty.className = 'sv-comment-empty';
        empty.textContent = '아직 댓글이 없습니다. 첫 의견을 남겨주세요.';
        listEl.appendChild(empty);
        return;
      }
      rows.forEach(row => listEl.appendChild(makeComment(row)));
    } catch (err) {
      if (!silent) {
        listEl.innerHTML = '<div class="sv-comment-error">댓글 저장소 연결이 아직 완료되지 않았습니다. Supabase SQL Editor에서 SUPABASE_댓글_초기설정.sql을 한 번 실행해주세요.</div>';
      }
    }
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    statusEl.textContent = '';

    const name = nameInput.value.trim();
    const content = contentInput.value.trim();
    const honeypot = form.elements.website.value;

    if (honeypot) return;
    if (Date.now() - startedAt < 1200) {
      statusEl.textContent = '잠시 후 다시 시도해주세요.';
      return;
    }
    if (!name || name.length > 30) {
      statusEl.textContent = '이름은 1~30자로 입력해주세요.';
      nameInput.focus();
      return;
    }
    if (content.length < 2 || content.length > 1000) {
      statusEl.textContent = '댓글은 2~1000자로 입력해주세요.';
      contentInput.focus();
      return;
    }

    const lastAt = Number(localStorage.getItem('sports-vibe-comment-last-at') || 0);
    if (Date.now() - lastAt < 8000) {
      statusEl.textContent = '댓글은 8초 간격으로 작성할 수 있습니다.';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '등록 중…';

    try {
      const res = await fetch(`${baseUrl}/rest/v1/${encodeURIComponent(table)}`, {
        method: 'POST',
        headers: apiHeaders({ 'Prefer': 'return=minimal' }),
        body: JSON.stringify({
          page_path: pagePath,
          page_title: pageTitle,
          name: name,
          content: content
        })
      });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`${res.status} ${detail}`);
      }

      localStorage.setItem('sports-vibe-comment-name', name);
      localStorage.setItem('sports-vibe-comment-last-at', String(Date.now()));
      contentInput.value = '';
      statusEl.textContent = '댓글이 바로 공개되었습니다.';
      await loadComments(false);
    } catch (err) {
      statusEl.textContent = '등록하지 못했습니다. 잠시 후 다시 시도해주세요.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '댓글 남기기';
    }
  });

  loadComments(false);
  setInterval(function () {
    if (!document.hidden) loadComments(true);
  }, 20000);
})();
