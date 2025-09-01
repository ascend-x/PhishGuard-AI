
function sigmoid(x){return 1/(1+Math.exp(-x));}
const PG_FEATURES = [
  "url_length","has_ip","has_at","has_punycode","num_dots","domain_entropy",
  "num_external_scripts","uses_eval_like","obfuscated_tokens","form_posts_cross_origin",
  "form_posts_insecure","has_password_fields","hidden_iframes","right_click_blocked",
  "keyboard_listeners","canvas_fp","suspicious_keywords","timer_countdowns",
  "suspicious_tlds","data_uri_scripts","xhr_cross","fetch_cross","mixed_content"
];
const PG_WEIGHTS = {
  url_length:0.6,has_ip:1.4,has_at:0.9,has_punycode:1.2,num_dots:0.5,domain_entropy:0.8,
  num_external_scripts:0.6,uses_eval_like:1.1,obfuscated_tokens:1.1,form_posts_cross_origin:1.2,
  form_posts_insecure:1.3,has_password_fields:0.5,hidden_iframes:0.7,right_click_blocked:0.6,
  keyboard_listeners:0.5,canvas_fp:0.6,suspicious_keywords:1.0,timer_countdowns:0.5,
  suspicious_tlds:0.8,data_uri_scripts:0.9,xhr_cross:0.6,fetch_cross:0.6,mixed_content:0.7
};
const PG_BIAS = -2.2;
function entropy(s){
  const m=new Map(); for(const c of s){m.set(c,(m.get(c)||0)+1);}
  let e=0; for(const v of m.values()){const p=v/s.length; e+=-p*Math.log2(p);} return e/5.0;
}
function normalizeUrl(u){try{return new URL(u);}catch(e){return null;}}
function domainFromUrl(url){try{const u=new URL(url); return u.hostname || ""; }catch(e){return "";}} 
function isIp(host){return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host) || /^[0-9a-fA-F:]+$/.test(host);}
function tldSuspicious(host){
  const bad=[".zip",".mov",".lol",".xyz",".top",".click",".country",".gq",".tk",".cf",".ml"];
  return bad.some(t=>host.endsWith(t))?1:0;
}
function dotCount(host){return (host.match(/\./g)||[]).length}
function hasObfuscatedToken(code){
  const pats=[/atob\(/i,/btoa\(/i,/fromCharCode\(/i,/String\.fromCharCode/i,/unescape\(/i,/%[0-9A-F]{2}/i,/_0x[a-f0-9]{4,}/i];
  return pats.some(p=>p.test(code))?1:0;
}
function hasEvalLike(code){ return /eval\(|Function\(|setTimeout\s*\(\s*['"]/.test(code)?1:0; }
function keywordScore(text){
  const words=[
    "verify your account","urgent","limited time","confirm password","security alert",
    "suspended","update billing","payment failed","bank","wallet","exchange","airdrop",
    "metamask","seed phrase","private key","otp","one time password","amazon","flipkart","netbanking"
  ];
  const t=text.toLowerCase(); let s=0; for(const w of words){ if(t.includes(w)) s+=1; } return Math.min(2, s/2);
}
function score(features){
  let z=PG_BIAS; const contrib={};
  for(const k of PG_FEATURES){
    const v=features[k]||0; const w=PG_WEIGHTS[k]; 
    const c=v*w; z+=c; if(v!==0) contrib[k]=c;
  }
  const p=sigmoid(z);
  const risk=Math.round(p*100);
  const sorted=Object.entries(contrib).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,7);
  return {risk,prob:p,contrib:sorted};
}
