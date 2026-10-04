(function(){
  'use strict';
  const year=document.getElementById('year'); if(year) year.textContent=new Date().getFullYear();

  const hasShare=document.querySelector('[data-share-kakao],[data-share-instagram],[data-share-copy],[data-share-native]');
  if(!hasShare) return;

  const cfg=(window.SPORTS_VIBE_CONFIG&&window.SPORTS_VIBE_CONFIG.share)||{};
  const title=()=>document.querySelector('meta[property="og:title"]')?.content||document.querySelector('h1')?.innerText?.trim()||document.title;
  const desc=()=>document.querySelector('meta[property="og:description"]')?.content||document.querySelector('meta[name="description"]')?.content||'';
  const image=()=>document.querySelector('meta[property="og:image"]')?.content||'';
  const url=()=>location.href.split('#')[0];
  const isMobile=()=>/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent||'');

  function toast(msg){
    let el=document.querySelector('.share-toast');
    if(!el){el=document.createElement('div');el.className='share-toast';document.body.appendChild(el);}
    el.textContent=msg;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),2400);
  }
  async function copyLink(msg='링크를 복사했습니다.'){
    try{await navigator.clipboard.writeText(url());toast(msg);return true;}catch(e){}
    const ta=document.createElement('textarea');ta.value=url();ta.setAttribute('readonly','');ta.style.cssText='position:fixed;left:-9999px;top:0';document.body.appendChild(ta);ta.select();
    try{document.execCommand('copy');toast(msg);return true;}catch(e){toast('주소창의 링크를 복사해주세요.');return false;}finally{ta.remove();}
  }
  async function nativeShare(){
    if(!navigator.share){toast('이 기기에서는 공유 메뉴를 지원하지 않습니다. 링크를 복사해주세요.');return false;}
    try{await navigator.share({title:title(),text:desc(),url:url()});return true;}catch(e){if(e&&e.name!=='AbortError') toast('공유 메뉴를 열지 못했습니다.');return false;}
  }
  function loadKakao(){return new Promise((resolve,reject)=>{if(window.Kakao)return resolve(window.Kakao);const s=document.createElement('script');s.src='https://t1.kakaocdn.net/kakao_js_sdk/2.8.1/kakao.min.js';s.crossOrigin='anonymous';s.onload=()=>resolve(window.Kakao);s.onerror=reject;document.head.appendChild(s);});}
  async function kakao(){
    const key=(cfg.kakaoJavaScriptKey||'').trim();
    if(key){try{const Kakao=await loadKakao();if(!Kakao.isInitialized())Kakao.init(key);Kakao.Share.sendDefault({objectType:'feed',content:{title:title(),description:desc(),imageUrl:image(),link:{mobileWebUrl:url(),webUrl:url()}},buttons:[{title:'칼럼 읽기',link:{mobileWebUrl:url(),webUrl:url()}}]});return;}catch(e){console.warn(e);}}
    if(isMobile()&&navigator.share){const ok=await nativeShare();if(ok)return;}
    await copyLink('카카오톡에 보낼 링크를 복사했습니다.');
  }
  async function instagram(){
    if(isMobile()&&navigator.share){const ok=await nativeShare();if(ok)return;}
    await copyLink('인스타그램에 보낼 링크를 복사했습니다.');
    if(!isMobile()) window.open('https://www.instagram.com/direct/inbox/','_blank','noopener,noreferrer');
  }

  document.querySelectorAll('[data-share-kakao]').forEach(b=>b.addEventListener('click',kakao));
  document.querySelectorAll('[data-share-instagram]').forEach(b=>b.addEventListener('click',instagram));
  document.querySelectorAll('[data-share-copy]').forEach(b=>b.addEventListener('click',()=>copyLink()));
  document.querySelectorAll('[data-share-native]').forEach(b=>b.addEventListener('click',nativeShare));
})();
