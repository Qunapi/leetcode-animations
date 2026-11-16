import { createPlayback, mountCode } from '/explorer-ui.js';
import { source } from './code.js';
import { cacheSteps, parseOperations } from './solver.js';

const $ = id => document.getElementById(id);
const examples = {
  mixed: 'put 1 10\nput 2 20\nget 1\nput 3 30\nget 2\nget 3\nput 4 40',
  tie: 'put 1 10\nput 2 20\nput 3 30\nget 1',
  update: 'put 1 10\nput 2 20\nput 1 11\nput 3 30\nget 1',
};
let capacity = 2;
let operations = parseOperations(examples.mixed);
$('operations').value = examples.mixed;
const highlight = mountCode(source);

const playback = createPlayback(() => cacheSteps(capacity, operations), state => {
  $('status').textContent = state.message;
  $('min').textContent = `minFrequency = ${state.min}`;
  $('nodes').replaceChildren(...state.nodes.map(({ key, value, freq }) => {
    const entry = document.createElement('li');
    entry.textContent = `${key} → value ${value}, frequency ${freq}`;
    entry.classList.toggle('active', key === state.key);
    return entry;
  }));
  $('buckets').replaceChildren(...state.buckets.map(([freq, keys]) => {
    const row = document.createElement('div');
    row.className = 'bucket';
    row.classList.toggle('minimum', freq === state.min);
    const title = document.createElement('h3');
    title.textContent = `Frequency ${freq}${freq === state.min ? ' · minimum' : ''}`;
    const list = document.createElement('ul');
    for (const [index, key] of keys.entries()) {
      const entry = document.createElement('li');
      const { value } = state.nodes.find(node => node.key === key);
      entry.textContent = `${key}:${value}${index === 0 ? ' · MRU' : ''}${index === keys.length - 1 ? ' · LRU' : ''}`;
      entry.classList.toggle('active', key === state.key);
      list.append(entry);
    }
    if (!keys.length) {
      const empty = document.createElement('li');
      empty.textContent = 'Empty';
      list.append(empty);
    }
    for (const label of ['head', 'tail']) {
      const sentinel = document.createElement('li');
      sentinel.className = 'sentinel';
      sentinel.textContent = label;
      if (label === 'head') list.prepend(sentinel);
      else list.append(sentinel);
    }
    row.append(title, list);
    return row;
  }));
  if (!state.buckets.length) $('buckets').textContent = 'No frequency buckets yet.';
  highlight(state.line || -1);
});

$('config').onsubmit = event => {
  event.preventDefault();
  try {
    operations = parseOperations($('operations').value);
  } catch (error) {
    $('error').textContent = error.message;
    return;
  }
  capacity = $('capacity').valueAsNumber;
  $('error').textContent = '';
  $('example').value = Object.keys(examples).find(name => examples[name] === $('operations').value) ?? '';
  playback.reset();
};
$('example').onchange = () => {
  $('operations').value = examples[$('example').value];
  $('capacity').value = 2;
  $('config').requestSubmit();
};
playback.reset();
