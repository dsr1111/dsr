'use strict';
// Navigation fixes are scoped to this calculator's shadow-root instance.
customElements.whenDefined('custom-nav').then(() => {
  const root = document.querySelector('custom-nav')?.shadowRoot;
  if (!root || root.querySelector('[data-calculator-navigation]')) return;
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = '/assets/css/pages/calculator/nav.css?v=20260929';
  stylesheet.dataset.calculatorNavigation = '';
  root.appendChild(stylesheet);
});
const $ = id => document.getElementById(id);
const number = (id, fallback = 0) => $(id).value === '' ? fallback : Number($(id).value);
const format = value => Number(value).toLocaleString('ko-KR', {maximumFractionDigits:2});
const elements = ['강철','나무','흙','물','물리','바람','불','빛','어둠','얼음','천둥'];
const imageBase = 'https://media.dsrwiki.com/dsrwiki/';
let digimonData, mobData, calculationVersion = 0;

function options(id, values, selected) {
  const nodes = values.map(entry => {const [value, label] = Array.isArray(entry) ? entry : [entry,entry]; return new Option(label, value);});
  $(id).replaceChildren(...nodes);
  if (selected !== undefined && nodes.some(node => node.value === String(selected))) $(id).value = selected;
}
function icon(name, accessibleName = '') {
  const img = document.createElement('img'); img.src = imageBase + encodeURIComponent(name) + '.webp'; img.alt = accessibleName; img.addEventListener('error', () => img.hidden = true, {once:true}); return img;
}
function portrait(id, name) {
  const safeName = name.replace(/:/g,'_'); const img = document.createElement('img');
  img.src = `${imageBase}digimon/${encodeURIComponent(safeName)}/${encodeURIComponent(safeName)}.webp`; img.alt = name;
  img.addEventListener('error', () => { const fallback = document.createElement('span'); fallback.textContent = '이미지 없음'; $(id).replaceChildren(fallback); }, {once:true});
  $(id).replaceChildren(img);
}
function attribute(id, name) { $(id).replaceChildren(...(name ? [icon(name), document.createTextNode(name)] : [document.createTextNode('없음')])); }
function currentDigimon() { return digimonData[$('character-select').value]; }
function currentSkill() { return currentDigimon()?.skills?.[Number($('skill-select').value.replace('skill',''))-1]; }
function currentMob() {return mobData.find(row => row[0] === $('map1-select').value && row[1] === $('map2-select').value && row[2] === $('mob-select').value);}
function populateCharacters(preferred) {
  options('character-select', Object.keys(digimonData).filter(name => digimonData[name].evolution_stage === $('stage-select').value), preferred);
  populateSkills();
}
function populateSkills() {
  const d = currentDigimon();
  $('character-name').textContent = $('character-select').value;
  $('character-meta').replaceChildren(icon(d.type, d.type), document.createTextNode(`Lv.${d.stats.level}`));
  $('힘-cell').textContent = format(d.stats.STR);
  portrait('character-image-cell', $('character-select').value);
  options('skill-select', (d.skills || []).map((skill, i) => [`skill${i+1}`, `${i+1}. ${skill.name}`]));
  $('skilllevel-select').value = '1레벨'; populateElements();
}
function populateElements() {
  const skill = currentSkill();
  const convertible = [...new Set([skill?.attribute, ...(Array.isArray(skill?.change) ? skill.change : [])].filter(Boolean))];
  options('skill-element', convertible, skill?.attribute);
  $('element-options').replaceChildren(...convertible.map(element => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'element-button';
    button.dataset.element = element; button.setAttribute('aria-pressed', String(element === skill.attribute));
    button.append(icon(element), document.createTextNode(element));
    button.addEventListener('click', () => {$('skill-element').value = element; refresh();});
    return button;
  }));
}
function populateMaps() {
  options('map2-select', [...new Set(mobData.filter(row => row[0] === $('map1-select').value).map(row => row[1]))]); populateMobs();
}
function populateMobs() {
  options('mob-select', [...new Set(mobData.filter(row => row[0] === $('map1-select').value && row[1] === $('map2-select').value).map(row => row[2]))]); showMob();
}
function showMob() {
  const mob = currentMob(); if (!mob) return;
  $('mob-name').textContent = mob[2]; $('mob-meta').replaceChildren(icon(mob[4], mob[4]), document.createTextNode(`Lv.${mob[3]}`));
  portrait('mob-image-cell', mob[2]); $('mob-hp').textContent = format(mob[5]); $('mob-def').textContent = format(mob[6]); attribute('mob-weak',mob[7]); attribute('mob-strong',mob[8]);
}
function getCalculationContext(context) { return context; }
function contextFor(version) { return {hasStrengthResult:false,isCurrent:()=>version === calculationVersion,getDigimonData:async()=>digimonData,getMobData:async()=>mobData}; }
function clearResults(message) {
  $('needstr').textContent = '—'; $('result-caption').textContent = message; $('result-caption').hidden = false; $('probability-bar').style.width = '0%';
  for (const id of ['str-result','result-coefficient','normal-damage','critical-damage']) $(id).textContent = '—';
}
async function refresh() {
  const version = ++calculationVersion;
  const manual = $('manual-mode').checked;
  $('normal-inputs').hidden = manual; $('manual-inputs').hidden = !manual;
  $('manual-inputs').querySelectorAll('input,select').forEach(input => input.disabled = !manual);
  const skill = currentSkill(), mob = currentMob();
  const selectedElement = manual ? $('manual-skill-element').value : $('skill-element').value;
  document.querySelectorAll('.element-button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.element === selectedElement)));
  $('result-element').textContent = selectedElement || '없음';
  $('result-caption').textContent = '';
  $('result-caption').hidden = true;
  const targetType = manual ? $('manual-target-type').value : skill?.target_count;
  $('mob-count').disabled = targetType !== '전체';
  $('dmg-max').setCustomValidity(number('dmg-min',95) > number('dmg-max',105) ? '최대값은 최소값 이상이어야 합니다.' : '');
  const invalid = [...$('calculator-form').querySelectorAll('input,select')].find(input => !input.disabled && !input.validity.valid);
  if (invalid) {clearResults('입력 범위를 확인해 주세요. 최소 데미지는 최대값 이하이어야 합니다.'); return;}
  if (!mob || (!manual && (!skill || !(Number(currentDigimon().stats.level)>0) || !(Number(currentDigimon().stats.STR)>0)))) {
    clearResults('선택한 디지몬의 계산용 스탯 또는 스킬 데이터가 없습니다. 수동 입력을 이용해 주세요.'); return;
  }
  await calculateProbability(contextFor(version));
  if (version !== calculationVersion) return;
  $('str-result').textContent = format($('str-result').textContent);
  $('probability-bar').style.width = `${parseFloat($('needstr').textContent) || 0}%`;
}
document.addEventListener('calculation-detail', event => {
  const d = event.detail;
  $('result-coefficient').textContent = d.skillCoefficient.toFixed(4);
  $('normal-damage').textContent = `${format(d.normalMinDmg*d.effectiveHits)} ~ ${format(d.normalMaxDmg*d.effectiveHits)}`;
  $('critical-damage').textContent = `${format(d.critMinDmg*d.effectiveHits)} ~ ${format(d.critMaxDmg*d.effectiveHits)}`;
});
$('calculator-form').addEventListener('submit', event => event.preventDefault());
$('calculator-form').addEventListener('change', event => {
  const id = event.target.id;
  if (id === 'stage-select') populateCharacters();
  if (id === 'character-select') populateSkills();
  if (id === 'skill-select') populateElements();
  if (id === 'map1-select') populateMaps();
  if (id === 'map2-select') populateMobs();
  if (id === 'mob-select') showMob();
  refresh();
});
$('calculator-form').addEventListener('input', event => {if (event.target.tagName === 'INPUT' && event.target.type !== 'checkbox') refresh();});
$('reset').addEventListener('click', () => { if (!digimonData) return; HTMLFormElement.prototype.reset.call($('calculator-form')); setDefaults(); refresh(); });
function setDefaults() {
  $('stage-select').value = '성장기'; populateCharacters(digimonData['아구몬'] ? '아구몬' : undefined);
  $('map1-select').value = [...$('map1-select').options].some(option=>option.value==='현실 세계') ? '현실 세계' : $('map1-select').options[0].value; populateMaps();
}
async function load() {
  try {
    const [json,csv] = await Promise.all([fetch('https://media.dsrwiki.com/data/csv/digimon.json'),fetch('https://media.dsrwiki.com/data/csv/mob.csv')]);
    if (!json.ok || !csv.ok) throw new Error('데이터 파일을 찾을 수 없습니다.');
    digimonData = await json.json();
    mobData = (await csv.text()).trim().split(/\r?\n/).slice(1).map(row=>row.split(',').map(cell=>cell.trim())).filter(row=>row.length>=9 && row[2]);
    if (!Object.keys(digimonData).length || !mobData.length) throw new Error('계산 데이터가 비어 있습니다.');
    options('skilllevel-select', Array.from({length:10},(_,i)=>`${i+1}레벨`));
    options('manual-skill-element', elements, '물리');
    options('map1-select', [...new Set(mobData.map(row=>row[0]))]);
    setDefaults(); $('status').hidden=true; $('calculator-form').hidden=false; await refresh();
  } catch(error) {
    console.error(error); $('status').replaceChildren(document.createTextNode('데이터를 불러오지 못했습니다. '));
    const retry = document.createElement('button'); retry.type='button';retry.className='quiet-button';retry.textContent='다시 시도';retry.addEventListener('click',load);$('status').append(retry);
  }
}
load();
