'use strict';
// Local exercise atlas; each figure is cropped and centered independently.
function planExerciseIcon(p,today){
 const names=new Set(p.days.flatMap(d=>d.exercises.map(e=>C.exerciseProfile(e.name)?.name||e.name.replace(/[（(](左|右)[）)]$/,''))));
 const name=names.size===1?[...names][0]:'组合训练';
 const crops={
  '俯卧撑':[65,142,361,317],'仰卧起坐':[444,176,704,313],'深蹲':[805,125,982,314],
  '平板支撑':[1068,205,1372,316],'侧平板':[1434,83,1716,315],'臀桥':[57,604,346,719],
  '靠墙静蹲':[477,474,606,719],'保加利亚蹲':[752,494,994,720],'提踵':[1188,459,1246,727],
  '飞鸟式':[1374,582,1742,728]
 };
 const bounds=crops[name];let body;
 if(bounds){
  const [x,y,right,bottom]=bounds,scale=44/Math.max(right-x,bottom-y),source='exercise-icons.png';
  body=`<span class="plan-icon-crop" style="width:${(right-x)*scale}px;height:${(bottom-y)*scale}px"><img src="${source}" alt="" draggable="false" style="width:${1774*scale}px;height:${887*scale}px;left:${-x*scale}px;top:${-y*scale}px"></span>`;
 }else body='<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="7" y="7" width="13" height="13" rx="3"/><rect x="28" y="7" width="13" height="13" rx="3"/><rect x="7" y="28" width="13" height="13" rx="3"/><path d="M29 34h12m-6-6v12"/></svg>';
 return `<span class="plan-exercise-icon" data-exercise="${esc(name)}" aria-hidden="true">${body}${today?.scheduled&&data.settings.planSeen?.[p.id]!==today.date?'<i class="today-plan-badge" title="今天有日程，尚未查看"></i>':''}</span>`;
}
let planManaging=false;
function renderPlanListInPlace(){const y=window.scrollY;render();window.scrollTo(0,y)}

function planCard(p){
 const state=C.planOverview(p,data.logs),today=C.planTodayState(p,data.logs),date=p.paused?'已暂停':state.nextIndex<0?'可再次训练':state.nextDate?'下次运动 '+state.nextDate:'下次运动 待排期';
 const tag=planManaging?'div':'button';
 const controls=`<div class="plan-inline-actions" ${planManaging?'':'aria-hidden="true"'}>${button(p.paused?'恢复':'暂停','managerpause','icon',`data-id="${esc(p.id)}" ${planManaging?'':'tabindex="-1"'}`)}${button('删除','managerdelete','icon danger-text',`data-id="${esc(p.id)}" ${planManaging?'':'tabindex="-1"'}`)}</div>`;
 return `<div class="card plan-card ${planManaging?'plan-managing':''} ${p.paused?'plan-paused':''}" data-paused="${!!p.paused}" ${planManaging?'':'data-action="plan"'} data-id="${esc(p.id)}">${controls}<${tag} class="plan-card-front" ${planManaging?'':'data-action="plan"'} data-id="${esc(p.id)}" aria-label="${esc(p.title)}，${state.completed}/${p.days.length}${today.scheduled&&data.settings.planSeen?.[p.id]!==today.date?'，今天有日程尚未查看':''}">${planExerciseIcon(p,today)}<div class="plan-card-body"><h3>${esc(p.title)}</h3><div class="progress"><i style="width:${state.completed/p.days.length*100}%"></i></div><div class="plan-meta"><small>${state.completed}/${p.days.length}</small><small>${date}</small></div></div></${tag}></div>`;
}

function orderedPlans(plans=data.plans){return [...plans.filter(p=>!p.paused),...plans.filter(p=>p.paused)]}
function togglePlanPause(id=selected){
 const p=data.plans.find(p=>p.id===id);if(!p)return;
 const oldPaused=p.paused,oldOrder=data.plans.slice();p.paused=!p.paused;data.plans=orderedPlans();
 if(!save()){if(oldPaused===undefined)delete p.paused;else p.paused=oldPaused;data.plans=oldOrder;return}
 const returnView=view;if(p.paused&&session?.planId===p.id&&!session.paused){pause();view=returnView}
 if(!p.paused&&view==='detail')markPlanSeen(p.id);
 renderPlanListInPlace();toast(p.paused?'计划已暂停，已移到列表末尾':'计划已恢复，完成记录保留');
}
let planEditId=null;
function installPlanManagerHandlers(){Object.assign(handlers,{
 planmanageend:()=>{planManaging=false;renderPlanListInPlace()},
 managerpause:b=>togglePlanPause(b.dataset.id),
 managerdelete:b=>{planEditId=b.dataset.id;dialog('删除这个计划？','训练历史和运动纪录会保留。',`<div class="actions">${button('取消','close','secondary')}${button('确认删除','confirmmanagerdelete','danger')}</div>`)},
 confirmmanagerdelete:()=>{const old=data.plans;data.plans=data.plans.filter(p=>p.id!==planEditId);if(!save()){data.plans=old;return}close();renderPlanListInPlace()}
})}
function markPlanSeen(id){
 const p=data.plans.find(p=>p.id===id);if(!p)return;
 const today=C.planTodayState(p,data.logs);if(!today.scheduled)return;
 const before=data.settings.planSeen;data.settings.planSeen={...(before&&typeof before==='object'?before:{}),[id]:today.date};
 if(!save()){if(before===undefined)delete data.settings.planSeen;else data.settings.planSeen=before}
}
function scrollPlanDetail(p){
 const state=C.planOverview(p,data.logs),target=p.days[state.nextIndex<0?p.days.length-1:state.nextIndex];
 requestAnimationFrame(()=>{
  if(view!=='detail'||selected!==p.id)return;
  const cards=[...document.querySelectorAll('.day')],recommended=cards.find(e=>e.dataset.dayId===target?.id);
  if(recommended)recommended.classList.add('recommended');
  const anchor=cards[state.anchorIndex];
  if(anchor)anchor.scrollIntoView({block:'start',behavior:'instant'});
 });
}
let planDrag=null,planClickBlockedUntil=0;
const planReducedMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function cancelPlanCandidate(){if(!planDrag||planDrag.active)return;clearTimeout(planDrag.timer);planDrag=null}
function startPlanDrag(card,x,y){
 if(view!=='plans'||$('modal').innerHTML||planDrag)return;
 const d=planDrag={card,list:card.parentElement,startX:x,startY:y,x,y,active:false};
 d.timer=setTimeout(()=>{
  if(planDrag!==d||!card.isConnected||view!=='plans')return;
  // Preserve the original touched node until release, including on Android WebView.
  const box=card.getBoundingClientRect();
  planManaging=true;d.list.classList.add('plan-management-active');
  const tools=document.querySelector('.plan-list-tools');if(tools)tools.innerHTML=button('完成','planmanageend','link');
  d.active=true;planClickBlockedUntil=Date.now()+600;d.original=data.plans.slice();d.offset=y-box.top;d.drawY=box.top;
  d.placeholder=document.createElement('div');d.placeholder.className='plan-placeholder';d.placeholder.style.height=box.height+'px';card.before(d.placeholder);
  d.width=box.width;d.left=box.left;card.classList.add('plan-dragging');document.body.classList.add('sorting-plans');
  Object.assign(card.style,{width:box.width+'px',height:box.height+'px',left:box.left+'px',top:'0px',transform:`translate3d(0,${d.drawY}px,0)`});
  if(window.Native&&typeof Native.haptic==='function')Native.haptic();
  dragPlanFrame();
 },450);
}
function animatePlanReflow(cards,before){
 for(const card of cards){
  const old=before.get(card);card.getAnimations().forEach(a=>a.cancel());
  const next=card.getBoundingClientRect(),dx=old.left-next.left,dy=old.top-next.top;
  if(!planReducedMotion()&&(Math.abs(dx)>.5||Math.abs(dy)>.5))card.animate([{transform:`translate3d(${dx}px,${dy}px,0)`},{transform:'translate3d(0,0,0)'}],{duration:180,easing:'cubic-bezier(.2,.7,.2,1)'});
 }
}
function placePlanPlaceholder(d){
 const list=d.list;if(!d.placeholder.isConnected)return;
 const all=[...list.querySelectorAll('.plan-card:not(.plan-dragging)')],group=all.filter(card=>card.dataset.paused===d.card.dataset.paused);
 // Use layout positions so an ongoing FLIP animation cannot move a reorder threshold.
 const listTop=list.getBoundingClientRect().top;
 const before=group.find(card=>d.y<listTop+card.offsetTop+card.offsetHeight/2);
 const destination=before||(!d.card.classList.contains('plan-paused')?all.find(card=>card.dataset.paused==='true'):null)||null;
 let next=d.placeholder.nextElementSibling;if(next===d.card)next=next.nextElementSibling;
 if(next===destination)return;
 const bounds=new Map(all.map(card=>[card,card.getBoundingClientRect()]));
 list.insertBefore(d.placeholder,destination);animatePlanReflow(all,bounds);
}
function dragPlanFrame(now=performance.now()){
 const d=planDrag;if(!d?.active||d.dropping)return;
 if(view!=='plans'||!d.card.isConnected){endPlanDrag(true);return}
 d.drawY=d.y-d.offset;d.card.style.transform=`translate3d(0,${d.drawY}px,0)`;
 const dt=Math.min(32,Math.max(1,now-(d.lastFrame||now-16.7)));d.lastFrame=now;
 const bottom=window.innerHeight-110,speed=d.y<90?-Math.min(12,(90-d.y)/5):d.y>bottom?Math.min(12,(d.y-bottom)/5):0;
 if(speed)window.scrollBy(0,speed*dt/16.7);
 placePlanPlaceholder(d);d.frame=requestAnimationFrame(dragPlanFrame);
}
function movePlanDrag(x,y){
 const d=planDrag;if(!d||d.dropping)return;
 if(!d.active&&Math.hypot(x-d.startX,y-d.startY)>9){cancelPlanCandidate();return}
 d.x=x;d.y=y;
}
function endPlanDrag(cancel=false){
 const d=planDrag;if(!d||d.dropping)return;clearTimeout(d.timer);
 if(!d.active){planDrag=null;return}
 d.dropping=true;cancelAnimationFrame(d.frame);planClickBlockedUntil=Date.now()+600;
 const destination=d.placeholder.getBoundingClientRect().top;
 d.placeholder.before(d.card);
 if(!cancel){const ids=[...d.list.querySelectorAll('.plan-card')].map(e=>e.dataset.id);data.plans=orderedPlans(ids.map(id=>d.original.find(p=>p.id===id)));if(!save()){data.plans=d.original;cancel=true}}
 if(cancel)data.plans=d.original;
 const finish=()=>{
  if(planDrag!==d)return;
  d.list.querySelectorAll('.plan-card').forEach(card=>card.getAnimations().forEach(a=>a.cancel()));
  d.placeholder.remove();d.card.classList.remove('plan-dragging');d.card.removeAttribute('style');document.body.classList.remove('sorting-plans');planDrag=null;renderPlanListInPlace();
 };
 if(cancel||planReducedMotion()||Math.abs(destination-d.drawY)<1){finish();return}
 const landing=d.card.animate([{transform:`translate3d(0,${d.drawY}px,0)`},{transform:`translate3d(0,${destination}px,0)`}],{duration:150,easing:'cubic-bezier(.2,.7,.2,1)',fill:'forwards'});
 landing.finished.then(finish,finish);
}

function planTouch(e){return e.touches?.[0]||e.changedTouches?.[0]}
document.addEventListener('touchstart',e=>{const card=e.target.closest('.plan-card');if(e.target.closest('.plan-inline-actions'))return;if(card&&e.touches.length===1){const t=planTouch(e);startPlanDrag(card,t.clientX,t.clientY)}else if(planDrag)endPlanDrag(true)},{passive:true});
document.addEventListener('touchmove',e=>{if(!planDrag)return;if(e.touches.length!==1){endPlanDrag(true);return}const t=planTouch(e);movePlanDrag(t.clientX,t.clientY);if(planDrag?.active)e.preventDefault()},{passive:false});
document.addEventListener('touchend',e=>{if(planDrag?.active)e.preventDefault();endPlanDrag()},{passive:false});
document.addEventListener('touchcancel',()=>endPlanDrag(true));
document.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.button!==0)return;const card=e.target.closest('.plan-card');if(card&&!e.target.closest('.plan-inline-actions'))startPlanDrag(card,e.clientX,e.clientY)});
document.addEventListener('pointermove',e=>{if(e.pointerType!=='touch')movePlanDrag(e.clientX,e.clientY)});
document.addEventListener('pointerup',e=>{if(e.pointerType!=='touch')endPlanDrag()});
document.addEventListener('pointercancel',e=>{if(e.pointerType!=='touch')endPlanDrag(true)});
document.addEventListener('contextmenu',e=>{if(e.target.closest('.plan-card'))e.preventDefault()});
document.addEventListener('click',e=>{if(e.target.closest('.plan-card')&&!e.target.closest('.plan-inline-actions')&&(planDrag?.active||Date.now()<planClickBlockedUntil)){e.preventDefault();e.stopImmediatePropagation()}},true);
window.addEventListener('blur',()=>endPlanDrag(true));
document.addEventListener('visibilitychange',()=>{if(document.hidden)endPlanDrag(true)});
