import { createPlayback, mountCode } from '/explorer-ui.js';
import { permutationSteps, validateInput } from './solver.js';

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
let values = validateInput($('values').value);
let highlight = mountCode(source('start'));

const playback = createPlayback(
  () => permutationSteps(values, $('mode').value === 'i'),
  ({ type, start, i, next, array, stack, results }) => {
    const expected = array.reduce((product, _, index) => product * (index + 1), 1);
    const swapping = ['swap', 'recurse', 'undo'].includes(type);
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
      done: `Complete. Found ${results.length} of ${expected} permutations. Missed ${expected - results.length}.`,
    }[type];
    $('count').textContent = `${results.length} / ${expected}`;
    $('results').replaceChildren(...results.map(result => {
      const item = document.createElement('li');
      item.textContent = `[${result.join(', ')}]`;
      return item;
    }));
    $('stack').textContent = stack.map(index => `backtrack(${index})`).join(' → ') || 'Empty';
    highlight(lines[type]);
  },
);

$('mode').onchange = () => {
  $('code').replaceChildren();
  highlight = mountCode(source($('mode').value));
  playback.reset();
};
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
  $('example').value = [...$('example').options].some(option => option.value === values.join(', ')) ? values.join(', ') : '';
  playback.reset();
};
$('example').onchange = () => {
  $('values').value = $('example').value;
  $('input').requestSubmit();
};
playback.reset();
