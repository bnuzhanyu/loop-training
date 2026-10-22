'use strict';
let upgradedHandlers=false,lastRenderedView='',lastRenderedPlan=null;
function normalizeSession(){if(!session)return;session.mode=session.mode||'plan';session.setElapsed=Number.isFinite(session.setElapsed)?session.setElapsed:0;session.results=session.results||[];for(const x of session.items)x.unit=x.unit||'reps';session.recordBaselines=session.recordBaselines||recordBaseline();}
function currentItem(){return session?.items[session.index]}
function isTimed(){return currentItem()?.unit==='seconds'}
function fullTap(){return session&&session.phase==='work'&&session.mode!=='counter'&&session.mode!=='timer'&&!isTimed()&&currentItem().name.includes('俯卧撑')}
let proximityActive=false,proximityToken=0,proximityFailed=false,lastNoseTouch=-Infinity,proximityNear=false,proximityCycleCounted=false;
let lastInputRep=null;
function inputTime(){return performance.now()}
function countInput(source){
 if(!session||view!=='workout'||session.phase!=='work'||session.paused||isTimed()||$('modal').innerHTML)return;
 const now=inputTime(),key=session.id+':'+session.index,hybrid=proximityActive||sensorOn;
 if(source==='touch'&&proximityActive&&proximityNear&&proximityCycleCounted)return;
 const previous=lastInputRep?.key===key?lastInputRep:null;
 if(hybrid&&previous&&now-previous.time<1000){if(source==='proximity')proximityCycleCounted=true;return}
 if(proximityActive&&(source==='touch'||source==='proximity'))proximityCycleCounted=true;
 lastInputRep={key,time:now,source};count();
}
function proximityAvailable(){return !proximityFailed&&!!window.Native&&typeof Native.hasProximity==='function'&&Native.hasProximity()}
function proximityMode(){return fullTap()&&data.settings.pushupProximity!==false&&proximityAvailable()}
function stopProximity(){if(proximityActive){proximityActive=false;proximityNear=false;proximityCycleCounted=false;proximityToken++;Native.proximity(false,proximityToken)}}
function syncProximity(){let on=view==='workout'&&proximityMode()&&!session.paused;if(on===proximityActive)return;stopProximity();if(on){proximityActive=true;Native.proximity(true,++proximityToken)}}
function inputCount(){if(fullTap()&&performance.now()-lastNoseTouch<350)return;countInput('touch')}
window.onProximityRep=token=>{if(token===proximityToken&&proximityActive&&view==='workout'&&proximityMode()&&!$('modal').innerHTML)countInput('proximity')};
window.onProximityState=(token,near)=>{if(token!==proximityToken||!proximityActive)return;proximityNear=near;if(!near)proximityCycleCounted=false;if($('proximity-status'))$('proximity-status').textContent=near?'已靠近 · 抬起后可计下一次':'触屏或靠近均可计数'};
window.onProximityUnavailable=token=>{if(token!==proximityToken||!proximityActive)return;stopProximity();proximityFailed=true;toast('距离感应启动失败，已切换触屏计数');renderWorkout()};
let motionKey='';
function defaultMotion(){return !!currentItem()&&/深蹲|仰卧起坐/.test(currentItem().name)}
function syncMotion(){
 const s=session,x=currentItem();
 const wanted=s&&view==='workout'&&s.phase==='work'&&!s.paused&&!isTimed()&&!fullTap()&&!['counter','timer'].includes(s.mode)&&(s.motionInputs?.[x.name]??defaultMotion());
 if(!wanted){if(sensorOn)stopMotion();return}
 if(!window.Native||typeof Native.sensor!=='function'||s.motionUnavailable)return;
 const key=s.id+':'+s.index;if(sensorOn&&motionKey===key)return;
 stopMotion();sensorOn=Native.sensor(true,Number(window.sensitivity||1.1));
 if(sensorOn)motionKey=key;else s.motionUnavailable=true;
}
function stopMotion(){if(sensorOn&&window.Native)Native.sensor(false,1.1);sensorOn=false;motionKey=''}
function motionStatus(){return session.paused?'已暂停':session.motionUnavailable?'运动感应不可用，请点击计数':sensorOn?'感应已开启 · 手机需随身体运动':'点击即可计数'}
function valueNow(){return isTimed()?Math.floor(session.setElapsed||0):session.count}
function formatTime(n){n=Math.max(0,Math.floor(n||0));return (n>=3600?String(Math.floor(n/3600)).padStart(2,'0')+':':'')+String(Math.floor(n/60)%60).padStart(2,'0')+':'+String(n%60).padStart(2,'0')}
function formatRest(n){return n>=60?(Math.floor(n/60)+'分'+(n%60?n%60+'秒':'')):n+'秒'}
function restRemaining(){return session?.paused?session.remaining||0:Math.max(0,Math.ceil((session.restEnd-Date.now())/1000))}
function startSetup(p,d){if(p.paused){toast('请先重新开始这个计划');return}if(activeGuard())return;let items=C.flatten(d);prepared={p,d};$('modal').innerHTML=`<div class="overlay"><div class="dialog" role="dialog" aria-modal="true" aria-label="开始训练"><div class="eyebrow">READY WHEN YOU ARE</div><h2>${esc(cleanDayTitle(d.title))}</h2><p>先热身，再按能力调整目标。前面的组达标后自动休息；最后一组可继续计时计次。休息时可以加时或立即下一组。</p><div class="preview">${items.map((x,i)=>`<div class="setup-set"><label class="miniline"><span>${esc(x.name)} · 第 ${x.set} 组</span>${valueField('target-'+i,x.target,x.unit,1,x.unit==='seconds'?86400:10000,x.name+'第'+x.set+'组目标')}</label><small>${i===items.length-1?'最后一组 · 达标后可继续计数计时':'达标后自动休息 '+formatRest(x.rest)}</small></div>`).join('')}</div><div class="actions">${button('返回','close','secondary')}${button('开始训练','begin')}</div></div></div>`}
function begin(){let {p,d}=prepared,items=C.flatten(d);for(let i=0;i<items.length;i++){let v=Number($('target-'+i).value);let max=items[i].unit==='seconds'?86400:10000;if(!Number.isInteger(v)||v<1||v>max){toast('目标需为 1～'+max+' 的整数');return}items[i].target=v}session={id:C.uid(),mode:'plan',planId:p.id,planTitle:p.title,dayId:d.id,dayTitle:d.title,items,index:0,count:0,results:[],phase:'work',paused:false,elapsed:0,setElapsed:0,lastTick:Date.now()};session.recordBaselines=recordBaseline();close();view='workout';saveDraft();render();sound('target')}
function goalText(){let s=session,x=currentItem();if(s.mode==='counter')return '手动加减 · 自动保存进度';if(s.mode==='timer'&&!s.countdown)return '正计时 · 手动结束';let v=valueNow();return v>=x.target?'目标已完成，继续也可以':'目标 '+(isTimed()?formatTime(x.target):x.target+' 次')}
function workoutActions(mainLabel,mainAction,attrs=''){
 return `<div class="workout-actions no-count">${button(session.paused?'继续':'暂停','pause','secondary compact-control')}${button(mainLabel,mainAction,'primary workout-primary',attrs)}${button(['counter','timer'].includes(session.mode)?'关闭':'结束','exit','secondary compact-control')}</div>`;
}
function renderWorkout(){
 const s=session;if(!s){view='plans';render();return}normalizeSession();syncProximity();syncMotion();
 const x=currentItem(),rest=s.phase==='rest',utility=['counter','timer'].includes(s.mode),tap=fullTap();if(window.Native&&typeof Native.trainingMode==='function')Native.trainingMode(tap);
 const header=`<header class="workout-heading"><h1>${rest?'休息一下':esc(x.name)}</h1><p class="sub">${s.mode==='plan'?esc(cleanDayTitle(s.dayTitle))+' · ':''}${s.paused?'已暂停':rest?'准备下一组':s.mode==='plan'?'第 '+(s.index+1)+' / '+s.items.length+' 组':'按自己的节奏'}</p>${s.mode==='plan'?`<div class="setdots">${s.items.map((_,i)=>`<i class="${i<s.index?'complete':i===s.index?'current':''}"></i>`).join('')}</div>`:''}</header>`;
 const restContent=`<div class="rest-space"><button class="counter restcircle" data-action="pause" aria-label="点击休息时间暂停或继续"><b id="rest-clock">${formatTime(restRemaining())}</b><small>${s.paused?'已暂停 · 点击继续':'剩余休息时间 · 点击暂停'}</small></button><p class="sub">下一组：${esc(s.items[s.index+1]?.name)} · ${s.items[s.index+1]?.unit==='seconds'?formatTime(s.items[s.index+1]?.target):s.items[s.index+1]?.target+' 次'}</p></div><div class="rest-add no-count">${[15,30,60].map(n=>button('＋'+(n===60?'1 分钟':n+' 秒'),'addrest','secondary',`data-seconds="${n}"`)).join('')}</div>${workoutActions('立即开始下一组','skip')}`;
 const workContent=`<div class="count-space ${!isTimed()?'count-hit-area':''}" ${!isTimed()?'data-action="countarea" role="group" aria-label="点按区域增加一次"':''}><button class="counter ${isTimed()?'time-counter':''}" ${isTimed()?'data-action="pause" aria-label="点击时间暂停或继续"':'data-action="count" aria-label="'+(proximityMode()?'点击或靠近屏幕上方计数':'点击增加一次')+'" '+(s.paused?'disabled':'')}><b id="count" class="${displayValue().length>6?'long-time':''}">${displayValue()}</b><small id="goal-status">${isTimed()&&s.paused?'已暂停 · 点击时间继续':goalText()}</small></button>${tap?`<p class="tap-hint" id="proximity-status">${s.paused?'已暂停':proximityMode()?'触屏或靠近均可计数':'鼻尖轻触即可计数'}</p>`:''}</div>
 ${!utility&&!isTimed()?`<div class="set-time-panel" aria-label="本组运动时间"><span class="set-time-label">本组时间</span><strong id="set-clock">${formatTime(s.setElapsed)}</strong><span class="set-time-status">${s.paused?'已暂停':'运动中'}</span></div>`:''}
 ${!isTimed()&&!tap?`<div class="counter-row no-count">${button('−1','minus','icon','aria-label="减少一次"')}${button('＋1','count','icon','aria-label="增加一次"')}</div>`:''}
 ${!utility?`<div class="record-line"><span id="personal-best">单组纪录 ${bestFor(x.name,x.unit)||'—'} ${isTimed()?'秒':'次'}</span>${isTimed()?`<span id="set-clock">本组 ${formatTime(s.setElapsed)}</span>`:''}</div>`:''}
 ${tap?`<div class="row sensor-controls no-count"><small>${proximityMode()?'触屏＋距离感应':proximityAvailable()?'触屏计数':'此设备使用触屏计数'}</small>${proximityAvailable()?button(proximityMode()?'关闭距离感应':'开启距离感应','pushupinput','icon'):''}</div>`:!utility&&!isTimed()?`<div class="row sensor-controls no-count"><small id="sensor-status">${motionStatus()}</small>${button(sensorOn?'关闭感应':'运动感应','sensor','icon')}</div>`:''}
 ${utility?workoutActions('重置','resettool'):workoutActions(s.index===s.items.length-1?'结束并保存':'完成本组','finishset',valueNow()<1?'disabled':'')}`;
 $('app').innerHTML=`<main class="workout compact-workout ${utility?'utility-workout':''} ${s.mode==='timer'?'timer-workout':''} ${tap?'tap-workout':''}">${header}${rest?restContent:workContent}<p class="sub elapsed-line">总用时 <span id="elapsed">${formatTime(s.elapsed)}</span>${s.paused?' · 已暂停':''}</p></main>`;
}

function displayValue(){let s=session;if(!isTimed())return String(s.count);if(s.mode==='timer'&&s.countdown){let left=currentItem().target-Math.floor(s.setElapsed);return left>=0?formatTime(left):'+'+formatTime(-left)}return formatTime(s.setElapsed)}
function updateWorkoutNumbers(){if(!session||view!=='workout')return;let x=currentItem();if($('count')){const value=displayValue();$('count').textContent=value;$('count').classList.toggle('long-time',value.length>6)}if($('goal-status'))$('goal-status').textContent=goalText();if($('personal-best'))$('personal-best').textContent='单组纪录 '+(bestFor(x.name,x.unit)||'—')+' '+(isTimed()?'秒':'次');if($('set-clock'))$('set-clock').textContent=(isTimed()?'本组 ':'')+formatTime(session.setElapsed);if($('elapsed'))$('elapsed').textContent=formatTime(session.elapsed);let b=document.querySelector('[data-action=finishset]');if(b)b.disabled=valueNow()<1;}
function stopSensor(){stopProximity();stopMotion()}
function count(delta=1){if(!session||session.phase!=='work'||session.paused||isTimed())return;tick();let before=session.count;session.count=Math.max(0,Math.min(10000,before+delta));if(session.count===before)return;sound(delta>0?'up':'down');if(window.Native&&delta>0)Native.haptic();if(delta>0){checkRecord(currentItem(),session.count);signalGoal()}saveDraft();updateWorkoutNumbers()}
function signalGoal(){let s=session,x=currentItem();if(s.mode==='counter'||(s.mode==='timer'&&!s.countdown)||s.targetSignaled)return;if(valueNow()>=x.target){s.targetSignaled=true;sound('target');if(s.mode==='plan'&&s.index<s.items.length-1){enterRest();toast('本组完成，开始休息')}else toast('目标达成，继续训练也可以')}}

window.onSensorRep=()=>{if(sensorOn&&view==='workout'&&!$('modal').innerHTML)countInput('motion')};window.onSensorMessage=t=>{if($('sensor-status'))$('sensor-status').textContent=t};
window.onAppPause=()=>{if(session&&!session.paused)pause()};
function pause(){if(!session)return;if(session.paused&&data.plans.some(p=>p.id===session.planId&&p.paused)){toast('请先在计划详情里重新开始计划');return}stopSensor();if(!session.paused){tick();if(session.phase==='rest')session.remaining=restRemaining();session.paused=true}else{session.paused=false;session.lastTick=Date.now();if(session.phase==='rest')session.restEnd=Date.now()+(session.remaining||0)*1000;else if(session.mode==='plan'&&session.index<session.items.length-1&&valueNow()>=currentItem().target){session.targetSignaled=false;signalGoal()}}saveDraft();renderWorkout()}
function finishSet(){if(!session||session.phase!=='work'||valueNow()<1)return;let s=session,x=currentItem(),final=s.index===s.items.length-1;if(final){if(!s.paused)pause();dialog('结束并保存这次训练？','已达到目标也能继续。只有选择“结束并保存”才会停止本次计时计次。',`<div class="actions">${button('继续训练','continuework','secondary')}${button('结束并保存','confirmset')}</div>`);return}if(valueNow()<x.target){dialog('按实际完成量记录？','目标是参考，可以按当前实际次数记录本组。',`<div class="actions">${button('继续本组','close','secondary')}${button('记录 '+valueNow()+' 次','confirmset')}</div>`);return}commitSet()}
function currentResult(){let x=currentItem();return {...x,actual:valueNow(),duration:Math.floor(session.setElapsed)}}
function enterRest(){let s=session;if(!s||s.phase!=='work'||s.index===s.items.length-1)return;stopSensor();s.results.push(currentResult());let x=currentItem();s.paused=false;s.lastTick=Date.now();s.phase='rest';s.restEnd=Date.now()+x.rest*1000;s.remaining=x.rest;s.count=0;s.setElapsed=0;s.targetSignaled=false;close();saveDraft();renderWorkout()}
function commitSet(){if(!session)return;if(session.index<session.items.length-1&&data.plans.some(p=>p.id===session.planId&&p.paused)){toast('请先重新开始这个计划');return}const index=session.index;tick();if(session.phase!=='work'||session.index!==index)return;if(session.index===session.items.length-1){saveSession(true);return}enterRest()}
function saveSession(complete){let s=session;if(!s)return;tick();const sets=s.results.slice();if(s.phase==='work'&&valueNow()>0)sets.push(currentResult());if(!sets.length){toast('至少完成一次动作或一秒计时');return}const log={id:s.id,mode:s.mode,completed:complete,planId:s.planId,planTitle:s.planTitle,dayId:s.dayId,dayTitle:s.dayTitle,date:C.dateKey(new Date()),completedAt:new Date().toISOString(),duration:Math.floor(s.elapsed),activeDuration:Math.floor(C.activeTime({sets}).seconds),sets};if(!data.logs.some(l=>l.id===s.id))data.logs.push(log);if(!save()){data.logs=data.logs.filter(l=>l.id!==s.id);return}stopSensor();session=null;saveDraft();close();view=s.mode==='plan'?'detail':'tools';selected=s.planId;render();dialog(complete?'训练完成 ✓':'训练记录已保存',logSummary(log)+' · '+sets.length+' 组。'+(complete?'之后可以再练。':'已记录实际训练量，未完成的日程不打勾。'))}
function completeSession(){saveSession(true)}
function tick(){if(!session||session.paused)return;let s=session,now=Date.now(),delta=Math.max(0,(now-s.lastTick)/1000);s.elapsed+=delta;s.lastTick=now;if(s.phase==='work'){const beforeSecond=Math.floor(s.setElapsed||0);s.setElapsed=(s.setElapsed||0)+delta;if(isTimed()){if(s.mode==='single'&&Math.floor(s.setElapsed)>beforeSecond)sound('up');checkRecord(currentItem(),Math.min(86400,Math.floor(s.setElapsed)));signalGoal()}}if(view==='workout')updateWorkoutNumbers();if(s.phase==='rest'){let left=restRemaining();if($('rest-clock'))$('rest-clock').textContent=formatTime(left);if(left===0){nextSet();return}}}
function nextSet(){if(!session||session.phase!=='rest')return;if(data.plans.some(p=>p.id===session.planId&&p.paused)){toast('请先重新开始这个计划');return}session.index++;session.phase='work';session.count=0;session.setElapsed=0;session.paused=false;session.lastTick=Date.now();session.targetSignaled=false;stopSensor();saveDraft();sound('target');if(window.Native)Native.haptic();renderWorkout()}
function addRest(seconds){if(!session||session.phase!=='rest'||![15,30,60].includes(seconds))return;if(session.paused)session.remaining+=seconds;else session.restEnd+=seconds*1000;sound('up');saveDraft();renderWorkout()}
function exitWorkout(){if(!session)return;if(!session.paused)pause();let s=session,utility=['counter','timer'].includes(s.mode);dialog(utility?'关闭这个工具？':'结束这次训练？',utility?'可保留当前数字和用时，稍后继续；关闭会清空本次工具进度。':'可保存已完成的实际训练量，也可以保留进度稍后继续。',`<div class="actions">${button('继续','continuework','secondary')}${button('保留并返回','keep','secondary')}</div>${!utility&&(s.results.length||valueNow()>0)?'<div class="actions">'+button('结束并保存','savepartial')+'</div>':''}<div class="actions">${button(utility?'关闭工具':'放弃本次','discard','danger')}</div>`)}
function discardWorkout(){const utility=session?.mode!=='plan';stopSensor();session=null;saveDraft();close();view=utility?'tools':'plans';render()}
function installUpgradeHandlers(){
 installScheduleHandlers();installGeneratorHandlers();installPlanManagerHandlers();installReminderHandlers();
 Object.assign(handlers,{recordreset:b=>recordResetDialog(b.dataset.name||'俯卧撑',b.dataset.unit||'reps'),confirmrecordreset:confirmRecordReset});
 Object.assign(handlers,{count:inputCount,countarea:inputCount,pushupinput:()=>{stopSensor();data.settings.pushupProximity=!proximityMode();save();renderWorkout()},sound:toggleSound,opencounter:openCounter,opentimer:openTimer,opensingle:openSingle,resettool:resetUtility,confirmreset:()=>{close();session.count=0;session.elapsed=0;session.setElapsed=0;session.lastTick=Date.now();session.targetSignaled=false;sound('down');saveDraft();renderWorkout()},savepartial:()=>saveSession(session.mode==='single'||(session.phase==='work'&&session.index===session.items.length-1&&valueNow()>0)),continuework:()=>{close();if(session.paused)pause()},confirmset:()=>{close();commitSet()},skip:()=>{if(!session.paused)tick();nextSet()},sensor:()=>{if(!window.Native){toast('运动感应请在安卓 APK 中使用');return}if(session.paused){toast('先继续训练再开启感应');return}session.motionInputs=session.motionInputs||{};session.motionInputs[currentItem().name]=!sensorOn;session.motionUnavailable=false;stopMotion();saveDraft();renderWorkout()}});
 if(upgradedHandlers)return;upgradedHandlers=true;const previousRender=render;render=function(){previousRender();if(view!=='workout')stopSensor();if(view!=='workout'&&window.Native&&typeof Native.trainingMode==='function')Native.trainingMode(false);document.body.classList.toggle('full-tap-active',view==='workout'&&fullTap());if(view==='detail'&&(lastRenderedView!=='detail'||lastRenderedPlan!==selected)){const p=data.plans.find(p=>p.id===selected);if(p)scrollPlanDetail(p);}else if(view!==lastRenderedView)window.scrollTo(0,0);lastRenderedView=view;lastRenderedPlan=selected;};
}
setInterval(()=>{tick();if(session&&!session.paused)saveDraft()},1000);
document.addEventListener('visibilitychange',()=>{if(document.hidden)window.onAppPause()});
document.addEventListener('click',e=>{if(view!=='workout'||!fullTap()||$('modal').innerHTML)return;if(e.target.closest('button,input,select,textarea,a,[data-action],.no-count,#modal'))return;inputCount()});

// Count on contact rather than waiting for touch release/click. Ignore its later synthetic click.
document.addEventListener('pointerdown',e=>{
 if(view!=='workout'||!fullTap()||session.paused||$('modal').innerHTML||e.pointerType!=='touch'||!e.isPrimary||e.button!==0)return;
 if(e.target.closest('input,select,textarea,a,.no-count,#modal')||e.target.closest('button:not([data-action="count"])'))return;
 const now=performance.now();if(now-lastNoseTouch<350)return;
 lastNoseTouch=now;e.preventDefault();countInput('touch');
},{passive:false});
