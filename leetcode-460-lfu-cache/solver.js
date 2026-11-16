export function parseOperations(text) {
  const lines = text.trim().split('\n');
  if (lines.length > 60) throw new Error('Enter at most 60 operations.');
  return lines.map((line, index) => {
    const match = line.trim().match(/^(get|put)\s+(\d+)(?:\s+(\d+))?$/i);
    if (!match || (match[1].toLowerCase() === 'put') !== (match[3] !== undefined) ||
        Number(match[2]) > 100000 || Number(match[3]) > 1000000000) {
      throw new Error(`Line ${index + 1}: use get KEY or put KEY VALUE with nonnegative integers.`);
    }
    return [match[1].toLowerCase(), Number(match[2]), Number(match[3])];
  });
}

export function* cacheSteps(capacity, operations) {
  const nodes = new Map();
  const buckets = new Map();
  let min = 0;
  const bucket = freq => {
    if (!buckets.has(freq)) buckets.set(freq, []);
    return buckets.get(freq);
  };
  // Trace buckets store keys in linked-list order for display.
  const snapshot = (type, line, message, key) => ({
    type, line, message, key, min,
    nodes: [...nodes.values()].map(node => ({ ...node })),
    buckets: [...buckets].sort(([a], [b]) => a - b).map(([freq, keys]) => [freq, [...keys]]),
  });

  yield snapshot('start', 'minFrequency = 0', `Empty cache with capacity ${capacity}.`);
  for (const [op, key, value] of operations) {
    const label = op === 'get' ? `Get(${key})` : `Put(${key}, ${value})`;
    const event = (line, message, active = key) => snapshot('step', line, `${label} · ${message}`, active);
    const node = nodes.get(key);
    yield event(op === 'get' ? 'if (!nodes.TryGetValue' : 'if (nodes.TryGetValue', node ? 'Key found.' : 'Key absent.');
    if (op === 'get' && !node) {
      yield event('return -1', 'Return −1.');
      continue;
    }
    if (node) {
      if (op === 'put') {
        node.value = value;
        yield event('node.Value = value', `Update value to ${value}.`);
      }
      const old = bucket(node.freq);
      old.splice(old.indexOf(key), 1);
      yield event('oldList.Remove(node)', `Unlink key ${key} from frequency ${node.freq}.`);
      if (!old.length && node.freq === min) {
        min++;
        yield event('minFrequency++', `Minimum frequency rises to ${min}.`);
      }
      node.freq++;
      yield event('node.Freq++', `Increase frequency to ${node.freq}.`);
      bucket(node.freq).unshift(key);
      yield event('freqsMap[node.Freq].AddFirst', `Move key ${key} to the MRU end of frequency ${node.freq}.`);
      if (op === 'get') yield event('return node.Value', `Return ${node.value}.`);
      continue;
    }
    if (nodes.size === capacity) {
      const victim = bucket(min).pop();
      yield event('var removed = oldList.RemoveLast', `Unlink key ${victim}, the LRU entry at minimum frequency ${min}.`, victim);
      nodes.delete(victim);
      yield event('nodes.Remove(removed.Key)', `Evict key ${victim} from the dictionary.`, victim);
    }
    nodes.set(key, { key, value, freq: 1 });
    yield event('nodes[key] = node', `Add key ${key} to the dictionary.`);
    bucket(1).unshift(key);
    yield event('freqsMap[1].AddFirst', 'Insert at the MRU end of frequency 1.');
    min = 1;
    yield event('minFrequency = 1', 'Minimum frequency is 1.');
  }
  yield snapshot('done', '', 'All operations complete.');
}
