export function validateInput(text) {
  const tokens = text.split(',').map(token => token.trim());
  const values = tokens.map(Number);
  if (tokens.length > 4 || tokens.some(token => !/^-?\d+$/.test(token)) ||
      values.some(value => value < -10 || value > 10) || new Set(values).size !== values.length) {
    throw new Error('Enter 1–4 distinct integers from −10 to 10, separated by commas.');
  }
  return values;
}

export function* permutationSteps(values, useCandidate = false) {
  const array = [...values];
  const stack = [];
  const results = [];
  const swap = (a, b) => { [array[a], array[b]] = [array[b], array[a]]; };
  const snapshot = (type, start, i = start) => ({
    type, start, i, next: (useCandidate ? i : start) + 1,
    array: [...array], stack: [...stack], results: [...results],
  });

  function* backtrack(start) {
    stack.push(start);
    yield snapshot('enter', start);
    if (start === array.length) {
      results.push([...array]);
      yield snapshot('save', start);
    } else {
      for (let i = start; i < array.length; i++) {
        swap(start, i);
        yield snapshot('swap', start, i);
        yield snapshot('recurse', start, i);
        yield* backtrack((useCandidate ? i : start) + 1);
        swap(start, i);
        yield snapshot('undo', start, i);
      }
    }
    stack.pop();
  }

  yield* backtrack(0);
  yield snapshot('done', 0);
}

export function recursionTrace(values, useCandidate) {
  const nodes = [];
  const links = [];
  const path = [];
  const steps = [];
  let resultIndex = 0;
  let incoming;

  for (const step of permutationSteps(values, useCandidate)) {
    const depth = step.stack.length - 1;
    if (step.type === 'recurse') {
      incoming = step;
      if (step.next > step.start + 1) path[depth].skipAt ??= steps.length;
    }
    if (step.type === 'enter') {
      const parent = path[depth - 1];
      const node = {
        id: nodes.length,
        key: parent ? `${parent.key}/${incoming.start}:${incoming.i}` : '',
        parent,
        text: `[${step.array.join(', ')}]`,
        array: step.array,
        detail: depth === 0 ? 'start 0' : `start ${step.start} · i ${incoming.i}`,
        leaf: step.start === values.length,
        resultIndex,
        skipped: depth > 0 && step.start > incoming.start + 1,
        children: [],
        position: [0, -depth * 1.45, depth * -.35],
      };
      if (parent) {
        parent.children.push(node);
        links.push([parent.id, node.id]);
      }
      if (node.leaf) resultIndex++;
      nodes.push(node);
      path[depth] = node;
    }
    steps.push({ ...step, active: path[depth]?.id, stackIds: path.slice(0, depth + 1).map(node => node.id), seen: nodes.length, missing: [] });
  }
  if (useCandidate) {
    const done = steps.pop();
    const found = new Set(done.results.map(result => result.join(',')));
    const actual = new Map(nodes.map(node => [node.key, node]));
    const comparison = recursionTrace(values, false);
    const missingPaths = new Set();
    for (const leaf of comparison.nodes.filter(node => node.leaf)) {
      if (found.has(leaf.array.join(','))) continue;
      for (let node = leaf; node && !missingPaths.has(node); node = node.parent) {
        missingPaths.add(node);
      }
    }
    for (const original of comparison.nodes) {
      if (!missingPaths.has(original)) continue;
      const matching = actual.get(original.key);
      if (matching && matching.detail === original.detail) continue;
      const parent = actual.get(original.parent.key);
      const ghost = {
        ...original,
        id: nodes.length,
        parent,
        ghost: true,
        children: [],
        position: [...original.position],
      };
      actual.set(original.key, ghost);
      nodes.push(ghost);
      parent.children.push(ghost);
      links.push([parent.id, ghost.id]);
    }

    let missing = [];
    for (const step of permutationSteps(values)) {
      if (step.type !== 'save' || found.has(step.array.join(','))) continue;
      missing = [...missing, step.array];
      steps.push({ ...done, type: 'missing', missing });
    }
    steps.push({ ...done, missing });
  }
  const swaps = [];
  for (const ghost of nodes.filter(node => node.ghost)) {
    const parent = ghost.parent;
    const real = parent.children.find(node => !node.ghost && node.key === ghost.key);
    if (!real) continue;
    const swap = {
      id: `swap:${real.id}`,
      text: real.text,
      detail: `Swap ${real.key.split('/').at(-1).replace(':', ' ↔ ')}`,
      position: [...real.position],
      children: [real, ghost],
    };
    parent.children.splice(parent.children.indexOf(real), 1, swap);
    parent.children.splice(parent.children.indexOf(ghost), 1);
    swaps.push(swap);
  }

  let column = 0;
  const sceneLinks = [];
  function layout(node, depth = 0) {
    node.position[1] = -depth * 1.45;
    node.position[2] = -depth * .35;
    for (const child of node.children) {
      sceneLinks.push([node.id, child.id]);
      layout(child, depth + 1);
    }
    node.position[0] = node.children.length
      ? (node.children[0].position[0] + node.children.at(-1).position[0]) / 2
      : column++ * 2.45;
  }
  layout(nodes[0]);
  return { nodes, links, steps, swaps, sceneLinks };
}
