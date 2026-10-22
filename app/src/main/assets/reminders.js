'use strict';
function reminderState(){try{if(window.Native&&typeof Native.reminderSettings==='function')return JSON.parse(Native.reminderSettings())}catch(e){}return {enabled:false,minute:540,allowed:false}}
function remindersPage(){const state=reminderState(),time=String(Math.floor(state.minute/60)).padStart(2,'0')+':'+String(state.minute%60).padStart(2,'0');return `<div class="top">${button('‹ 计划列表','back','icon')}<span class="tag">系统通知</span></div><h1>日程提醒</h1><p class="sub">今天有未暂停、尚未查看的训练计划时提醒。每天最多一条，点开查看后不再提醒。</p><div class="card section"><div class="row"><h3>训练日提醒</h3>${button(state.enabled?'已开启':'开启提醒','togglereminders',state.enabled?'primary':'secondary',`aria-pressed="${!!state.enabled}"`)}</div><label for="reminder-time">每天提醒时间</label><input type="time" id="reminder-time" value="${time}"><p class="sub">按手机本地时间。当天时间已过时，开启后会尝试补发今天的提醒。</p></div>${state.enabled&&!state.allowed?'<div class="note">系统通知尚未允许。'+button('打开通知设置','notificationsettings','link')+'</div>':''}<div class="actions">${button('发送测试通知','testreminder','secondary',!state.allowed?'disabled':'')}</div><p class="sub">手机省电、后台限制或强行停止应用可能延迟提醒；可在系统设置中允许循练通知和后台运行。</p>${!window.Native?'<p class="sub">系统提醒需要安卓安装版。</p>':''}`}
function installReminderHandlers(){Object.assign(handlers,{reminders:()=>{view='reminders';render()},togglereminders:()=>{if(!window.Native||typeof Native.configureReminders!=='function'){toast('系统提醒请在安卓安装版使用');return}const state=reminderState();Native.configureReminders(!state.enabled,state.minute)},notificationsettings:()=>{if(window.Native)Native.notificationSettings()},testreminder:()=>{if(window.Native)Native.testReminder()}})}
window.onRemindersChanged=()=>{if(view==='reminders')render()};
window.onReminderOpen=()=>{
 if(!window.Native||typeof Native.consumeReminderPlan!=='function')return;const id=Native.consumeReminderPlan();if(!id)return;
 if(session&&!session.paused)pause();close();
 if(id==='@plans'){view='plans';render();return}
 const p=data.plans.find(p=>p.id===id);if(!p){view='plans';render();return}selected=id;markPlanSeen(id);view='detail';render();
};
document.addEventListener('change',e=>{if(e.target.id!=='reminder-time'||!window.Native||typeof Native.configureReminders!=='function')return;const [h,m]=e.target.value.split(':').map(Number);if(!Number.isInteger(h)||!Number.isInteger(m))return;Native.configureReminders(reminderState().enabled,h*60+m)});
