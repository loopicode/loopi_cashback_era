const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../assets/loopi-cart.js'), 'utf8');
const context = {};
vm.runInNewContext(source.slice(source.indexOf('  const accessoryPlan ='), source.indexOf('  const fingerprint =')) + '\nthis.plan = accessoryPlan;', context);
const H = {
 sleep: 'sleepytroll-baby-rocker-gen-2', foot: 'bugaboo-performance-footmuff',
 board: 'bugaboo-comfort-wheeled-board', organizer: 'bugaboo-organizer', liner: 'bugaboo-seat-liner',
 small: 'bugaboo-butterfly-transporttasche', big: 'bugaboo-komfort-transporttasche',
 adapter: 'bugaboo-donkey-car-seats-adapter',
 wheels: 'nicon-wheelblades-xl-paar-schneetaugliche-kinderwagen-in-sekundenschnelle',
};
const option = (id, subscription, mount = '') => ({id, subscription, mount});
const candidates = Object.values(H).map(handle => ({handle, options: handle === H.board ?
 [option('board-main-rent',true,'Donkey Fox Dragonfly'),option('board-main-buy',false,'Donkey Fox Dragonfly'),option('board-butterfly-rent',true,'Butterfly'),option('board-butterfly-buy',false,'Butterfly')] :
 [option(handle+'-rent',true),option(handle+'-buy',false)]}));
const stroller = (model, subscription = false, vendor = 'Bugaboo') => ({handle:'stroller-'+model,type:'Kinderwagen',vendor,tags:['Kategorie:Kinderwagen','Modell:'+model],subscription});
const trailer = {handle:'trailer',type:'Velo-Anhänger',vendor:'Thule',tags:['Kategorie:Velo-Anhänger'],subscription:false};
const accessory = handle => ({handle,type:'Kinderwagen Zubehör',vendor:'Bugaboo',tags:['Kategorie:Zubehör'],subscription:false});
const plan = (items,month=10,pool=candidates) => JSON.parse(JSON.stringify(context.plan(items,pool,month)));
const handles = result => result.cards.map(card=>card.handle);
const card = (result,handle) => result.cards.find(card=>card.handle===handle);
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
test('Butterfly 1 board exposes only Butterfly mounting variants',()=>assert.deepEqual(card(plan([stroller('Butterfly')]),H.board).options.map(o=>o.mount),['Butterfly','Butterfly']));
test('Butterfly 2 uses same mounting group and small bag',()=>{const result=plan([{...stroller('Butterfly'),handle:'butterfly-2'}]);assert.ok(handles(result).includes(H.small));assert.ok(!handles(result).includes(H.big));assert.equal(card(result,H.board).selected,'board-butterfly-buy');});
for(const model of ['Fox','Dragonfly','Donkey']) test(model+' exposes only shared board mounting group',()=>assert.deepEqual(card(plan([stroller(model)]),H.board).options.map(o=>o.mount),['Donkey Fox Dragonfly','Donkey Fox Dragonfly']));
test('Bee has no board recommendation',()=>assert.ok(!handles(plan([stroller('Bee')])).includes(H.board)));
for(const model of ['Fox','Dragonfly']) test(model+' has no large transport bag',()=>assert.ok(!handles(plan([stroller(model)])).includes(H.big)));
test('All Donkey generation/configuration handles get large bag and adapter',()=>{for(const version of ['donkey-5-mono','donkey-5-duo','donkey-5-twin','donkey-6-mono','donkey-6-double','donkey-6-twin']){const result=plan([{...stroller('Donkey'),handle:version}]);assert.ok(handles(result).includes(H.big));assert.ok(handles(result).includes(H.adapter));assert.ok(card(result,H.adapter).needsChoice);assert.equal(card(result,H.adapter).selected,null);}});
test('Other stroller brands receive only approved universal accessories',()=>assert.deepEqual(handles(plan([stroller('Urban Glide',false,'Thule')])),[H.foot,H.sleep,H.wheels]));
test('Bike trailers get footmuff, without Sleepytroll or Wheelblades',()=>assert.deepEqual(handles(plan([trailer])),[H.foot]));
test('Trailer accessory is not mistaken for the trailer',()=>assert.deepEqual(handles(plan([{...trailer,tags:['Kategorie:Velo-Anhänger','Kategorie:Zubehör']}])),[]));
test('Bugaboo high chair keeps previous recommendation path',()=>assert.equal(plan([{handle:'giraffe',type:'Wohnen',vendor:'Bugaboo',tags:['Kategorie:Wohnen']}]).handled,false));
test('Accessory-only basket hides recommendations without inventing a stroller',()=>assert.deepEqual(handles(plan([accessory(H.foot)])),[]));
test('Whole basket works when accessory is first',()=>assert.deepEqual(handles(plan([accessory(H.foot),stroller('Donkey')])),handles(plan([stroller('Donkey'),accessory(H.foot)]))));
test('Already added products excluded across all cart lines',()=>assert.ok(!handles(plan([stroller('Donkey'),accessory(H.sleep)])).includes(H.sleep)));
test('September through March boost is inclusive',()=>{for(const month of [9,10,11,12,1,2,3])assert.equal(handles(plan([stroller('Donkey')],month))[0],H.foot);for(const month of [4,5,6,7,8])assert.equal(handles(plan([stroller('Donkey')],month))[0],H.sleep);});
test('Donkey transport bag is in first three all year',()=>{for(let month=1;month<=12;month++)assert.ok(handles(plan([stroller('Donkey')],month)).slice(0,3).includes(H.big));});
test('Mixed Butterfly and Donkey contexts require explicit board choice',()=>{const result=plan([stroller('Butterfly'),stroller('Donkey')]);assert.equal(card(result,H.board).options.length,4);assert.equal(card(result,H.board).selected,null);assert.ok(card(result,H.board).needsChoice);});
test('Purchase basket prefers purchasing and rental basket prefers renting',()=>{assert.equal(card(plan([stroller('Donkey')]),H.sleep).selected,H.sleep+'-buy');assert.equal(card(plan([stroller('Donkey',true)]),H.sleep).selected,H.sleep+'-rent');});
test('Rental-only accessory requires opt-in in purchase basket',()=>{const result=plan([stroller('Donkey')],10,[{handle:H.liner,options:[option('rent',true)]}]);assert.equal(card(result,H.liner).selected,null);assert.ok(card(result,H.liner).needsChoice);});
test('No unavailable compatible mounting option means no board',()=>{const result=plan([stroller('Butterfly')],10,[{handle:H.board,options:[option('main',false,'Donkey Fox Dragonfly')]}]);assert.deepEqual(result.cards,[]);});
test('Excluded or unknown candidates never enter transport recommendations',()=>{const pool=[...candidates,...['bugaboo-moskitonetz','bugaboo-donkey-regenschutz','unknown-accessory','bugaboo-cocoon'].map(handle=>({handle,options:[option(handle,true)]}))];assert.deepEqual(handles(plan([stroller('Donkey')],10,pool)),handles(plan([stroller('Donkey')])));});
console.log(passed+' accessory tests passed');
