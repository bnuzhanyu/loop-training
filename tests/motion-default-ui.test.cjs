const {chromium}=require('playwright');
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.stack));
 await page.addInitScript(()=>{window.motionCalls=[];window.motionSupported=true;window.Native={load:()=>'',save:()=>true,loadDraft:()=>'',saveDraft:()=>{},hasProximity:()=>true,proximity:()=>true,sensor:(on)=>{motionCalls.push(on);return motionSupported},sound:()=>{},haptic:()=>{},trainingMode:()=>{}}});
 await page.goto(pathToFileURL(path.resolve(__dirname,'../app/src/main/assets/index.html')).href);
 for(const name of ['深蹲','仰卧起坐']){
  await page.evaluate(name=>{session=null;makeSession('single',[{name,unit:'reps',target:25,set:1,total:1,rest:60}])},name);
  await page.evaluate(()=>{window.fakeNow=10000;inputTime=()=>fakeNow});
  assert(await page.evaluate(()=>sensorOn));const started=await page.evaluate(()=>motionCalls.filter(Boolean).length);
  await page.evaluate(()=>renderWorkout());assert.equal(await page.evaluate(()=>motionCalls.filter(Boolean).length),started);
  await page.evaluate(()=>onSensorRep());assert.equal(await page.evaluate(()=>session.count),1);
  await page.evaluate(()=>{fakeNow+=999;inputCount();onSensorRep()});assert.equal(await page.evaluate(()=>session.count),1);
  await page.evaluate(()=>{fakeNow+=1;inputCount();onSensorRep()});assert.equal(await page.evaluate(()=>session.count),2);
  await page.evaluate(()=>{fakeNow+=1000;onSensorRep();inputCount()});assert.equal(await page.evaluate(()=>session.count),3);
  await page.locator('[data-action=pause]').first().click();assert.equal(await page.evaluate(()=>sensorOn),false);
  await page.evaluate(()=>onSensorRep());assert.equal(await page.evaluate(()=>session.count),3);
  await page.locator('[data-action=pause]').first().click();assert(await page.evaluate(()=>sensorOn));
  await page.evaluate(()=>{session.mode='plan';session.items.push({...session.items[0]});enterRest()});assert.equal(await page.evaluate(()=>sensorOn),false);
  await page.locator('[data-action=skip]').click();assert(await page.evaluate(()=>sensorOn));
  await page.locator('[data-action=sensor]').click();assert.equal(await page.evaluate(()=>sensorOn),false);
  await page.evaluate(()=>{pause();pause();renderWorkout()});assert.equal(await page.evaluate(()=>sensorOn),false);
  await page.locator('[data-action=sensor]').click();assert(await page.evaluate(()=>sensorOn));
  await page.evaluate(()=>onAppPause());assert.equal(await page.evaluate(()=>sensorOn),false);
  await page.evaluate(()=>{stopSensor();session=null});
 }
 for(const [mode,name,unit] of [['single','深蹲','seconds'],['counter','手动计数器','reps'],['timer','正计时','seconds'],['single','其他动作','reps']]){
  await page.evaluate(([mode,name,unit])=>{session=null;makeSession(mode,[{name,unit,target:60,set:1,total:1,rest:0}])},[mode,name,unit]);assert.equal(await page.evaluate(()=>sensorOn),false);
 }
 await page.evaluate(()=>{session=null;motionSupported=false;makeSession('single',[{name:'深蹲',unit:'reps',target:25,set:1,total:1,rest:0}])});assert.equal(await page.evaluate(()=>sensorOn),false);
 assert((await page.locator('#sensor-status').innerText()).includes('不可用'));
 await page.locator('button[data-action=count]').first().click();assert.equal(await page.evaluate(()=>session.count),1);
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: squat/situp defaults, no duplicate registrations, sensor reps, pause/background/rest/next set, manual override, timed/tools exclusions and unavailable fallback.');
})().catch(e=>{console.error(e);process.exit(1)});
