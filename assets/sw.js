const CACHE='bdmt-rc63-isolated-c85c2ca24a67e804';
const FILES=['./','./index.html','./style.css','./app.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./build.json','./licenses.txt','./fonts/NotoSansJP-Regular.ttf','./fonts/OFL.txt','./fonts/SOURCE.txt','./score-sheets/singles.pdf','./score-sheets/doubles.pdf'];
const INTEGRITY={"./index.html":"0939ac0696b0048cd4e116c888c9bb43d9d635749f0f4d746964e43ed8d232bf","./app.js":"ba76ae1dd64a4f659d7dfecd5d36270d7c86f89eb5ff5d125af6d3068f12e6fb","./style.css":"23e0b93862298976db7b4d3d3a41df390653d7d98c66c9e8ccafd1f55f5a259a","./manifest.webmanifest":"0c88c860bd98c8b359b5bcc8ffbfdf04eeaff1fafcc0f712a20cc2a0d7cd5258","./icon.svg":"ae11699cf2ae39dc23ef4ce0a67b2aacdf8a211ec5bf9999127ec82bfbce9c9a","./icon-192.png":"3923c9ea9717121318f3903daf91ae6546ed3e45d801f763084c315f343455c9","./icon-512.png":"138002aee459a9a67e7b9563e96c91bf38128f668c6962eeeeb62d8c2ae2e04b","./build.json":"f6beeb4d1868b71682dd346ab19c6c194e4dfa64fb6be340181f48e4422c2060","./licenses.txt":"0d439aa7c1f6a73552a6d64f88f284a80e58aac08d30f81f3e8a2f5f941c4cf2","./fonts/NotoSansJP-Regular.ttf":"45cd530d8064e752de41de61ab4195220b52036a7daf9bd3f0d0c8af888a3bd9","./fonts/OFL.txt":"1c05c68c34f9708415aada51f17e1b0092d2cea709bf4a94cd38114f9e73d7d9","./fonts/SOURCE.txt":"cdd442bcf89747bc07dbbea7dacfec3efb9e1571cbedd8e3b70306080441812e","./score-sheets/singles.pdf":"730a833aba9e83d3a8ae88755a0fe37c5057fe2eee7420ee1875f9a5193ef58b","./score-sheets/doubles.pdf":"728deeb4f87363cb695cb4bed7fe39694f8fbfd4378491d4727ed1175ad1d8b1","./":"0939ac0696b0048cd4e116c888c9bb43d9d635749f0f4d746964e43ed8d232bf"};
async function verified(response,expected){if(!response||!response.ok)throw Error('配布資産の取得に失敗');const bytes=await response.clone().arrayBuffer();const actual=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');if(actual!==expected)throw Error('配布資産のSHA-256不一致');return response;}
self.addEventListener('install',e=>e.waitUntil((async()=>{const c=await caches.open(CACHE);if(!Object.keys(INTEGRITY).length){await c.addAll(FILES);return;}const fetched=await Promise.all(FILES.map(async f=>[f,await verified(await fetch(f,{cache:'reload'}),INTEGRITY[f])]));for(const [f,response]of fetched)await c.put(f,response);})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{const keys=await caches.keys();const old=keys.filter(k=>k.startsWith('bdmt-rc63-isolated-'));await Promise.all(old.filter(k=>k!==CACHE).slice(0,-1).map(k=>caches.delete(k)));await self.clients.claim();})()));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.open(CACHE).then(async c=>{if(!Object.keys(INTEGRITY).length)return await c.match(e.request)||fetch(e.request);const key=FILES.find(f=>new URL(f,self.registration.scope).href===(new URL(e.request.url).origin+new URL(e.request.url).pathname));if(!key)return fetch(e.request);try{const cached=await c.match(key);if(cached){try{return await verified(cached,INTEGRITY[key]);}catch{}}const response=await verified(await fetch(e.request,{cache:'reload'}),INTEGRITY[key]);await c.put(key,response.clone());return response;}catch{return new Response('オフライン資産が不足または破損しています。大会データを消去せず、通信を戻して同じURLを再読込してください。',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});}}));});
// Waiting worker is activated only by a user requested reload, never during a save.
self.addEventListener('message',e=>{
  if(e.data==='ACTIVATE'){self.skipWaiting();return;}
  if(e.data!=='OFFLINE_STATUS'||!e.ports[0])return;
  e.waitUntil((async()=>{
    let complete=false;
    try{
      const cache=await caches.open(CACHE);
      await Promise.all(FILES.map(async key=>verified(await cache.match(key),INTEGRITY[key])));
      complete=true;
    }catch{}
    e.ports[0].postMessage({complete});
  })());
});
