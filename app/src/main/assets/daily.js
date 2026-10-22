(function(root){
'use strict';
const C=typeof module!=='undefined'&&module.exports?require('./core.js'):root.Core;
const homeMessages=`
每一次，都算数。
今天，也为自己动一动。
从一个动作开始。
把进步留在今天。
慢慢来，也在向前。
先开始，再慢慢做好。
今天的坚持，值得记录。
给身体一点时间。
动一动，让今天不同。
认真完成眼前这一组。
小小一步，也有分量。
不赶进度，稳稳前进。
做一点，总比等着好。
今天，也照顾好自己。
把计划变成一次行动。
一步一步，慢慢积累。
开始的这一刻，很好。
专注眼前的每一次。
休息好了，再出发。
每次练习，都有意义。
今天的你，也在努力。
给自己一个开始。
把坚持交给日常。
一点一点，靠近目标。
今天，也留一点进步。
完成多少，就记录多少。
先把这一组做好。
把注意力放回自己。
今天适合重新开始。
认真练，也认真休息。
别着急，进步有过程。
让行动成为习惯。
你可以从小目标开始。
今天的行动，由你决定。
少一点犹豫，多一点行动。
量力而行，踏实练习。
稳定，比匆忙更有力量。
给坚持一点耐心。
每一次开始，都值得。
把今天这一页写好。
累了，就好好休息。
练习，也可以很简单。
用行动回应自己的目标。
今天的积累，留给未来。
从容地完成这一组。
身体的感受，也要听见。
让运动成为今天的一部分。
今天，给自己一点时间。
把小事认真做好。
循着自己的步子向前。
不必完美，开始就好。
留一点余力，走得更稳。
今天也有新的机会。
一次练习，一份记录。
把目标放远，把动作做稳。
从这一组，继续向前。
耐心一点，再耐心一点。
照顾身体，也照顾心情。
今天的努力，有迹可循。
好好呼吸，慢慢完成。
给每一次练习一点专注。
进步，也藏在日常里。
做适合今天的训练。
再小的行动，也算开始。
把这一刻留给自己。
坚持，是许多次开始。
慢下来，也能走得稳。
计划可以调整，行动继续。
今天，也值得认真对待。
把想做的，变成做过的。
练好动作，再谈更多。
一组一组，积累起来。
每一份努力，都有位置。
给目标一点行动。
状态不同，认真相同。
把今天过得更有力量。
做好热身，从容开始。
休息也是计划的一部分。
进步不只看数字。
今天，专注做好一件事。
让每一次重复都有质量。
不和别人比，记录自己。
为自己留一段运动时间。
慢慢变成更熟练的自己。
一份计划，一次开始。
把节奏放稳，把动作做好。
每一天，都有不同的起点。
用耐心，换一份积累。
把努力放在能做到的地方。
今天能做的，认真去做。
让记录见证你的行动。
准备好了，就开始吧。
走到这里，已经有了积累。
今天，也可以重新出发。
找到适合自己的强度。
好好完成，也好好恢复。
把目光放在下一步。
一次专注，胜过匆忙。
给身体一个积极的回应。
从今天起，再添一份记录。
`.trim().split('\n').map(x=>x.trim());
const homeEnglishMessages=`
Every rep counts.
Make time to move.
Start with one rep.
Make progress today.
Slow is still forward.
Begin, then get better.
Keep a little promise.
Give your body time.
Move into a better day.
Focus on this set.
Small steps carry weight.
Steady steps add up.
A little is a start.
Take care of yourself.
Turn plans into action.
Build it one step at a time.
This is a good beginning.
Be here for every rep.
Rest, then return.
Every practice matters.
Your effort is here.
Give yourself a start.
Make showing up a habit.
Closer, little by little.
Leave room for progress.
Do it. Record it.
Give this set your focus.
Bring attention back to you.
Today is a fresh start.
Train well. Rest well.
Progress takes its time.
Make action a habit.
Start with a small goal.
Choose your next move.
Less waiting. More moving.
Find your own intensity.
Steady has its strength.
Be patient with practice.
Every start matters.
Make today a good page.
Rest when you need it.
Keep practice simple.
Put action behind your goal.
Build something for tomorrow.
Take this set in stride.
Listen to your body.
Make movement part of today.
Save a moment for yourself.
Do small things with care.
Move at your own pace.
Start before it is perfect.
Leave a little in reserve.
Today brings another chance.
One practice. One record.
Think ahead. Move with care.
Forward from this set.
A little more patience.
Care for body and mind.
Let your effort leave a trace.
Breathe. Move. Repeat.
Give each rep your attention.
Progress lives in the everyday.
Train for how you feel today.
A small action is a beginning.
Make this moment yours.
Consistency begins again.
Slow down. Stay steady.
Adjust the plan. Keep moving.
Give today your attention.
Turn someday into done.
Practice form before more.
Build it set by set.
Every effort has a place.
Give your goal some action.
Different days. Same care.
Bring strength into today.
Warm up. Ease in.
Rest belongs in the plan.
Progress is more than numbers.
Do one thing with focus.
Make every repetition count.
Track yourself, not others.
Keep a little time to move.
Practice makes it familiar.
One plan. One beginning.
Find your rhythm. Move well.
Each day has a starting point.
Let patience build progress.
Put effort where you can.
Do what today allows.
Let your record tell the story.
Ready when you are.
You have already begun.
Begin again today.
Find the effort that fits.
Finish well. Recover well.
Look toward the next step.
Focus over hurry.
Give your body something good.
Add one more day of practice.
`.trim().split('\n');
function dailyHome(date=C.dateKey(new Date())){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('日期无效');
 const [y,m,d]=date.split('-').map(Number),stamp=Date.UTC(y,m-1,d),day=Math.floor(stamp/86400000),index=((day*37+11)%homeMessages.length+homeMessages.length)%homeMessages.length;
 return {date,quote:homeMessages[index],english:homeEnglishMessages[index],dateLabel:m+'月'+d+'日 周'+['日','一','二','三','四','五','六'][new Date(stamp).getUTCDay()]};
}
Object.assign(C,{homeMessages,homeEnglishMessages,dailyHome});if(typeof module!=='undefined'&&module.exports)module.exports={homeMessages,homeEnglishMessages,dailyHome};
})(typeof window!=='undefined'?window:globalThis);
