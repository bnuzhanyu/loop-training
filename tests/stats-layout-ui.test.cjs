const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.stack));
 await page.goto(pathToFileURL(path.resolve(__dirname,'../app/src/main/assets/index.html')).href);
 await page.evaluate(()=>{data.logs=[2024,2025,2026].map((year,i)=>({id:'year'+year,date:year+'-10-22',completedAt:year+'-10-22T10:00:00Z',planId:'p',dayId:'d',planTitle:'力量',dayTitle:'训练',duration:100*(i+1),sets:[{name:'深蹲',unit:'reps',actual:10*(i+1),target:10,duration:30*(i+1)}]}));anchor='2026-10-22';view='stats';render()});
 assert.deepEqual(await page.locator('[data-action=period]').evaluateAll(es=>es.map(e=>e.dataset.kind)),['week','month','year','all']);
 for(const viewport of [{width:360,height:640},{width:390,height:844},{width:412,height:915}]){
  await page.setViewportSize(viewport);
  for(const kind of ['week','month','year','all']){
   await page.locator('[data-kind='+kind+']').click();await page.evaluate(()=>scrollTo(0,0));
   const select=await page.locator('#stats-exercise').boundingBox(),date=await page.locator('#stats-date').boundingBox();assert(Math.abs(select.y-date.y)<2);assert(select.x+select.width<date.x);
   const chart=await page.locator('.stats-distribution').boundingBox(),nav=await page.locator('nav').boundingBox();assert(chart.y+chart.height<=nav.y,JSON.stringify({viewport,kind,chart,nav}));
   assert.deepEqual(await page.locator('.duration-metric small').allTextContents(),['运动用时','总用时']);assert.equal(await page.locator('.duration-metric .sub').count(),0);
  }
 }
 assert.equal(await page.locator('#stats-date').isDisabled(),true);assert.equal(await page.locator('.chart .barwrap').count(),3);assert.deepEqual(await page.locator('.chart .barwrap').evaluateAll(es=>es.map(e=>e.title)),['2024 10次','2025 20次','2026 30次']);assert.equal(await page.locator('#stats-active-time').innerText(),'3分');assert.equal(await page.locator('#stats-total-time').innerText(),'10分');
 await page.locator('#stats-exercise').selectOption('深蹲');assert.equal(await page.locator('.chart .barwrap').count(),3);await page.locator('#stats-exercise').selectOption('俯卧撑');assert.equal(await page.locator('[data-action=log]').count(),0);assert.equal(await page.locator('.chart .barwrap').count(),1);
 await page.locator('#stats-exercise').selectOption('');const out=path.resolve(__dirname,'../.build/test-results');fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,'compact-statistics.png')});assert.deepEqual(errors,[]);await browser.close();console.log('PASS: week/month/year/all, annual all-time buckets, same-row filters, concise duration labels, all-time filtering and first-screen chart at 360x640/390x844/412x915.');
})().catch(e=>{console.error(e);process.exit(1)});
