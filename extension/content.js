
let PG_LAST_REPORT=null;
const PG_STATE={features:{}};
function safeText(el){try{return (el.innerText||"")+ " " + (el.placeholder||"");}catch(e){return "";}}
function collectStatic(){
  const url=location.href; const u=new URL(url);
  const host=u.hostname;
  const scripts=[...document.scripts];
  const externalScripts=scripts.filter(s=>s.src && new URL(s.src, location.href).origin!==location.origin).length;
  const dataUriScripts=scripts.filter(s=>s.src && s.src.startsWith("data:")).length;
  let codeConcat=""; for(const s of scripts){ if(!s.src && s.textContent){ codeConcat+=s.textContent.slice(0,2000); } }
  const forms=[...document.forms];
  let cross=0,insecure=0,hasPwd=0;
  for(const f of forms){
    const act=f.getAttribute("action")||"";
    if([...(f.querySelectorAll('input[type="password"]'))].length>0) hasPwd=1;
    if(act){
      const dest=new URL(act, location.href);
      if(dest.origin!==location.origin) cross=1;
      if(dest.protocol==="http:") insecure=1;
    }
  }
  const ifr=[...document.querySelectorAll("iframe")];
  const hiddenIfr=ifr.some(x=>{
    const r=x.getBoundingClientRect();
    const style=getComputedStyle(x);
    return r.width<=5 || r.height<=5 || style.opacity==="0" || style.visibility==="hidden" || style.display==="none";
  })?1:0;
  let textSample=document.body ? document.body.innerText.slice(0,4000) : "";
  const features={
    url_length: Math.min(1, url.length/200),
    has_ip: isIp(host)?1:0,
    has_at: url.includes("@")?1:0,
    has_punycode: host.startsWith("xn--")?1:0,
    num_dots: Math.min(1, dotCount(host)/5),
    domain_entropy: entropy(host.slice(0,64)),
    num_external_scripts: Math.min(1, externalScripts/5),
    uses_eval_like: hasEvalLike(codeConcat),
    obfuscated_tokens: hasObfuscatedToken(codeConcat),
    form_posts_cross_origin: cross,
    form_posts_insecure: insecure,
    has_password_fields: hasPwd,
    hidden_iframes: hiddenIfr,
    right_click_blocked: 0,
    keyboard_listeners: 0,
    canvas_fp: 0,
    suspicious_keywords: keywordScore(textSample),
    timer_countdowns: 0,
    suspicious_tlds: tldSuspicious(host),
    data_uri_scripts: Math.min(1, dataUriScripts),
    xhr_cross: 0,
    fetch_cross: 0,
    mixed_content: 0
  };
  return features;
}
function hookBehaviors(){
  const origAddEvent=EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener=function(type, listener, opts){
    if(type==="contextmenu") PG_STATE.features.right_click_blocked=1;
    if(["keydown","keypress"].includes(type)) PG_STATE.features.keyboard_listeners=1;
    return origAddEvent.call(this,type,listener,opts);
  };
  const origSetTimeout=window.setTimeout; window.setTimeout=function(fn, t){ if(typeof t==="number"&&t<20000) PG_STATE.features.timer_countdowns=1; return origSetTimeout(fn,t); };
  const origFetch=window.fetch; window.fetch=function(input, init){
    try{
      const dest=new URL(typeof input==="string"?input:input.url, location.href);
      if(dest.origin!==location.origin) PG_STATE.features.fetch_cross=1;
      if(dest.protocol==="http:") PG_STATE.features.mixed_content=1;
      if(isIp(dest.hostname)) PG_STATE.features.fetch_cross=1;
    }catch(e){}
    return origFetch.apply(this, arguments);
  };
  const origOpen=XMLHttpRequest.prototype.open; XMLHttpRequest.prototype.open=function(method, url){
    try{
      const dest=new URL(url, location.href);
      if(dest.origin!==location.origin) PG_STATE.features.xhr_cross=1;
      if(dest.protocol==="http:") PG_STATE.features.mixed_content=1;
    }catch(e){}
    return origOpen.apply(this, arguments);
  };
  const origGetContext=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type, opts){
    if(type && String(type).toLowerCase().includes("2d")) PG_STATE.features.canvas_fp=1;
    return origGetContext.call(this,type,opts);
  };
}
function assess(){
  const f=Object.assign({}, collectStatic(), PG_STATE.features);
  const res=score(f);
  PG_LAST_REPORT={url:location.href,host:location.hostname,features:f,score:res};
  chrome.runtime.sendMessage({type:"PG_REPORT", payload: PG_LAST_REPORT}, ()=>{});
  renderBanner(res);
}
function renderBanner(res){
  const id="pg_banner_root";
  if(document.getElementById(id)) {
    const n=document.getElementById(id).shadowRoot.querySelector("#pg-risk");
    if(n) n.textContent=res.risk+"%";
    return;
  }
  const host=document.createElement("div"); host.id=id; document.documentElement.appendChild(host);
  const shadow=host.attachShadow({mode:"open"});
  const wrap=document.createElement("div");
  wrap.id="pg-wrap";
  wrap.innerHTML=`
    <div class="pg-card">
      <div class="pg-row">
        <div class="pg-title">PhishGuard AI</div>
        <div class="pg-score"><span id="pg-risk">${res.risk}%</span> risk</div>
      </div>
      <div class="pg-row">
        <div class="pg-explain">This page's behavior was analyzed. Open extension popup for details.</div>
        <button id="pg-dismiss">Dismiss</button>
      </div>
    </div>
  `;
  shadow.appendChild(wrap);
  const style=document.createElement("style");
  style.textContent=`
  .pg-card{position:fixed;z-index:2147483647;top:12px;right:12px;background:#111;color:#fff;border:1px solid #333;border-radius:12px;padding:10px 12px;font:12px system-ui, -apple-system, Segoe UI, Roboto, Arial;box-shadow:0 6px 18px rgba(0,0,0,.3);}
  .pg-row{display:flex;align-items:center;gap:10px;}
  .pg-title{font-weight:700;letter-spacing:.2px}
  .pg-score{margin-left:auto;font-weight:700}
  #pg-dismiss{background:#222;border:1px solid #444;color:#fff;border-radius:10px;padding:6px 10px;cursor:pointer}
  `;
  shadow.appendChild(style);
  shadow.getElementById("pg-dismiss").onclick=()=>host.remove();
}
function observe(){
  const mo=new MutationObserver(()=>{ assess(); });
  mo.observe(document.documentElement,{subtree:true,childList:true,attributes:true,characterData:false});
}
hookBehaviors();
document.addEventListener("DOMContentLoaded", assess);
window.addEventListener("load", assess);
observe();
