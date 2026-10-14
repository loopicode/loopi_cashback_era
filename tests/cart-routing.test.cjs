const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const code = fs.readFileSync(require('path').join(__dirname, '../assets/loopi-cart.js'), 'utf8');
function fixture(items, metadata, options = {}) {
  const cart = { currency:'CHF', total_price:1234, total_discount:0, token:'test-cart?key=test', items };
  const snapshot = {currency:'CHF',total:1234,items:metadata};
  const calls=[],destinations=[];
  const errors=[{hidden:true,textContent:''}];
  const config={apiKey:'test',apiBase:'https://checkout.example',checkoutBase:'https://payment.example',messages:{checkout_error:'RETRY',metadata_error:'VERIFY',unsupported:'UNSUPPORTED',empty:'EMPTY',pending:'WAIT'}};
  const document={getElementById:id=>id==='loopi-cart-config'?{textContent:JSON.stringify(config)}:null,
    querySelectorAll:selector=>selector==='[data-loopi-checkout-error]'?errors:[],addEventListener(){},documentElement:{toggleAttribute(){}}};
  let postCount=0;
  const window={Shopify:{routes:{root:'/fr/'}},location:{origin:'https://shop.example',href:'https://shop.example/fr/cart',assign:url=>destinations.push(url)},addEventListener(){},
    fetch:async(input,opts)=>{
      const url=String(input);calls.push({url,options:opts});
      if(url.includes('/create')){postCount++;return {ok:options.postOK!==false,text:async()=>JSON.stringify(options.postBody||{success:true})};}
      if(url.includes('section_id'))return {ok:true,text:async()=>JSON.stringify(snapshot)};
      return {ok:true,json:async()=>cart};
    }};
  class DOMParser {parseFromString(text){return {querySelector:()=>({textContent:text})};}}
  const context={document,window,DOMParser,URL,URLSearchParams,AbortController,setTimeout,clearTimeout,HTMLElement:class{},customElements:{define(){}},console};
  vm.runInNewContext(code,context);
  return {router:window.LoopiCart,cart,snapshot,calls,destinations,errors,postCount:()=>postCount};
}
const line=(id,qty=1)=>({key:String(id),variant_id:id,quantity:qty,properties:{}});
const meta=(id,subscription,duration)=>({key:String(id),variant_id:id,quantity:1,subscription,subscription_type:'boolean',duration,options:[]});
(async()=>{
 let passed=0;
 async function test(name,fn){await fn();passed++;console.log('PASS '+name);}
 await test('Purchase with length 12 routes to Shopify',async()=>{const t=fixture([line(1)],[meta(1,false,12)]);await t.router.navigate();assert.deepEqual(t.destinations,['/fr/checkout']);assert.equal(t.postCount(),0);});
 await test('Rental routes to Circuly',async()=>{const t=fixture([line(1)],[meta(1,true,12)]);await t.router.navigate();assert.match(t.destinations[0],/^https:\/\/payment.example/);assert.equal(t.postCount(),1);});
 await test('Mixed basket sends every line with individual flags',async()=>{const t=fixture([line(1),line(2)],[meta(1,true,6),meta(2,false,1)]);await t.router.navigate();const payload=JSON.parse(t.calls.find(c=>c.url.includes('/create')).options.body);assert.equal(payload.items.length,2);assert.equal(payload.items[1].subscription,false);assert.equal(payload.items[1].subscription_duration,undefined);});
 await test('Removed last rental means Shopify',async()=>{const t=fixture([line(2)],[meta(2,false)]);await t.router.navigate();assert.deepEqual(t.destinations,['/fr/checkout']);});
 await test('Extra metadata for unselected rental is rejected',async()=>{const t=fixture([line(1)],[meta(1,false),meta(2,true,6)]);await t.router.navigate();assert.equal(t.destinations.length,0);assert.equal(t.errors[0].textContent,'VERIFY');});
 await test('HTTP 500 retains basket and offers retry',async()=>{const t=fixture([line(1)],[meta(1,true,6)],{postOK:false});await t.router.navigate();assert.equal(t.destinations.length,0);assert.equal(t.errors[0].textContent,'RETRY');});
 await test('API error in HTTP 200 retains basket',async()=>{const t=fixture([line(1)],[meta(1,true,6)],{postBody:{error:'bad'}});await t.router.navigate();assert.equal(t.destinations.length,0);});
 await test('Double click creates one Circuly cart',async()=>{const t=fixture([line(1)],[meta(1,true,6)]);await Promise.all([t.router.navigate(),t.router.navigate()]);assert.equal(t.postCount(),1);});
 await test('Empty basket does not navigate',async()=>{const t=fixture([],[]);await t.router.navigate();assert.equal(t.destinations.length,0);assert.equal(t.errors[0].textContent,'EMPTY');});
 await test('String true is rejected rather than guessed',async()=>{const t=fixture([line(1)],[meta(1,'true',6)]);await t.router.navigate();assert.equal(t.destinations.length,0);});
 await test('Quantity mismatch blocks routing',async()=>{const t=fixture([line(1,2)],[meta(1,false)]);await t.router.navigate();assert.equal(t.destinations.length,0);});
 await test('Explicit subscription length overrides option text',()=>{const t=fixture([],[]);assert.equal(t.router.rentalTerm({duration:12,options:[{value:'6+ Monate'}]}).duration,12);});
 await test('Missing length reads explicit variant rental option',()=>{const t=fixture([],[]);assert.equal(t.router.rentalTerm({duration:null,options:[{value:'6+ Monate'}]}).duration,6);});
 await test('Missing rental term blocks transfer',async()=>{const t=fixture([line(1)],[meta(1,true)]);await t.router.navigate();assert.equal(t.destinations.length,0);assert.equal(t.errors[0].textContent,'VERIFY');});
 await test('Purchase length is omitted from mixed payload',()=>{const t=fixture([line(1),line(2)],[meta(1,true,12),meta(2,false,1)]);assert.equal(t.router.buildPayload(t.cart,t.snapshot).items[1].subscription_duration,undefined);});
 await test('Unverified custom properties block Circuly transfer',async()=>{const item={...line(1),properties:{gift:'yes'}};const t=fixture([item],[meta(1,true,6)]);await t.router.navigate();assert.equal(t.destinations.length,0);assert.equal(t.errors[0].textContent,'UNSUPPORTED');});
 console.log(`${passed} tests passed`);
})().catch(e=>{console.error(e);process.exit(1);});
