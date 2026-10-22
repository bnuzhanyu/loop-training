const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path'), fs=require('node:fs'), {pathToFileURL}=require('node:url');
const assets=path.resolve(__dirname,'../app/src/main/assets/index.html');
const out=path.resolve(__dirname,'../.build/test-results'); fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--allow-file-access-from-files']});const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2});const page=await context.newPage();let errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(assets).href);
await page.locator('#home-quote').waitFor();await page.screenshot({path:path.join(out,'home.png')});
await page.locator('[data-action=new]').click();await page.locator('[data-action=generatortext]').click();await page.locator('#plantext').fill('计划：自动验证\n第1天：短训练\n俯卧撑 | 1,1,1,1 | 1\n第2天：<img src=x onerror=alert(1)>\n深蹲 | 1,1,1,1 | 1');await page.locator('[data-action=preview]').click();await page.locator('[data-action=saveplan]').click();assert.equal(await page.locator('img').count(),0);
await page.locator('[data-action=start]').first().click();await page.locator('[data-action=begin]').click();await page.locator('[data-action=count]').first().click();await page.locator('[data-action=pause]').first().click();await page.reload();assert(await page.getByText('已暂停',{exact:false}).count());await page.locator('[data-action=pause]').first().click();
await page.screenshot({path:path.join(out,'training.png')});
for(let i=0;i<4;i++){if(i>0)await page.locator('[data-action=count]').first().click();if(i<3)await page.locator('[data-action=skip]').click();else {await page.locator('[data-action=finishset]').click();await page.locator('[data-action=confirmset]').click();}}
await page.getByRole('heading',{name:'训练完成 ✓'}).waitFor();await page.locator('[data-action=close]').click();assert(await page.locator('.dayindex[aria-label*="已完成 1 次"]').count());
// Repeating the same day must produce two independent logs and one completed day.
await page.locator('[data-action=start]').first().click();await page.locator('[data-action=begin]').click();for(let i=0;i<4;i++){await page.locator('[data-action=count]').first().click();if(i<3)await page.locator('[data-action=skip]').click();else {await page.locator('[data-action=finishset]').click();await page.locator('[data-action=confirmset]').click();}}await page.locator('[data-action=close]').click();assert(await page.locator('.dayindex[aria-label*="已完成 2 次"]').count());
let snapshot=await page.evaluate(()=>JSON.parse(localStorage.getItem('loop-v1')));assert.equal(snapshot.logs.length,2);assert.equal(snapshot.logs[0].sets.length,4);
await page.locator('[data-view=stats]').click();assert(await page.getByText('8',{exact:true}).count());await page.screenshot({path:path.join(out,'stats.png')});
for(let k of ['week','month','year','all'])await page.locator('[data-kind='+k+']').click();
await page.locator('[data-action=log]').first().click();await page.locator('[data-action=repeatlog]').click();await page.locator('[data-action=begin]').click();await page.locator('[data-action=exit]').click();await page.locator('[data-action=discard]').click();assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('loop-v1')))).logs.length,2);
await page.locator('[data-view=data]').click();await page.locator('[data-action=restore]').click();await page.locator('#backuptext').fill(JSON.stringify(snapshot));await page.locator('[data-action=checkbackup]').click();await page.locator('[data-action=confirmrestore]').click();assert.equal(await page.locator('[data-action=plan]').count(),4);
await page.reload();assert.equal(await page.locator('[data-action=plan]').count(),4);
assert.deepEqual(errors,[]);console.log('PASS: launch, plan import, escaped user text, setup, counting, pause/reload/resume, 4 sets, rest skipping, checkmark, repeated day, statistics tabs, repeat from history, discard, backup restore, persistence.');await browser.close()})().catch(e=>{console.error(e);process.exit(1)});
