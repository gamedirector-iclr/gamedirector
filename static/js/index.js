'use strict';
document.documentElement.classList.add('js-ready');
// Each pair is two equally valid state initializations. Filenames preserve source provenance.
const initialization = [
  {id:'fight0138_clip0003_compare',name:'Golden Bird',winner:'b',a:{'Boss HP':500,'Boss Attack':20},b:{'Boss HP':200,'Boss Attack':2}},
  {id:'fight0014_clip0003_compare',name:'Golden Bird',winner:'b',a:{'Boss HP':500,'Boss Attack':20},b:{'Boss HP':360,'Boss Attack':20}},
  {id:'fight0647_clip0002_compare',name:'Plague Leader',winner:'a',a:{'Boss HP':500,'Boss Attack':20},b:{'Boss HP':2500,'Boss Attack':100}},
  {id:'good_fight0036_clip0005_compare',name:'Plague Leader',winner:'a',a:{'Boss HP':500,'Boss Attack':20},b:{'Boss HP':500,'Boss Attack':50}},
  {id:'fight0890_clip0004_compare',name:'Mutant Soldier',winner:'a',a:{'Boss HP':500,'Boss Attack':20},b:{'Boss HP':1500,'Boss Attack':56}},
  ...[['rollout','Broken Vessel'],['rollout_2','Hornet'],['rollout_3','Dung Defender']].map(([id,name])=>({id,name,winner:'a',a:{'Player Attack':40,'Boss Attack':20},b:{'Player Attack':20,'Boss Attack':200}}))
];
const skills = {
  orb_toss: {title:'Orb Toss', source:'Hornet', sourceFile:'Hornet_orb_toss_gt', direction:'Hornet → Broken Vessel / Dung Defender', recipientFile:(take,char)=>`${take}_${char}_uses_Hornet_orb_toss`, recipients:[{key:'broken',name:'Broken Vessel',takes:[21,24,30,33,36]},{key:'dung',name:'Dung Defender',takes:[29]}], description:'Hornet’s orb-toss skill is reassigned to two different bosses. Watch how the transferred action is rendered while each recipient keeps its character appearance.'},
  needle_throw: {title:'Needle Throw', source:'Hornet', sourceFile:'Hornet_needle_throw_gt', direction:'Hornet → Broken Vessel / Dung Defender', recipientFile:(take,char)=>`${take}_${char}_uses_Hornet_needle_throw`, recipients:[{key:'broken',name:'Broken Vessel',takes:[10,13,19]},{key:'dung',name:'Dung Defender',takes:[12]}], description:'The same needle-throw skill is assigned to Broken Vessel and Dung Defender. Compare the recognizable attack motion across the original and recipient characters.'},
  jump_slam: {title:'Jump Slam', source:'Golden Bird', sourceFile:'GoldenBird_jump_slam', direction:'Golden Bird → Mutant Soldier / Plague Leader', recipientFile:(take,char)=>`${take}_${char}_uses_jump_slam`, recipients:[{key:'mutant',name:'Mutant Soldier',takes:[17]},{key:'plague',name:'Plague Leader',takes:[17]}], description:'Golden Bird’s jump-slam skill is reassigned to two different bosses. Watch how the transferred slam is rendered while each recipient keeps its character appearance.'}
};
// Public display fields only; private run paths from the logs are intentionally not embedded.
const planning = [
  {id:'nrftw_08_tick0000_hammer_smash',name:'Close-range punish',boss:'Golden Bird',game:'No Rest for the Wicked',skill:'Hammer Smash',distance:'1.582',range:'1.1–5.5',rangeLabel:'Close',rangeKey:'close',frame:'close',position:'In front',context:'The player is close and inside the boss’s front cone.',reason:'A heavy area strike can pressure the nearby target. The observed distance is inside the configured effective band.',result:'A landed hit is recorded in the supplied attack-detection log.',note:'Watch the heavy hammer smash directed at a nearby player.'},
  {id:'hkdeath_02_tick0000_orb_toss',name:'Mid-range projectile',boss:'Hornet',game:'Hollow Knight',skill:'Orb Toss',distance:'3.203',range:'2.0–4.1',rangeLabel:'Close-to-mid',rangeKey:'close-mid',frame:'close-to-mid',position:'Behind',context:'The player is behind the boss at close-to-medium range.',reason:'Orb toss applies projectile pressure around the target area. The observed distance fits the configured effective band.',result:'A landed hit is recorded in the supplied attack-detection log.',note:'Watch Hornet use orb toss to pressure the player at the selected spacing.'},
  {id:'attempt_001_fight_0041_episode_0041_tick0000_spin_attack',name:'Surrounding pressure',boss:'Golden Bird',game:'No Rest for the Wicked',skill:'Spin Attack',distance:'4.395',range:'2.5–7.0',rangeLabel:'Mid-to-far',rangeKey:'mid-far',frame:'mid-to-far',position:'Behind',context:'The player is behind the boss at a medium distance.',reason:'A spinning area attack covers the surrounding space. The observed distance is inside the configured effective band.',result:'A landed hit is recorded in the supplied attack-detection log.',note:'Watch the sweeping attack cover the area around the boss when the player is behind it.'},
  {id:'nrftw_03_tick0000_running_slash',name:'Long-range approach',boss:'Mutant Soldier',game:'No Rest for the Wicked',skill:'Running Slash',distance:'9.258',range:'5.5–9.0',rangeLabel:'Far',rangeKey:'far',frame:'far',position:'In front',context:'The player is far away and in front of the boss.',reason:'The planner chooses a running slash to close the gap. The observed distance is slightly outside the configured effective band.',result:'No landed hit is recorded in this clip.',note:'Watch the boss rush toward the distant player. This example shows a gap-closing choice; the decision log marks it outside the preferred range and records no hit.'}
];
const $ = (s,root=document) => root.querySelector(s);
const $$ = (s,root=document) => [...root.querySelectorAll(s)];
const players = new Map();
const media = (src,poster,label) => `<div class="media-wrap"><video autoplay muted loop playsinline preload="metadata" poster="static/posters/${poster}.jpg" aria-label="${label}"><source src="${encodeURI(src)}" type='video/mp4; codecs="avc1.64001f"'><source src="static/videos/${poster}.webm" type='video/webm; codecs="vp9"'>Your browser does not support HTML5 video. <a href="${encodeURI(src)}">Open video</a></video><button class="expand" type="button" aria-label="Expand ${label}" title="Fullscreen">⛶</button></div>`;
const controls = label => `<div class="playback" aria-label="${label}"><button type="button" data-play>Play</button><button type="button" data-restart aria-label="Replay all displayed videos from the beginning">↺ Replay</button><input type="range" min="0" max="1000" value="0" step="1" aria-label="Video timeline"><output>0:00 / 0:00</output><select aria-label="Playback speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option></select></div>`;
const time = seconds => `${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;

function attachPlayback(root, {sync=true}={}) {
  const videos=$$('video',root), play=$('[data-play]',root), restart=$('[data-restart]',root), slider=$('input[type=range]',root), output=$('output',root), speed=$('select',root);
  let running=false, wanted=true, frame, disposed=false, resuming=false, inView=false;
  const duration=()=>Math.max(...videos.map(v=>Number.isFinite(v.duration)?v.duration:0));
  function update(){const d=duration(), t=videos[0].currentTime||0; output.textContent=`${time(t)} / ${time(d)}`;slider.value=d?t/d*1000:0;}
  function pause(manual=true){if(manual)wanted=false;running=false;videos.forEach(v=>v.pause());play.textContent='Play';cancelAnimationFrame(frame);update();}
  async function start(){
    wanted=true;
    if(!inView || document.hidden || disposed) return;
    if(videos.some(v=>v.ended)) videos.forEach(v=>{v.currentTime=0;});
    const results=await Promise.allSettled(videos.map(v=>v.play()));
    if(disposed||!wanted){videos.forEach(v=>v.pause());return;}
    if(results.some(r=>r.status==='rejected')){pause();return;}
    running=true;play.textContent='Pause';cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);
  }
  function tick(){if(!running||disposed)return;const t=videos[0].currentTime; if(sync)videos.slice(1).forEach(v=>{if(v.readyState>=3 && Math.abs(v.currentTime-t)>.15)v.currentTime=t;});update();frame=requestAnimationFrame(tick);}
  async function resumeReady(){if(!inView||running||resuming||disposed||!wanted||!sync||videos.some(v=>v.readyState<3))return;resuming=true;await start();resuming=false;}
  play.addEventListener('click',()=>wanted?pause():start());
  restart.addEventListener('click',()=>{videos.forEach(v=>{v.currentTime=0;});start();});
  slider.addEventListener('input',()=>{const t=Number(slider.value)/1000*duration();videos.forEach(v=>{if(Number.isFinite(v.duration))v.currentTime=Math.min(t,v.duration);});update();});
  speed.addEventListener('change',()=>videos.forEach(v=>{v.playbackRate=Number(speed.value);}));
  videos.forEach(v=>{
    v.loop=true;v.muted=true;v.pause();
    v.addEventListener('loadedmetadata',update);
    v.addEventListener('timeupdate',()=>{if(!running)update();});
    v.addEventListener('waiting',()=>{if(sync&&running)pause(false);});
    v.addEventListener('canplay',resumeReady);
    v.addEventListener('error',()=>{pause(); if(!$('.error-note',root))root.insertAdjacentHTML('beforeend','<p class="error-note">A video could not be loaded. Please reload the page or open it using a local web server.</p>');});
  });
  $$('.expand',root).forEach(b=>b.addEventListener('click',()=>{
    const original=$('video',b.closest('.media-wrap')), wasPlaying=!original.paused;
    pause();
    const dialog=document.createElement('dialog');dialog.className='video-dialog';
    const close=document.createElement('button');close.className='dialog-close';close.textContent='×';close.setAttribute('aria-label','Close expanded video');
    const enlarged=original.cloneNode(true);enlarged.controls=true;enlarged.muted=true;enlarged.loop=true;enlarged.playbackRate=original.playbackRate;
    enlarged.addEventListener('loadedmetadata',()=>{enlarged.currentTime=original.currentTime;if(wasPlaying)enlarged.play().catch(()=>{});},{once:true});
    dialog.setAttribute('aria-label',original.getAttribute('aria-label'));dialog.append(close,enlarged);document.body.append(dialog);
    close.addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
    dialog.addEventListener('close',()=>{enlarged.pause();dialog.remove();document.body.classList.remove('video-expanded');b.focus();if(wasPlaying)start();},{once:true});
    document.body.classList.add('video-expanded');dialog.showModal();close.focus();
  }));
  const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView&&wanted&&!document.hidden)start();else if(!inView)pause(false);},{threshold:.05});observer.observe(root);
  const visibility=()=>{if(document.hidden)pause(false);else if(inView&&wanted)start();};document.addEventListener('visibilitychange',visibility);
  const api={pause,destroy(){disposed=true;pause();observer.disconnect();document.removeEventListener('visibilitychange',visibility);videos.forEach(v=>{v.removeAttribute('src');$$('source',v).forEach(s=>s.removeAttribute('src'));v.load();});}};
  players.set(root.id,api);update();
}
function replaceStage(id,html,opts){const root=document.getElementById(id);players.get(id)?.destroy();root.innerHTML=html;attachPlayback(root,opts);}
const portrait = name => `<img class="character-portrait" src="static/images/characters/${encodeURIComponent(name)}.png" alt="" loading="lazy">`;
let activeInit=initialization[0].id;
function renderInitPicker(){
  $('#init-picker').innerHTML=initialization.map((item,i)=>`<button type="button" data-init="${item.id}" aria-pressed="${item.id===activeInit}" aria-label="${item.name}, comparison ${i+1}">${portrait(item.name)}<strong>${item.name}</strong><small>${String(i+1).padStart(2,'0')}</small></button>`).join('');
}
function renderInit(){
  const item=initialization.find(x=>x.id===activeInit);
  const states=[{letter:'a',value:item.a,suffix:'original'},{letter:'b',value:item.b,suffix:'configured'}];
  const ordered=item.winner==='a'?states:[states[1],states[0]];
  const configPanel=(state,index)=>{
    const mode=state.letter===item.winner?'easy':'hard';
    const bars=Object.entries(state.value).map(([key,value])=>{
      const max=Math.max(item.a[key],item.b[key])*1.2, hp=key.includes('HP');
      return `<div class="stat-row ${hp?'hp-stat':'attack-stat'}"><span class="stat-name"><img class="stat-icon" src="static/images/${hp?'hp':'attack'}.png" alt="" aria-hidden="true">${key}</span><div class="stat-track" role="meter" aria-label="${key}, State ${index===0?'A':'B'}" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${value}" title="Shared scale for both states: 0–${max}"><span style="width:${value/max*100}%"></span></div><b>${value}</b></div>`;
    }).join('');
    return `<div class="state-config"><div class="state-heading"><span class="state-label">State ${index===0?'A':'B'}</span><span class="mode-badge mode-${mode}">(${mode==='easy'?'Easy':'Hard'} Mode)</span></div><div class="state-bars">${bars}</div></div>`;
  };
  const rolloutPanel=(state,index)=>{
    return `<div class="video-panel rollout-panel">${media(`static/videos/${item.id}-${state.suffix}.mp4`,`${item.id}-${state.suffix}`,`${item.name}, State ${index===0?'A':'B'}`)}</div>`;
  };
  const shared=item.id.startsWith('rollout')?'Player HP 500 · Boss HP 500':'Player HP 500';
  replaceStage('init-stage',`<div class="stage-heading"><h4>${item.name}</h4><span class="shared-state">${shared}</span></div><div class="init-block"><div class="init-block-label">Player-Configurable State Initialization</div><div class="config-grid">${configPanel(ordered[0],0)+configPanel(ordered[1],1)}</div></div><div class="init-block init-block-rollout"><div class="init-block-label">Generated Gameplay Rollout</div><div class="video-grid">${rolloutPanel(ordered[0],0)+rolloutPanel(ordered[1],1)}</div></div>${controls('Synchronized state initializations')}`);
}
$('#init-picker').addEventListener('click',e=>{const b=e.target.closest('[data-init]');if(!b)return;activeInit=b.dataset.init;renderInitPicker();renderInit();});
let activeSkill='orb_toss';
let takes={};
function initTakes(){takes={};skills[activeSkill].recipients.forEach(r=>{takes[r.key]=r.takes[0];});}
initTakes();
function renderTransfer(){
  const skill=skills[activeSkill];
  const sourcePanel=()=>{
    const filename=skill.sourceFile;
    return `<figure class="video-panel source-panel"><figcaption class="panel-caption character-caption">${portrait(skill.source)}<div><div class="panel-title">${skill.source}</div><div class="transfer-role">Source skill</div></div></figcaption>${media(`static/videos/${filename}.mp4`,filename,`${skill.source} performs ${skill.title}`)}<div class="take-picker"><span>${skill.source}’s ${skill.title}</span></div></figure>`;
  };
  const recipientPanel=r=>{
    const take=takes[r.key];
    const charNoSpace=r.name.replaceAll(' ','');
    const filename=skill.recipientFile(take,charNoSpace);
    return `<figure class="video-panel"><figcaption class="panel-caption character-caption">${portrait(r.name)}<div><div class="panel-title">${r.name}</div><div class="transfer-role">Transferred skill</div></div></figcaption>${media(`static/videos/${filename}.mp4`,filename,`${r.name} performs ${skill.title}`)}<div class="take-picker"><span>Example</span>${r.takes.map((n,i)=>`<button type="button" data-take="${n}" data-character="${r.key}" aria-label="${r.name}, example ${i+1}" aria-pressed="${n===take}">${String(i+1).padStart(2,'0')}</button>`).join('')}</div></figure>`;
  };
  $('#transfer-direction').textContent=skill.direction;
  replaceStage('transfer-stage',`<div class="transfer-grid">${sourcePanel()}${skill.recipients.map(recipientPanel).join('')}</div>${controls('Skill transfer video group')}`,{sync:false});
}
$('#skill-picker').addEventListener('click',e=>{const b=e.target.closest('[data-skill]');if(!b)return;activeSkill=b.dataset.skill;initTakes();$$('button',$('#skill-picker')).forEach(x=>x.setAttribute('aria-pressed',x===b));renderTransfer();});
$('#transfer-stage').addEventListener('click',e=>{const b=e.target.closest('[data-take]');if(!b)return;const character=b.dataset.character;const take=Number(b.dataset.take);const focusLabel=b.getAttribute('aria-label');takes[character]=take;renderTransfer();$(`[aria-label="${focusLabel}"]`,$('#transfer-stage'))?.focus();});
let activePlanning=0;
function renderPlanning(){
  $('#planning-picker').innerHTML=planning.map((item,i)=>`<button type="button" data-planning="${i}" aria-pressed="${i===activePlanning}"><span class="range-chip range-${item.rangeKey}">${item.rangeLabel}</span><strong>${item.name}</strong><small>${item.skill}</small></button>`).join('');
  const item=planning[activePlanning];
  replaceStage('planning-stage',`<div class="planning-summary"><div class="planning-character">${portrait(item.boss)}<strong>${item.boss}</strong></div></div><div class="planning-body"><div class="planning-frame"><img src="static/images/planning/${item.frame}.png" alt="First-frame spatial reference for ${item.boss} at ${item.rangeLabel.toLowerCase()} range" loading="lazy"><div class="planning-frame-caption">First frame · distance ${item.distance}</div><div class="planning-stats"><div class="spatial-fact"><span>Distance</span><div class="value-row"><b>${item.distance}</b><span class="range-chip range-${item.rangeKey}">${item.rangeLabel}</span></div></div><div class="spatial-fact"><span>Player position</span><b>${item.position}</b></div><div class="chosen-skill"><span>Selected skill</span><div class="value-row"><b>${item.skill}</b><span class="effective-chip">Effective range ${item.range}</span></div></div></div></div><div class="planning-video">${media(`static/videos/${item.id}.mp4`,item.id,`${item.boss} executes ${item.skill}`)}</div></div>${controls('Boss planning video')}`);
}
$('#planning-picker').addEventListener('click',e=>{const b=e.target.closest('[data-planning]');if(!b)return;activePlanning=Number(b.dataset.planning);renderPlanning();});
const menu=$('.menu-toggle');
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',open);$('#nav-links').classList.toggle('is-open',open);});
$$('#nav-links a').forEach(a=>a.addEventListener('click',()=>{menu.setAttribute('aria-expanded','false');$('#nav-links').classList.remove('is-open');}));
renderInitPicker();renderInit();renderTransfer();renderPlanning();

const tooltip=document.createElement('div');tooltip.className='metric-tooltip';tooltip.id='metric-tooltip';tooltip.role='tooltip';tooltip.hidden=true;document.body.append(tooltip);
let tooltipTarget=null;
function hideTooltip(){if(tooltipTarget)tooltipTarget.removeAttribute('aria-describedby');tooltipTarget=null;tooltip.hidden=true;}
function showTooltip(target){
  tooltipTarget=target;tooltip.textContent=target.dataset.tooltip;tooltip.hidden=false;target.setAttribute('aria-describedby',tooltip.id);
  const r=target.getBoundingClientRect(),box=tooltip.getBoundingClientRect();
  tooltip.style.left=Math.max(12,Math.min(innerWidth-box.width-12,r.left+r.width/2-box.width/2))+'px';
  tooltip.style.top=(r.top>box.height+20?r.top-box.height-10:r.bottom+10)+'px';
}
$$('[data-tooltip]').forEach(el=>{
  el.addEventListener('mouseenter',()=>showTooltip(el));el.addEventListener('mouseleave',hideTooltip);
  el.addEventListener('focus',()=>showTooltip(el));el.addEventListener('blur',hideTooltip);
  el.addEventListener('click',()=>showTooltip(el));
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')hideTooltip();});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('[data-tooltip]'))hideTooltip();});
window.addEventListener('scroll',hideTooltip,{passive:true,capture:true});window.addEventListener('resize',hideTooltip);

// ---------- Reveal-on-scroll ----------
// Belt-and-suspenders: IntersectionObserver handles the normal case, but a fast
// or programmatic scroll can skip a frame and leave an element's observer entry
// unfired. A direct geometry sweep on every scroll/resize guarantees content is
// never left permanently invisible.
const revealEls=$$('.reveal');
function sweepReveal(){
  const vh=window.innerHeight||document.documentElement.clientHeight;
  revealEls.forEach(el=>{if(!el.classList.contains('in-view')&&el.getBoundingClientRect().top<vh*.94)el.classList.add('in-view');});
}
const revealObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');revealObserver.unobserve(entry.target);}});
},{threshold:0,rootMargin:'0px 0px -4% 0px'});
revealEls.forEach(el=>revealObserver.observe(el));
sweepReveal();
window.addEventListener('scroll',sweepReveal,{passive:true});
window.addEventListener('resize',sweepReveal);

// ---------- Nav scrollspy ----------
const navLinks=$$('#nav-links a[data-nav]');
const navTargets=navLinks.map(a=>document.getElementById(a.dataset.nav)).filter(Boolean);
if(navTargets.length){
  const spy=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      const link=$(`#nav-links a[data-nav="${entry.target.id}"]`);
      if(!link)return;
      if(entry.isIntersecting)navLinks.forEach(a=>a.classList.toggle('is-active',a===link));
    });
  },{rootMargin:'-45% 0px -50% 0px',threshold:0});
  navTargets.forEach(t=>spy.observe(t));
}
