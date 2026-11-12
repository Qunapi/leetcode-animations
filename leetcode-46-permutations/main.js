import { createScene } from '/explorer-scene.js';
import { createPlayback, mountCode } from '/explorer-ui.js';
import { recursionTrace, validateInput } from './solver.js';

const $ = id => document.getElementById(id);
const source = next => `function permute(a) {
  const results = [];
  function backtrack(start) {
    if (start === a.length) {
      results.push([...a]);
      return;
    }
    for (let i = start; i < a.length; i++) {
      [a[start], a[i]] = [a[i], a[start]];
      backtrack(${next} + 1);
      [a[start], a[i]] = [a[i], a[start]];
    }
  }
  backtrack(0);
  return results;
}`;
const lines = { enter: 2, save: 4, swap: 8, recurse: 9, undo: 10, done: 14 };
const url = new URL(location.href);
let values = validateInput($('values').value);
if (url.searchParams.has('values')) {
  try {
    values = validateInput(url.searchParams.get('values'));
  } catch {
    $('error').textContent = 'The URL array is invalid. Using the default array.';
  }
}
$('values').value = values.join(', ');
let mode = url.searchParams.get('mode') === 'i' ? 'i' : 'start';

const modeButtons = [...$('mode').querySelectorAll('button')];

function saveSettings() {
  for (const button of modeButtons) button.setAttribute('aria-pressed', String(button.value === mode));
  const example = values.join(', ');
  $('example').value = [...$('example').options].some(option => option.value === example) ? example : '';
  url.searchParams.set('values', values.join(','));
  url.searchParams.set('mode', mode);
  history.replaceState(history.state, '', url);
}

saveSettings();
const treeColors = Object.fromEntries(
  [...document.querySelectorAll('.tree-panel .legend i')].map(marker => {
    const style = getComputedStyle(marker);
    return [marker.className, { color: style.backgroundColor, fill: style.getPropertyValue('--card-fill').trim() }];
  }),
);
const scene = createScene({ fitContent: true, nodeCards: true });
let nodes, links, swaps;
let highlight = mountCode(source(mode));

const playback = createPlayback(
  () => {
    const trace = recursionTrace(values, mode === 'i');
    scene.clear();
    ({ nodes, sceneLinks: links, swaps } = trace);
    return trace.steps.map((step, frame) => ({ ...step, frame })).values();
  },
  ({ type, start, i, next, array, stack, results, active, stackIds, seen, missing, frame }) => {
    scene.update([...nodes, ...swaps].map(node => {
      const state = typeof node.id === 'string' ? 'swap' : node.ghost ? 'ghost' : node.skipAt <= frame ? 'jump'
        : node.id === active ? 'current' : stackIds.includes(node.id) ? 'stack-parent'
        : node.id >= seen ? 'idle'
        : node.leaf && node.resultIndex < results.length ? 'goal' : 'visited';
      return { ...node, active: node.id === active, ...treeColors[state] };
    }), links);
    const inLoop = ['swap', 'recurse', 'undo'].includes(type);
    $('indices').textContent = `start = ${stack.length ? start : '—'} · i = ${inLoop ? i : '—'}`;
    $('missing').replaceChildren(...missing.map(result => {
      const item = document.createElement('li');
      item.textContent = `[${result.join(', ')}]`;
      return item;
    }));
    $('missing-panel').hidden = missing.length === 0;
    const expected = array.reduce((product, _, index) => product * (index + 1), 1);
    const swapping = inLoop;
    const skipped = type === 'recurse' && next > start + 1;
    $('array').replaceChildren(...array.map((value, index) => {
      const tile = document.createElement('li');
      const label = document.createElement('small');
      const active = swapping && (index === start || index === i);
      const gap = skipped && index > start && index < next;
      label.textContent = `${index}${gap ? ' · skipped' : ''}`;
      tile.className = gap ? 'skipped' : active ? 'active' : type === 'save' ? 'saved' : '';
      tile.append(label, String(value));
      return tile;
    }));
    $('status').textContent = {
      enter: `Enter backtrack(${start}).`,
      swap: start === i ? `Keep index ${start} in place (self-swap).` : `Swap indices ${start} and ${i}.`,
      recurse: skipped ? `Call backtrack(${next}), skipping indices ${start + 1} through ${next - 1}.` : `Call backtrack(${next}) to fill the next slot.`,
      save: `Save [${array.join(', ')}].`,
      undo: `Undo the swap of indices ${start} and ${i}.`,
      missing: `Missing permutation ${missing.length} of ${expected - results.length}: [${missing.at(-1)?.join(', ')}].`,
      done: `Complete. Found ${results.length} of ${expected} permutations. Missed ${expected - results.length}.`,
    }[type];
    $('count').textContent = `${results.length} / ${expected}`;
    $('results').replaceChildren(...results.map(result => {
      const item = document.createElement('li');
      item.textContent = `[${result.join(', ')}]`;
      return item;
    }));
    $('stack').textContent = stack.map(index => `backtrack(${index})`).join(' → ') || 'Empty';
    highlight(lines[type] ?? 14);
  },
);

for (const button of modeButtons) {
  button.onclick = () => {
    if (mode === button.value) return;
    mode = button.value;
    $('code').replaceChildren();
    highlight = mountCode(source(mode));
    saveSettings();
    playback.reset();
  };
}
$('input').onsubmit = event => {
  event.preventDefault();
  try {
    values = validateInput($('values').value);
  } catch (error) {
    $('error').textContent = error.message;
    $('values').setAttribute('aria-invalid', 'true');
    return;
  }
  $('error').textContent = '';
  $('values').removeAttribute('aria-invalid');
  saveSettings();
  playback.reset();
};
$('example').onchange = () => {
  $('values').value = $('example').value;
  $('input').requestSubmit();
};
playback.reset();
