const assert=require('node:assert/strict'),C=require('../app/src/main/assets/core.js');require('../app/src/main/assets/generator.js');
for(const p of C.catalog){
 const plan=C.generatePlan({exercise:p.name,current:p.current,goal:p.goal,weeks:12,frequency:3,rounds:4,startDate:'2026-10-22'});
 assert.equal(plan.days.length,36);assert(plan.note.includes('不能保证'));
 assert.equal(C.scheduleDate(plan,plan.days[0],0),'2026-10-22');assert.equal(C.scheduleDate(plan,plan.days[3],3),'2026-10-29');
 assert.equal(C.flatten(plan.days[0]).length,p.sides?8:4);assert(C.flatten(plan.days[0]).every(x=>x.unit===p.unit));
 if(p.sides)assert(plan.days[0].exercises[0].name.endsWith('（左）')&&plan.days[0].exercises[1].name.endsWith('（右）'));
 const parsed=C.parsePlan(C.serializePlan(plan));parsed.startDate=plan.startDate;
 assert.equal(C.scheduleDate(parsed,parsed.days[4],4),C.scheduleDate(plan,plan.days[4],4));
 assert.deepEqual(C.flatten(parsed.days[0]).map(x=>[x.name,x.unit,x.target,x.rest]),C.flatten(plan.days[0]).map(x=>[x.name,x.unit,x.target,x.rest]));
 C.validateBackup({version:1,plans:[plan],logs:[]});C.validateBackup({version:1,plans:[parsed],logs:[]});
 const d=plan.days.at(-1),sets=C.flatten(d);assert.equal(sets.at(-1).target,plan.generator.projected);assert(plan.generator.projected<=p.goal);
 assert.equal(plan.days[9].title.includes('减量'),true);assert(C.estimateDay(plan.days[0],[]).minutes>0);
}
const options={exercise:'深蹲',current:40,goal:100,weeks:12,frequency:3,rounds:5,startDate:'2026-10-22'};
const p=C.generatePlan(options);assert(p.generator.projected<100&&p.note.includes('多个周期'));
for(const frequency of [1,2,3]){const q=C.generatePlan({...options,frequency});assert.equal(q.days.length,12*frequency);for(let i=1;i<q.days.length;i++)assert(q.days[i].offsetDays-q.days[i-1].offsetDays>=2)}
for(const change of [{goal:40},{frequency:22},{weeks:0},{rounds:11},{startDate:'2026-02-30'},{exercise:'弓步蹲'}])assert.throws(()=>C.generatePlan({...options,...change}));
const q=C.generatePlan({...options,weeks:52});assert.equal(q.days.length,156);C.parsePlan(C.serializePlan(q));
assert.throws(()=>C.parsePlan('计划：错误\n第1天：测试\n平板支撑 | 60 | 90 | kg'));
console.log('PASS: all exercise profiles, sides, timed/reps roundtrip, offsets and spacing, deload, realistic projection, backup, boundaries and invalid inputs.');

for(const frequency of [4,7,8,14,21])for(const rounds of [1,4,10]){const q=C.generatePlan({...options,exercise:'侧平板',weeks:2,frequency,rounds});assert.equal(q.days.length,2*frequency);assert.equal(C.flatten(q.days[0]).length,rounds*2);const rt=C.parsePlan(C.serializePlan(q));assert.equal(rt.days.length,q.days.length);assert(q.days.every(d=>d.offsetDays>=0&&d.offsetDays<=13));if(frequency===21){for(let d=0;d<7;d++)assert.equal(q.days.filter(x=>x.offsetDays===d).length,3);assert(q.days[0].title.includes('当天第 1/3 次'))}}
const largest=C.generatePlan({...options,exercise:'保加利亚蹲',weeks:52,frequency:21,rounds:10});assert.equal(largest.days.length,1092);C.validateBackup({version:1,plans:[largest],logs:[]});assert.equal(C.parsePlan(C.serializePlan(largest)).days.length,1092);
console.log('PASS: 1–21 weekly sessions, 1–10 rounds, multi-session dates and titles, one-set rest, and 1092-session bilateral backup/text roundtrip.');
