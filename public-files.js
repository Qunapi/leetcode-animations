import {tasks} from './tasks.js';
export const publicFiles=[
  '/index.html','/chooser.js','/chooser.css','/tasks.js','/navigation.css','/explorer.css','/explorer-ui.js','/explorer-scene.js',
  '/node_modules/three/build/three.module.js',
  '/node_modules/three/build/three.core.js',
  '/node_modules/three/examples/jsm/controls/OrbitControls.js',
  ...tasks.flatMap(task=>task.files.map(file=>`/${task.slug}/${file}`)),
];
