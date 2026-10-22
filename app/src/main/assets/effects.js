'use strict';
let audioContext=null,glassTimer=null;
function initializeUpgrade(){
 data.settings=data.settings||{};data.settings.sound=true;
 data.bests=Array.isArray(data.bests)?data.bests:[];
 for(const log of data.logs)for(const set of log.sets){const unit=set.unit||'reps';let b=data.bests.find(b=>b.name===set.name&&b.unit===unit);if(!b){data.bests.push({name:set.name,unit,best:set.actual,date:log.date})}else if((!b.resetAt||Date.parse(log.completedAt||log.date+'T00:00:00')>Date.parse(b.resetAt))&&set.actual>b.best){b.best=set.actual;b.date=log.date}}
 normalizeSession();installUpgradeHandlers();if(!window.storageFault)save();
}
function bestFor(name,unit='reps'){return data.bests.find(b=>b.name===name&&b.unit===unit)?.best||0}
function sound(type='up'){
 if(!data.settings.sound)return;
 if(window.Native&&typeof Native.sound==='function'){Native.sound(({up:0,down:1,glass:2,target:3})[type]||0);return}
 try{audioContext=audioContext||new(window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume();const ctx=audioContext,t=ctx.currentTime;
 if(type==='glass'){let n=Math.floor(ctx.sampleRate*.45),buffer=ctx.createBuffer(1,n,ctx.sampleRate),a=buffer.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*Math.exp(-i/n*7)*.26;let source=ctx.createBufferSource(),filter=ctx.createBiquadFilter();source.buffer=buffer;filter.type='highpass';filter.frequency.value=2400;source.connect(filter);filter.connect(ctx.destination);source.start();for(let f of [2600,4100,5700]){let o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(.055,t);g.gain.exponentialRampToValueAtTime(.0001,t+.38);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+.4)}}else{let o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=type==='down'?440:type==='target'?1320:880;g.gain.setValueAtTime(.13,t);g.gain.exponentialRampToValueAtTime(.001,t+.07);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+.08)}}catch(e){}
}
function soundIcon(muted){return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>${muted?'<path d="M3 3l18 18" stroke="#1b2220" stroke-width="4"/><path d="M3 3l18 18"/>':''}</svg>`}
function soundButton(){return ''}
function toggleSound(){let old=data.settings.sound;data.settings.sound=!old;if(!save()){data.settings.sound=old;return}for(const b of document.querySelectorAll('.sound-toggle')){let label=data.settings.sound?'关闭声音':'开启声音';b.innerHTML=soundIcon(!data.settings.sound);b.setAttribute('aria-pressed',data.settings.sound);b.setAttribute('aria-label',label);b.setAttribute('title',label)}if(data.settings.sound)sound()}
function recordBaseline(){const out={};for(const x of session.items)out[x.unit+':'+x.name]=bestFor(x.name,x.unit);return out}
function checkRecord(x,value){
 if(!session||!['plan','single'].includes(session.mode)||value<1)return false;
 let best=data.bests.find(b=>b.name===x.name&&b.unit===x.unit);const old=best?.best||0;
 if(value<=old)return false;
 if(!best){best={name:x.name,unit:x.unit,best:value,date:C.dateKey(new Date())};data.bests.push(best)}else{best.best=value;best.date=C.dateKey(new Date())}
 if(!save()){if(old)best.best=old;else data.bests=data.bests.filter(b=>b!==best);return false}
 const baseline=session.recordBaselines?.[x.unit+':'+x.name]||0;
 if(baseline>0){sound('glass');shatter(x.name,value,x.unit);return true}return false;
}
function shatter(name,value,unit){
 let overlay=document.getElementById('glass-effect');if(!overlay){overlay=document.createElement('div');overlay.id='glass-effect';overlay.setAttribute('aria-hidden','true');document.body.appendChild(overlay)}
 let paths='';for(let i=0;i<13;i++){let a=i*Math.PI*2/13,r=85+(i%3)*8,x=50+Math.cos(a)*r,y=46+Math.sin(a)*r;let mx=50+Math.cos(a+.07)*r*.38,my=46+Math.sin(a+.07)*r*.38;paths+=`<path d="M50 46 L${mx} ${my} L${x} ${y}"/><path d="M${mx} ${my} l${Math.cos(a+1.1)*15} ${Math.sin(a+1.1)*15}"/>`}
 overlay.innerHTML=`<svg viewBox="0 0 100 100" preserveAspectRatio="none">${paths}<path d="M32 44L39 28L56 25L68 42L65 59L46 66L32 44 M39 28L50 46L65 59 M32 44L50 46L56 25 M50 46L46 66"/></svg><div class="record-burst">新纪录 <b>${value}</b><span>${unit==='seconds'?'秒':'次'}</span></div>`;
 overlay.classList.remove('shattering');void overlay.offsetWidth;overlay.classList.add('shattering');clearTimeout(glassTimer);glassTimer=setTimeout(()=>overlay.classList.remove('shattering'),650);
}
function logSummary(log){let reps=C.sumReps(log),seconds=log.sets.reduce((n,s)=>n+(s.unit==='seconds'?s.actual:0),0);return [reps?reps+' 次动作':'',seconds?seconds+' 秒计时':''].filter(Boolean).join(' · ')||'0 次动作'}
