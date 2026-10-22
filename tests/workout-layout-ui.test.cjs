const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.stack));
 await page.goto(pathToFileURL(path.resolve(__dirname,'../app/src/main/assets/index.html')).href);
 await page.locator('.hero-stats').click();assert.equal(await page.evaluate(()=>view),'stats');
 await page.evaluate(()=>{data.settings.sound=false;initializeUpgrade()});assert(await page.evaluate(()=>data.settings.sound));assert.equal(await page.locator('.sound-toggle').count(),0);
 const out=path.resolve(__dirname,'../.build/test-results');fs.mkdirSync(out,{recursive:true});
 for(const viewport of [{width:360,height:640},{width:390,height:844},{width:412,height:915}]){
  await page.setViewportSize(viewport);
  for(const name of ['俯卧撑','深蹲','平板支撑']){
   await page.evaluate(name=>{stopSensor();session=null;makeSession('plan',[{name,unit:name==='平板支撑'?'seconds':'reps',target:25,set:1,total:2,rest:120},{name,unit:name==='平板支撑'?'seconds':'reps',target:25,set:2,total:2,rest:120}],{dayTitle:'第 1 周 · 容量训练'});session.count=5;renderWorkout()},name);
   let bounds=await page.evaluate(()=>({height:document.documentElement.scrollHeight,viewport:innerHeight,bottom:document.querySelector('.elapsed-line').getBoundingClientRect().bottom}));assert(bounds.height<=viewport.height+1,JSON.stringify({viewport,name,bounds}));assert(bounds.bottom<=viewport.height);
   assert.equal(await page.locator('.workout .top,.sound-toggle,.rest-hint').count(),0);
   const main=await page.locator('.workout-primary').boundingBox(),pause=await page.locator('.workout-actions [data-action=pause]').boundingBox(),exit=await page.locator('.workout-actions [data-action=exit]').boundingBox();assert(main.width>pause.width*2);assert(main.height>pause.height);assert(Math.abs(main.y+main.height/2-pause.y-pause.height/2)<2);assert(Math.abs(main.y+main.height/2-exit.y-exit.height/2)<2);
   if(name==='深蹲'&&viewport.width===412)await page.screenshot({path:path.join(out,'compact-workout.png')});
   await page.locator('.workout-actions [data-action=pause]').click();assert(await page.evaluate(()=>session.paused));await page.locator('.workout-actions [data-action=pause]').click();assert.equal(await page.evaluate(()=>session.paused),false);
   await page.evaluate(()=>{session.setElapsed=5;enterRest()});bounds=await page.evaluate(()=>({height:document.documentElement.scrollHeight,viewport:innerHeight}));assert(bounds.height<=viewport.height+1,JSON.stringify({viewport,name,phase:'rest',bounds}));assert.equal(await page.locator('.workout-primary[data-action=skip]').count(),1);
   await page.locator('[data-action=skip]').click();assert.equal(await page.evaluate(()=>session.index),1);
  }
 }
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: homepage stats link, always-on sound, 360x640/390x844/412x915 one-screen work/rest layouts, prominent main action, shared action row, pause and next set.');
})().catch(e=>{console.error(e);process.exit(1)});
