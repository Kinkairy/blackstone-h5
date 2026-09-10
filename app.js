(() => {
'use strict';
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const formatGold=n=>Math.round(n).toLocaleString('zh-CN');
const nowText=(state)=>`${state.season} ${state.day}日 · ${String(state.hour).padStart(2,'0')}:${String(state.minute).padStart(2,'0')}`;

const state={
  year:6,season:'秋季',day:18,hour:9,minute:20,speed:1,
  population:1284,treasury:2870,food:74,order:68,prestige:62,commerce:71,taxToday:42,tradeTax:6,tavernTax:8,
  feedSeq:0,currentEvent:0,currentNpc:'darien',questFilter:'all',murderResolved:false
};

const events=[
  {type:'商会请愿',seal:'⚖',title:'南部商路连续遭袭',body:'南部商路连续三周遭到豺狼人袭击。商会希望领主发布 300 金币的清剿悬赏。',effects:['商路安全 ↓','商人信心 ↓'],left:'暂不处理',right:'发布悬赏',leftFx:{order:-2,prestige:-1},rightFx:{treasury:-300,prestige:3,order:1},leftLog:'领主拒绝为南部商路追加悬赏，商会表示失望。',rightLog:'「清理南部商路」悬赏已张贴，300 金币进入任务保证金。',rightQuest:'south'},
  {type:'神殿请求',seal:'✥',title:'墓园出现异常灵火',body:'守墓人连续三夜看见蓝色灵火。晨曦神殿要求拨款 180 金币，请牧师与游荡者调查墓地。',effects:['死灵传闻 ↑','居民不安 ↑'],left:'封锁墓园',right:'批准调查',leftFx:{order:1,prestige:-1},rightFx:{treasury:-180,order:2,prestige:2},leftLog:'墓园被临时封锁，居民开始议论领主是否在隐瞒什么。',rightLog:'「调查墓园异动」悬赏获得领主批准。',rightQuest:'grave'},
  {type:'领主裁决',seal:'⚔',title:'黑鹿酒馆命案',body:'商人布兰死于昨夜斗殴。证人称布兰先拔出匕首，战士达里安随后将其杀死。商会要求严惩，冒险者公会主张正当防卫。',effects:['商会关注','冒险者公会关注'],left:'监禁达里安',right:'判定正当防卫',leftFx:{order:4,prestige:1},rightFx:{order:-2,prestige:2},leftLog:'达里安被判监禁一年。银狐冒险团对此极为不满。',rightLog:'达里安被判正当防卫并获释。商会公开抗议领主裁决。',special:'murder'},
  {type:'边境事务',seal:'♜',title:'河谷难民抵达城门',body:'37 名来自东部战乱地区的难民请求进入黑石镇。他们中有农夫、木匠，也可能混有逃兵。',effects:['劳动力 ↑','粮食压力 ↑'],left:'关闭城门',right:'允许入城',leftFx:{order:1,prestige:-2},rightFx:{population:37,food:-2,prestige:3},leftLog:'城门对东部难民关闭，37 人转向北方。',rightLog:'37 名难民获准进入黑石镇，劳动力增加。'},
  {type:'经济议案',seal:'◉',title:'铁矿价格持续上涨',body:'灰锤铁匠铺报告铁矿库存见底。商会建议补贴一支远途矿石商队，避免武器价格继续上涨。',effects:['武器价格 ↑','铁匠产能 ↓'],left:'让市场自行调节',right:'补贴商队 140 金币',leftFx:{commerce:-2},rightFx:{treasury:-140,commerce:2,prestige:1},leftLog:'领主拒绝补贴矿石进口，铁制品价格继续上涨。',rightLog:'一支矿石商队获得补贴，预计三日后抵达黑石镇。'}
];

const quests=[
  {id:'south',type:'combat',icon:'⚔',title:'清理南部商路',reward:300,risk:'中高',days:7,status:'招募中',statusClass:'',views:18,interested:5,rejected:10,joined:3,reasons:'奖励尚可 / 风险偏高',progress:22},
  {id:'mine',type:'explore',icon:'⛏',title:'勘探北部矿区',reward:120,risk:'中',days:30,status:'无人接取',statusClass:'empty',views:12,interested:3,rejected:9,joined:0,reasons:'奖励不足 / 缺少队友',progress:0},
  {id:'child',type:'investigate',icon:'✦',title:'寻找失踪儿童',reward:80,risk:'低',days:3,status:'进行中',statusClass:'running',views:9,interested:4,rejected:2,joined:1,reasons:'执行者：艾琳',progress:64},
  {id:'grave',type:'investigate',icon:'✥',title:'调查墓园异动',reward:220,risk:'高',days:10,status:'新发布',statusClass:'new',views:4,interested:1,rejected:1,joined:0,reasons:'建议职业：牧师 / 游荡者',progress:3}
];

const shops=[
  {id:'tavern',icon:'🍺',name:'黑鹿酒馆',owner:'赫伯特',customers:37,revenue:126,tax:8,detail:'今晚座位几乎坐满'},
  {id:'smith',icon:'⚒',name:'灰锤铁匠铺',owner:'奥兰多',customers:11,revenue:94,tax:6,detail:'库存紧缺：铁矿'},
  {id:'potion',icon:'⚗',name:'月桂药剂店',owner:'赛琳娜',customers:0,revenue:17,tax:1,detail:'今日客流冷清'},
  {id:'merchant',icon:'💰',name:'洛伦商行',owner:'费伦',customers:18,revenue:171,tax:10,detail:'两支外地商队已抵达'}
];

const npcs={
  darien:{name:'达里安·霍克',short:'达里安',meta:'人类 · 战士 · 32岁',group:'银狐冒险团',current:'在黑鹿酒馆喝酒',gold:146,health:'良好',mood:'烦躁',portrait:'assets/darien_portrait.webp',attrs:[['战斗',62,'blue'],['忠诚',44,'gold'],['勇气',76,'green'],['贪婪',32,'purple']],thoughts:['“我需要一副更好的盔甲。”','“布兰那个混蛋最好别让我再碰见。”','“最近的任务报酬越来越差。”'],relations:[['莱莎',72],['格鲁姆',31],['布兰',-86],['领主',44]],memories:['莱莎在巨蛛巢穴救过我的命','因酒馆斗殴被罚款 20 金币','布兰曾在酒馆当众羞辱我'],actions:['1日前 · 接受任务：清剿狼人','2日前 · 购买皮甲','2日前 · 在酒馆消费 18 金币','3日前 · 与格鲁姆交谈']},
  lyssa:{name:'莱莎·月径',short:'莱莎',meta:'木精灵 · 游侠 · 87岁',group:'银狐冒险团',current:'在南门靶场练习',gold:238,health:'良好',mood:'平静',attrs:[['战斗',58,'blue'],['忠诚',61,'gold'],['勇气',69,'green'],['谨慎',81,'purple']],thoughts:['“南部道路不该拖这么久。”','“达里安昨晚又喝多了。”','“我想换一把更轻的长弓。”'],relations:[['达里安',68],['米拉',45],['托林',12],['领主',53]],memories:['达里安替我挡下食人魔的攻击','第一次在黑石镇拥有自己的房间','曾因拒绝低价任务饿了两天'],actions:['今天 · 购买 24 支精制箭','1日前 · 邀请格鲁姆加入任务','2日前 · 在药剂店购买治疗药水','3日前 · 与达里安争论任务报酬']},
  grum:{name:'格鲁姆·石拳',short:'格鲁姆',meta:'山地矮人 · 战士 · 64岁',group:'银狐冒险团',current:'在灰锤铁匠铺砍价',gold:92,health:'轻伤',mood:'愉快',attrs:[['战斗',71,'blue'],['忠诚',55,'gold'],['勇气',84,'green'],['贪婪',46,'purple']],thoughts:['“这把斧头至少还能再用十年。”','“酒馆的新黑啤不错。”','“如果矿区真有银矿就发财了。”'],relations:[['达里安',31],['莱莎',28],['奥兰多',-18],['领主',39]],memories:['曾经单独击退三只豺狼人','奥兰多拒绝给我赊账','达里安曾替我付过一次酒钱'],actions:['刚刚 · 与奥兰多议价失败','今天 · 购买黑啤 3 杯','2日前 · 完成护送任务','4日前 · 修理战斧']},
  mira:{name:'米拉·晨星',short:'米拉',meta:'半精灵 · 牧师 · 25岁',group:'晨曦神殿',current:'在贫民区免费治疗',gold:64,health:'良好',mood:'满足',attrs:[['神术',67,'blue'],['忠诚',78,'gold'],['勇气',54,'green'],['慈悲',91,'purple']],thoughts:['“墓园的灵火让我不安。”','“药剂价格涨得太快了。”','“托林最近总是躲着我。”'],relations:[['托林',73],['莱莎',45],['赛琳娜',36],['领主',67]],memories:['领主拨款修缮了晨曦神殿','第一次成功救回濒死的矿工','托林在雨夜送我回神殿'],actions:['今天 · 免费治疗 4 名居民','1日前 · 为矿工举行祈福','2日前 · 与托林共进晚餐','3日前 · 申请调查墓园']},
  torin:{name:'托林·灰羽',short:'托林',meta:'轻足半身人 · 游荡者 · 29岁',group:'银狐冒险团',current:'在市场打听消息',gold:311,health:'良好',mood:'紧张',attrs:[['潜行',82,'blue'],['忠诚',36,'gold'],['勇气',48,'green'],['野心',72,'purple']],thoughts:['“银狐迟早需要换个队长。”','“米拉不应该被卷进这些事。”','“北边矿区可能有真正值钱的东西。”'],relations:[['米拉',73],['达里安',8],['莱莎',12],['领主',26]],memories:['第一次任务时私藏过一枚宝石','米拉替我隐瞒一次盗窃嫌疑','达里安拒绝重新分配战利品'],actions:['刚刚 · 在市场打听矿区消息','今天 · 向情报贩子支付 12 金币','2日前 · 与米拉共进晚餐','5日前 · 拒绝达里安的组队邀请']}
};

let feed=[
 {icon:'🐺',html:'银狐小队进入 <strong>北方遗迹</strong>',time:'刚刚'},
 {icon:'🍺',html:'达里安在 <strong>黑鹿酒馆</strong> 喝醉',time:'2分钟前'},
 {icon:'⚒',html:'铁匠奥兰多购买 <strong>20 单位铁矿</strong>',time:'12分钟前'},
 {icon:'♥',html:'米拉与托林成为 <strong>恋人</strong>',time:'18分钟前'},
 {icon:'💰',html:'今日累计税收 <strong>+42 金币</strong>',time:'1小时前'}
];
let townFeed=[
 {icon:'🏠',html:'两名新居民迁入黑石镇',time:'1小时前'},
 {icon:'🛒',html:'南部商队今晨抵达',time:'2小时前'},
 {icon:'🍺',html:'酒馆发生轻微斗殴',time:'3小时前'},
 {icon:'🌾',html:'市场粮价略有上涨',time:'4小时前'}
];
let timeline=[
 {year:'第1年',title:'黑石村人口突破 500',body:'逃荒农民与两支商队在领地定居。'},
 {year:'第2年',title:'银狐冒险团成立',body:'达里安、莱莎与格鲁姆第一次以固定队伍名义接取悬赏。'},
 {year:'第3年',title:'南部豺狼人战争',body:'连续袭击导致商路停摆，黑石领首次组织大规模清剿。'},
 {year:'第4年',title:'黑石村升格为黑石镇',body:'常住人口突破一千，市场与冒险者公会正式建立。'},
 {year:'第6年 · 春',title:'洛伦商行设立分号',body:'黑石镇逐渐成为北境与河谷之间的贸易节点。'},
 {year:'第6年 · 秋',title:'当前',body:'故事仍在继续。'}
];

const simulationTemplates=[
 ()=>({icon:'🍺',html:`${pick(['达里安','格鲁姆','托林','矿工艾德'])}在 <strong>黑鹿酒馆</strong> 消费 ${rand(4,18)} 金币`,shop:'tavern',spend:true}),
 ()=>({icon:'⚒',html:`${pick(['莱莎','格鲁姆','佣兵卡洛斯'])}在 <strong>灰锤铁匠铺</strong> ${pick(['修理装备','购买箭头','订购护甲','购买磨刀石'])}`,shop:'smith',spend:true}),
 ()=>({icon:'🤝',html:`${pick(['莱莎','达里安','托林'])}邀请 ${pick(['格鲁姆','艾琳','佣兵卡洛斯'])} <strong>加入队伍</strong>`}),
 ()=>({icon:'📜',html:`${pick(['银狐小队','猎人罗恩','游荡者艾琳'])}查看了 <strong>${pick(quests).title}</strong> 悬赏`}),
 ()=>({icon:'💬',html:`${pick(['米拉','托林','莱莎','格鲁姆'])}与 ${pick(['达里安','赛琳娜','商人费伦'])} <strong>${pick(['交谈甚欢','发生争执','交换情报','谈论北方遗迹'])}</strong>`}),
 ()=>({icon:'💢',html:`${pick(['达里安','格鲁姆','佣兵卡洛斯'])}与 ${pick(['布兰','外地商人','酒馆赌徒'])} <strong>关系恶化</strong>`}),
 ()=>({icon:'🛒',html:`一支 ${pick(['河谷','北境','矮人','沿海'])} 商队抵达黑石镇，市场货源增加`,commerce:1}),
 ()=>({icon:'🏠',html:`${rand(1,4)} 名新居民迁入 <strong>黑石镇</strong>`,population:rand(1,4)}),
 ()=>({icon:'⚗',html:`${pick(['米拉','莱莎','佣兵卡洛斯'])}在 <strong>月桂药剂店</strong> 购买治疗用品`,shop:'potion',spend:true}),
 ()=>({icon:'⚔',html:`酒馆中的争执升级为 <strong>斗殴</strong>，城卫正在赶往现场`,order:-1})
];

function pick(arr){return arr[Math.floor(Math.random()*arr.length)]}
function rand(min,max){return Math.floor(Math.random()*(max-min+1))+min}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1800)}
function capStats(){state.food=clamp(state.food,0,100);state.order=clamp(state.order,0,100);state.prestige=clamp(state.prestige,0,100);state.commerce=clamp(state.commerce,0,100);state.treasury=Math.max(0,state.treasury);state.population=Math.max(0,state.population)}
function renderStats(){capStats();$('#statPopulation').textContent=formatGold(state.population);$('#statTreasury').textContent=formatGold(state.treasury);$('#statFood').textContent=`${Math.round(state.food)}%`;$('#statOrder').textContent=Math.round(state.order);$('#statPrestige').textContent=Math.round(state.prestige);$('#territoryTax').textContent=`+${Math.round(state.taxToday)}`;$('#territoryOrder').textContent=Math.round(state.order);$('#territoryCommerce').textContent=Math.round(state.commerce);$('#territoryFood').textContent=`${Math.round(state.food)}%`;$('#hallTaxToday').textContent=`+${Math.round(state.taxToday)} 金币`;$('#worldClock').textContent=nowText(state);$('#yearLabel').textContent=`第${state.year}年`;$('#seasonLabel').textContent=state.season}
function renderFeed(targetId,data){const el=$(targetId);el.innerHTML=data.slice(0,7).map(x=>`<div class="feed-item"><span class="feed-icon">${x.icon}</span><div class="feed-text">${x.html}</div><span class="feed-time">${x.time||'刚刚'}</span></div>`).join('')}
function addFeed(item,town=false){item.time=item.time||'刚刚';feed.unshift(item);feed=feed.slice(0,18);renderFeed('#feedList',feed);if(town){townFeed.unshift(item);townFeed=townFeed.slice(0,12);renderFeed('#townFeed',townFeed)}}

function renderEvent(){const e=events[state.currentEvent%events.length];$('#eventSeal').textContent=e.seal;$('#eventType').textContent=e.type;$('#eventTitle').textContent=e.title;$('#eventBody').textContent=e.body;$('#eventEffects').innerHTML=e.effects.map(x=>`<span class="effect-chip">${x}</span>`).join('');$('#choiceLeft').textContent=e.left;$('#choiceRight').textContent=e.right;const card=$('#eventCard');card.classList.remove('event-card-exit-left','event-card-exit-right');card.style.transform='';card.style.opacity=''}
function applyFx(fx={}){Object.entries(fx).forEach(([k,v])=>{if(k in state)state[k]+=v});renderStats()}
function decide(side){const e=events[state.currentEvent%events.length],isRight=side==='right';const card=$('#eventCard');card.classList.add(isRight?'event-card-exit-right':'event-card-exit-left');setTimeout(()=>{applyFx(isRight?e.rightFx:e.leftFx);addFeed({icon:isRight?'✓':'◆',html:isRight?e.rightLog:e.leftLog,time:'刚刚'},true);if(e.special==='murder'){state.murderResolved=true;timeline.splice(timeline.length-1,0,{year:'第6年 · 秋',title:isRight?'达里安获判正当防卫':'达里安因布兰命案入狱',body:isRight?'商会对此判决强烈不满，冒险者公会则公开支持领主。':'银狐冒险团失去主要战士，队内关系迅速恶化。'});renderTimeline()}if(isRight&&e.rightQuest){const q=quests.find(q=>q.id===e.rightQuest);if(q){q.status=q.status==='新发布'?'新发布':'招募中';q.statusClass=q.status==='新发布'?'new':'';q.views+=rand(1,4);renderQuests()}}state.currentEvent=(state.currentEvent+1)%events.length;renderEvent();toast(isRight?e.right:e.left)},170)}

function renderQuests(){const list=$('#questList');const visible=quests.filter(q=>state.questFilter==='all'||q.type===state.questFilter);list.innerHTML=visible.map(q=>`<article class="quest-card parchment" data-quest-id="${q.id}"><div class="quest-head"><div class="quest-title"><div class="quest-emblem">${q.icon}</div><div><h3>${q.title}</h3><div class="quest-sub">领主悬赏 · ${q.type==='combat'?'战斗':q.type==='explore'?'探索':q.type==='investigate'?'调查':'建设'}</div></div></div><span class="status-ribbon ${q.statusClass}">${q.status}</span></div><div class="quest-data"><div><small>奖励</small><strong>◉ ${q.reward} 金币</strong></div><div><small>风险</small><strong class="${q.risk==='高'||q.risk==='中高'?'red':''}">${q.risk}</strong></div><div><small>截止</small><strong>${q.days} 天</strong></div><div><small>已查看</small><strong>${q.views} 人</strong></div><div><small>感兴趣</small><strong class="green">${q.interested} 人</strong></div><div><small>已报名</small><strong class="blue">${q.joined} 人</strong></div></div><div class="quest-reasons">💬 ${q.reasons}</div><div class="quest-progress"><i style="width:${clamp(q.progress,0,100)}%"></i></div></article>`).join('');$('#hallQuestCount').textContent=`${quests.filter(q=>q.status!=='完成').length} 项`}

function renderShops(){const taxRate=(id)=>id==='tavern'?state.tavernTax:state.tradeTax;$('#shopList').innerHTML=shops.map(s=>`<div class="shop-row"><div class="shop-icon">${s.icon}</div><div><div class="shop-name">${s.name}</div><div class="shop-meta">老板：${s.owner} · 顾客 ${s.customers}<br>${s.detail}</div></div><div class="shop-tax"><small>今日收入 ${Math.round(s.revenue)}</small><strong>缴税 ${Math.max(0,Math.round(s.revenue*taxRate(s.id)/100))}</strong></div></div>`).join('')}
function renderTax(){$('#tradeTaxLabel').textContent=`${state.tradeTax}%`;$('#tavernTaxLabel').textContent=`${state.tavernTax}%`;const avg=(state.tradeTax+state.tavernTax)/2;$('#taxHint').textContent=avg<=7?'当前税率温和，商人和居民普遍能够接受。':avg<=13?'税负已经明显，部分商人会抬价，居民将减少非必要消费。':'税负过高，商人迁出与逃税风险显著增加。';renderShops()}

function renderRoster(){const keys=Object.keys(npcs);$('#npcRoster').innerHTML=keys.map(k=>{const n=npcs[k];return `<button type="button" class="npc-chip ${k===state.currentNpc?'active':''}" data-npc="${k}"><span class="npc-avatar">${n.portrait?`<img src="${n.portrait}" alt="">`:n.short[0]}</span><b>${n.short}</b><small>${n.meta.split(' · ')[1]}</small></button>`}).join('')}
function renderNpc(){const n=npcs[state.currentNpc];$('#npcName').textContent=n.name;$('#npcMeta').textContent=n.meta;$('#npcGroup').textContent=n.group;$('#npcCurrent').textContent=n.current;$('#npcGold').textContent=n.gold;$('#npcHealth').textContent=n.health;$('#npcMood').textContent=n.mood;const pf=$('#portraitFrame');if(n.portrait){pf.innerHTML=`<img id="npcPortrait" src="${n.portrait}" alt="${n.name}">`}else{pf.innerHTML=`<div class="initial-portrait">${n.short[0]}</div>`}$('#npcAttributes').innerHTML=n.attrs.map(a=>`<div class="attr"><small>${a[0]}</small><strong class="${a[2]}">${a[1]}</strong></div>`).join('');$('#npcThoughts').innerHTML=n.thoughts.map(x=>`<div class="thought">${x}</div>`).join('');$('#npcRelations').innerHTML=n.relations.map(([name,val])=>`<div class="relation"><span>${name}</span><span class="${val>=50?'green':val<0?'red':'gold'}">${val>0?'+':''}${val}</span></div>`).join('');$('#npcMemories').innerHTML=n.memories.map(x=>`<div class="memory">▧ ${x}</div>`).join('');$('#npcActions').innerHTML=n.actions.map(x=>`<div class="action-line">◈ ${x}</div>`).join('');renderRoster()}
function renderTimeline(){$('#timeline').innerHTML=timeline.map(x=>`<div class="timeline-event"><div class="timeline-year">${x.year}</div><div class="timeline-title">${x.title}</div><div class="timeline-body">${x.body}</div></div>`).join('')}

function switchPage(name){$$('.page').forEach(p=>p.classList.toggle('active',p.dataset.page===name));$$('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.pageTarget===name));const titles={hall:'黑石领',quests:'悬赏大厅',territory:'黑石镇',people:'人物档案',chronicle:'领地纪事'};$('#pageTitle').textContent=titles[name]||'黑石领';window.scrollTo({top:0,behavior:'smooth'})}

function simulateTick(count=1){for(let i=0;i<count;i++){
  state.minute+=20;if(state.minute>=60){state.minute-=60;state.hour++}if(state.hour>=24){state.hour=0;state.day++;state.taxToday=0;state.food-=Math.max(.08,state.population/15000);shops.forEach(s=>{s.customers=Math.max(0,Math.round(s.customers*.35));s.revenue=Math.round(s.revenue*.25)});if(state.day>30){state.day=1;state.season=({春季:'夏季',夏季:'秋季',秋季:'冬季',冬季:'春季'})[state.season];if(state.season==='春季')state.year++}}
  const ev=pick(simulationTemplates)();if(ev.population)state.population+=ev.population;if(ev.order)state.order+=ev.order;if(ev.commerce)state.commerce+=ev.commerce;
  if(ev.spend&&ev.shop){const shop=shops.find(s=>s.id===ev.shop);const spend=rand(6,34);shop.customers++;shop.revenue+=spend;const rate=ev.shop==='tavern'?state.tavernTax:state.tradeTax;const tax=Math.max(1,Math.round(spend*rate/100));state.treasury+=tax;state.taxToday+=tax;ev.html+=`，领地获得税金 <strong>+${tax}</strong>`}
  if(Math.random()<.12){const q=pick(quests);q.views++;if(Math.random()<.35){q.interested++;if(q.joined<4&&Math.random()<.45){q.joined++;q.status=q.joined?'招募中':q.status;q.progress=clamp(q.progress+rand(2,7),0,100)}}}
  addFeed({icon:ev.icon,html:ev.html,time:'刚刚'},Math.random()<.55);
 }
 capStats();renderStats();renderShops();renderQuests();
}

function setupSwipe(){const card=$('#eventCard');let startX=0,dx=0,drag=false;card.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;drag=true;startX=e.clientX;dx=0;card.setPointerCapture?.(e.pointerId);card.classList.add('dragging')});card.addEventListener('pointermove',e=>{if(!drag)return;dx=e.clientX-startX;card.style.transform=`translateX(${dx}px) rotate(${dx/45}deg)`;card.style.opacity=String(1-Math.min(Math.abs(dx)/500,.35))});const end=()=>{if(!drag)return;drag=false;card.classList.remove('dragging');if(Math.abs(dx)>95){decide(dx>0?'right':'left')}else{card.style.transform='';card.style.opacity='1'}};card.addEventListener('pointerup',end);card.addEventListener('pointercancel',end)}

function bind(){
  $$('.bottom-nav button').forEach(b=>b.addEventListener('click',()=>switchPage(b.dataset.pageTarget)));$$('[data-jump]').forEach(b=>b.addEventListener('click',()=>switchPage(b.dataset.jump)));
  $('#choiceLeft').addEventListener('click',()=>decide('left'));$('#choiceRight').addEventListener('click',()=>decide('right'));setupSwipe();
  $$('.speed-controls [data-speed]').forEach(b=>b.addEventListener('click',()=>{state.speed=Number(b.dataset.speed);$$('.speed-controls [data-speed]').forEach(x=>x.classList.toggle('active',x===b));toast(state.speed===0?'世界已暂停':`时间速度 ${state.speed}×`)}));
  $('#advanceDay').addEventListener('click',()=>{simulateTick(8);state.day++;if(state.day>30){state.day=1}renderStats();toast('世界推进了 1 天')});
  $$('.quest-tabs button').forEach(b=>b.addEventListener('click',()=>{state.questFilter=b.dataset.filter;$$('.quest-tabs button').forEach(x=>x.classList.toggle('active',x===b));renderQuests()}));
  $('#openQuestModal').addEventListener('click',()=>{$('#questModal').hidden=false});$('#closeQuestModal').addEventListener('click',()=>{$('#questModal').hidden=true});$('#questModal').addEventListener('click',e=>{if(e.target===$('#questModal'))$('#questModal').hidden=true});
  $('#questForm').addEventListener('submit',e=>{e.preventDefault();const title=$('#newQuestTitle').value.trim();const reward=clamp(Number($('#newQuestReward').value)||10,10,5000);const days=clamp(Number($('#newQuestDays').value)||1,1,120);if(!title){toast('请输入任务名称');return}if(state.treasury<reward){toast('国库不足以支付任务保证金');return}const type=$('#newQuestType').value,risk=$('#newQuestRisk').value;state.treasury-=reward;quests.unshift({id:'custom'+Date.now(),type,icon:type==='combat'?'⚔':type==='explore'?'✦':type==='investigate'?'⌕':'⚒',title,reward,risk,days,status:'新发布',statusClass:'new',views:0,interested:0,rejected:0,joined:0,reasons:'等待冒险者查看',progress:0});addFeed({icon:'📜',html:`领主发布新悬赏：<strong>${title}</strong>`,time:'刚刚'},true);renderStats();renderQuests();$('#questModal').hidden=true;toast('悬赏已张贴至冒险者公会')});
  $('#tradeTax').addEventListener('input',e=>{state.tradeTax=Number(e.target.value);renderTax()});$('#tavernTax').addEventListener('input',e=>{state.tavernTax=Number(e.target.value);renderTax()});
  $('#npcRoster').addEventListener('click',e=>{const b=e.target.closest('[data-npc]');if(!b)return;state.currentNpc=b.dataset.npc;renderNpc()});
}

function init(){renderStats();renderEvent();renderFeed('#feedList',feed);renderFeed('#townFeed',townFeed);renderQuests();renderTax();renderNpc();renderTimeline();bind();if(!location.search.includes('static=1'))setInterval(()=>{if(state.speed>0)simulateTick(state.speed)},4200)}
init();
})();
