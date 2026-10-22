'use strict';
let generatorDraft=null;
function creationModes(active){return `<div class="tabs creation-modes" aria-label="创建方式">${button('按目标生成','generator',active==='generator'?'selected':'')}${button('计划文本','generatortext',active==='editor'?'selected':'')}</div>`}
function generatorPage(){
 if(!generatorDraft)generatorDraft={exercise:'深蹲',current:40,goal:100,weeks:12,frequency:3,rounds:4,startDate:C.dateKey(new Date())};
 const o=generatorDraft,p=C.exerciseProfile(o.exercise),unit=p.unit,label=unit==='seconds'?'秒':'次';
 return `<div class="top">${button('‹ 计划列表','back','icon')}<span class="tag">新建计划</span></div>${creationModes('generator')}<h1>从现在，到目标。</h1><p class="sub">按运动项目安排组数、休息与减量周，预览后保存。</p><label for="gen-exercise">运动项目</label><select id="gen-exercise">${C.catalog.map(x=>`<option ${x.name===o.exercise?'selected':''}>${esc(x.name)}</option>`).join('')}</select><p class="sub">${esc(p.hint||'填写当前连续标准完成量，而不是一天的累计数量。')}${p.sides?'每侧分别记录。':''}</p><div class="generator-grid"><div><label>当前能力${p.sides?'（较弱侧）':''} · ${label}</label>${valueField('gen-current',o.current,unit,1,unit==='seconds'?86400:10000,'当前能力')}</div><div><label>目标能力 · ${label}</label>${valueField('gen-goal',o.goal,unit,1,unit==='seconds'?86400:10000,'目标能力')}</div><div><label>安排多少周</label>${valueField('gen-weeks',o.weeks,'weeks',1,52,'计划周数')}</div><div><label>每周训练几次</label>${valueField('gen-frequency',o.frequency,'sessions',1,21,'每周训练次数')}</div><div><label>每次${p.sides?'几轮':'几组'}</label>${valueField('gen-rounds',o.rounds,p.sides?'rounds':'sets',1,10,'每次组数')}</div><div><label for="gen-start">开始日期</label><input type="date" id="gen-start" value="${o.startDate}"></div></div><p class="sub">${p.sides?'每轮左右各一组。':''}每周超过7次时，按一天多次排期并标明次序；频次或组数增加时，单组目标会相应调低。周数是安排周期，不保证到期达标。</p><div class="actions">${button('计算并预览日程','generatepreview')}</div>`;
}
function generatorPreview(){try{
 const p=C.generatePlan(generatorDraft);prepared=p;
 $('modal').innerHTML=`<div class="overlay"><div class="dialog" role="dialog" aria-modal="true" aria-label="生成计划预览"><h2>${esc(p.title)}</h2><p>${p.days.length} 次训练 · 起始 ${p.startDate}</p><p class="sub">${esc(p.note)}</p><div class="preview">${p.days.map((d,i)=>`<p>${C.scheduleDate(p,d,i)} · ${esc(d.title)}<br><small>${d.exercises.map(e=>esc(e.name)+' '+e.sets.join(' / ')+(e.unit==='seconds'?' 秒':' 次')+' · 休息 '+e.rest.join(' / ')+' 秒').join('<br>')} · 预计 ${C.estimateDay(d,data.logs).minutes} 分钟</small></p>`).join('')}</div><div class="actions">${button('返回修改','close','secondary')}${button('保存为新计划','saveplan')}</div></div></div>`;
}catch(e){toast(e.message)}}
function installGeneratorHandlers(){Object.assign(handlers,{generator:()=>{if(view==='editor'){editing=$('plantext').value;editorStart=$('editor-date').value}view='generator';render()},generatortext:()=>{view='editor';render()},generatepreview:generatorPreview})}
document.addEventListener('change',e=>{
 if(!generatorDraft)return;
 if(e.target.id==='gen-exercise'){const p=C.exerciseProfile(e.target.value);generatorDraft.exercise=p.name;generatorDraft.current=p.current;generatorDraft.goal=p.goal;render();return}
 const keys={'gen-current':'current','gen-goal':'goal','gen-weeks':'weeks','gen-frequency':'frequency','gen-rounds':'rounds','gen-start':'startDate'},key=keys[e.target.id];if(key)generatorDraft[key]=key==='startDate'?e.target.value:Number(e.target.value);
});
