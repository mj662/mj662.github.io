const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const code=fs.readFileSync(require('node:path').join(__dirname,'../language-preference.js'),'utf8');
function run({languages=['en-US'],stored=null,path='/',blocked=false,search='',hash=''}={}){
 let redirect=null,handler;const writes=[];
 const context={document:{addEventListener:(name,fn)=>handler=fn},navigator:{languages,language:languages[0]},location:{pathname:path,search,hash,replace:value=>redirect=value},localStorage:{getItem:()=>{if(blocked)throw Error('blocked');return stored},setItem:(k,v)=>{if(blocked)throw Error('blocked');writes.push([k,v])}}};
 vm.runInNewContext(code,context);
 return {redirect,writes,choose:lang=>handler({target:{closest:()=>({hreflang:lang})}})};
}
test('browser regional languages route to matching pages and preserve URL context',()=>{
 assert.equal(run({languages:['fr-CA','en'],search:'?source=mail',hash:'#carplay'}).redirect,'/fr/?source=mail#carplay');
 assert.equal(run({languages:['de-DE']}).redirect,'/de/');
 assert.equal(run({languages:['en-GB','de']}).redirect,null);
 assert.equal(run({languages:['es-ES']}).redirect,'/es/');
 assert.equal(run({languages:['es-MX']}).redirect,'/es/');
 assert.equal(run({languages:['ja-JP']}).redirect,null);
});
test('manual language preference overrides browser language, including English',()=>{
 assert.equal(run({languages:['fr'],stored:'en'}).redirect,null);
 assert.equal(run({languages:['en'],stored:'de'}).redirect,'/de/');
 assert.equal(run({languages:['en'],stored:'es'}).redirect,'/es/');
 const page=run();page.choose('es');assert.deepEqual(page.writes,[['clock-radio-language','es']]);
});
test('direct translated links stay stable and storage denial is harmless',()=>{
 assert.equal(run({languages:['fr'],stored:'fr',path:'/de/'}).redirect,null);
 assert.equal(run({languages:['en'],path:'/es/'}).redirect,null);
 assert.equal(run({languages:['de'],blocked:true}).redirect,'/de/');
 assert.doesNotThrow(()=>run({blocked:true}).choose('en'));
});
