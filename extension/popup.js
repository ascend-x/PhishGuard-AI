
function getActiveTabId(){
  return new Promise(res=>{
    chrome.tabs.query({active:true, currentWindow:true}, tabs=>{
      if(!tabs || !tabs.length) return res(null);
      res(tabs[0].id);
    });
  });
}
async function loadReport(){
  const tabId=await getActiveTabId();
  const resp=await chrome.runtime.sendMessage({type:"PG_GET", tabId});
  const data=resp && resp.data ? resp.data : null;
  const badge=document.getElementById("riskBadge");
  const u=document.getElementById("u");
  const h=document.getElementById("h");
  const signals=document.getElementById("signals");
  signals.innerHTML="";
  if(!data){
    badge.textContent="--%";
    u.textContent="No data yet. Interact with the page.";
    h.textContent="";
    return;
  }
  badge.textContent = data.score.risk + "%";
  u.textContent = data.url;
  h.textContent = data.host;
  for(const [name, contrib] of data.score.contrib){
    const row=document.createElement("div");
    row.className="sig";
    const n=document.createElement("div"); n.className="name"; n.textContent=name;
    const v=document.createElement("div"); v.className="val"; v.textContent = (contrib>0?"+":"") + contrib.toFixed(2);
    row.appendChild(n); row.appendChild(v);
    signals.appendChild(row);
  }
}
async function reanalyze(){
  const tabId=await getActiveTabId();
  if(!tabId) return;
  try{
    await chrome.scripting.executeScript({target:{tabId}, files:["model.js","content.js"]});
  }catch(e){}
  setTimeout(loadReport, 300);
}
async function copyReport(){
  const tabId=await getActiveTabId();
  const resp=await chrome.runtime.sendMessage({type:"PG_GET", tabId});
  const data=resp && resp.data ? resp.data : null;
  if(!data) return;
  const out={url:data.url,host:data.host,risk:data.score.risk,topSignals:Object.fromEntries(data.score.contrib)};
  await navigator.clipboard.writeText(JSON.stringify(out,null,2));
}
document.getElementById("reanalyze").addEventListener("click", reanalyze);
document.getElementById("copyReport").addEventListener("click", copyReport);
loadReport();

