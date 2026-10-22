(function(root){
'use strict';
const C=typeof module!=='undefined'&&module.exports?require('./core.js'):root.Core;
const catalog=[
 {name:'俯卧撑',unit:'reps',current:50,goal:100,ratio:.46,rate:.06,rest:120},
 {name:'仰卧起坐',unit:'reps',current:25,goal:50,ratio:.45,rate:.06,rest:90},
 {name:'深蹲',unit:'reps',current:40,goal:100,ratio:.45,rate:.06,rest:120},
 {name:'平板支撑',unit:'seconds',current:60,goal:120,ratio:.5,rate:.08,rest:90},
 {name:'侧平板',unit:'seconds',current:30,goal:60,ratio:.5,rate:.06,rest:60,sides:true,hint:'当前能力和目标均按较弱一侧填写，左右侧分别计时。'},
 {name:'臀桥',unit:'reps',current:20,goal:40,ratio:.5,rate:.05,rest:90},
 {name:'靠墙静蹲',unit:'seconds',current:45,goal:90,ratio:.5,rate:.06,rest:90},
 {name:'保加利亚蹲',unit:'reps',current:12,goal:20,ratio:.5,rate:.04,rest:120,sides:true,hint:'默认徒手；当前能力和目标按较弱一侧填写。每轮左、右各一组。'},
 {name:'提踵',unit:'reps',current:25,goal:50,ratio:.55,rate:.05,rest:60,hint:'默认双脚提踵，完整抬起再落下算一次。'},
 {name:'飞鸟式',unit:'reps',current:10,goal:20,ratio:.5,rate:.04,rest:60,sides:true,hint:'此处指鸟狗式：四点跪姿，对侧手脚伸展后收回算一次；左右分别计数，并非哑铃飞鸟。'}
];
function exerciseProfile(name){return catalog.find(x=>x.name===name)||catalog.find(x=>name.startsWith(x.name+'（'))}
function generatePlan(o){
 const p=catalog.find(x=>x.name===o.exercise);if(!p)throw Error('请选择支持的运动项目');
 const max=p.unit==='seconds'?86400:10000;
 for(const k of ['current','goal','weeks','frequency','rounds'])if(!Number.isInteger(o[k]))throw Error('所有数值必须是整数');
 if(o.current<1||o.goal<=o.current||o.goal>max)throw Error('目标需大于当前能力，且在可用范围内');
 if(o.weeks<1||o.weeks>52||o.frequency<1||o.frequency>21||o.rounds<1||o.rounds>10)throw Error('请选择1～52周、每周1～21次、每次1～10组');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(o.startDate)||C.dateKey(new Date(o.startDate+'T12:00:00'))!==o.startDate)throw Error('请选择有效开始日期');
 const offsets={1:[0],2:[0,3],3:[0,2,4]}[o.frequency]||Array.from({length:o.frequency},(_,i)=>Math.floor(i*7/o.frequency)),days=[];
 const volumeScale=Math.min(1,3/o.frequency)*Math.min(1,4/o.rounds);
 const projected=Math.min(o.goal,Math.max(o.current,Math.floor(o.current*Math.pow(1+p.rate,o.weeks-1))));
 const unit=p.unit==='seconds'?'秒':'次';
 for(let w=0;w<o.weeks;w++)for(let j=0;j<o.frequency;j++){
  const final=w===o.weeks-1&&j===o.frequency-1,deload=!final&&(w+1)%4===0;
  const basis=Math.min(o.goal,Math.floor(o.current*Math.pow(1+p.rate,w)));
  const light=(o.frequency===3&&j===1)||(o.frequency>3&&j%3!==0),multiplier=deload?.65:light?.75:1;
  const type=final?'阶段复测':deload?'减量训练':light?'轻训练':j===o.frequency-1&&o.frequency>1?'长组训练':'容量训练';
  const values=Array.from({length:o.rounds},(_,i)=>{
   if(final)return i===o.rounds-1?projected:Math.max(1,Math.round(o.current*.15));
   const ratio=type==='长组训练'&&i===0?.7:p.ratio;
   return Math.max(1,Math.round(basis*ratio*multiplier*volumeScale));
  });
  const exercises=[];
  if(p.sides){for(let i=0;i<o.rounds;i++)for(const side of ['左','右'])exercises.push({name:p.name+'（'+side+'）',unit:p.unit,sets:[values[i]],rest:[side==='左'?30:final&&i===o.rounds-2?180:p.rest]})}
  else exercises.push({name:p.name,unit:p.unit,sets:values,rest:o.rounds===1?[p.rest]:values.slice(0,-1).map((_,i)=>final&&i===o.rounds-2?180:p.rest+(i>=2?30:0))});
  const dayTotal=offsets.filter(x=>x===offsets[j]).length,sessionNo=offsets.slice(0,j+1).filter(x=>x===offsets[j]).length;
  days.push({id:C.uid(),title:'第 '+(w+1)+' 周 · '+type+(dayTotal>1?' · 当天第 '+sessionNo+'/'+dayTotal+' 次':''),offsetDays:w*7+offsets[j],exercises});
 }
 const note='按当前连续标准完成 '+o.current+unit+'、目标 '+o.goal+unit+' 编排；'+o.weeks+'周，每周'+o.frequency+'次，每次'+o.rounds+(p.sides?'轮，左右各一组':'组')+'。'+(o.frequency>3||o.rounds>4?'频次或组数增加时，单组目标已相应调低。':'')+(p.hint||'')+'每4周减量，最后一次复测。保留约2～3次余力；姿势变形就结束，完成吃力可降量或重复本周。复测末组可继续，按实际保存。周数是安排周期，不能保证到期达标。'+(projected<o.goal?'按受控增长，本周期复测参考为'+projected+unit+'，目标可能需要多个周期。':'')+'各项目的递增比例是应用编排规则，不是预测个人进步的医学公式。';
 return {id:C.uid(),title:p.name+' · '+o.current+'→'+o.goal+unit+'（'+o.weeks+'周）',createdAt:new Date().toISOString(),startDate:o.startDate,days,note,generator:{...o,projected}};
}
Object.assign(C,{catalog,exerciseProfile,generatePlan});if(typeof module!=='undefined'&&module.exports)module.exports={catalog,exerciseProfile,generatePlan};
})(typeof window!=='undefined'?window:globalThis);
