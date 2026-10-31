import { tasks } from './tasks.js';
const list=document.getElementById('tasks'),search=document.getElementById('search');
for(const task of tasks){
  const link=document.createElement('a');link.className=`task-card task-${task.number}`;link.href=`/${task.slug}/`;
  link.dataset.search=[task.number,task.title,task.category,...task.features].join(' ').toLowerCase();
  const art=document.createElement('div');art.className='task-art';art.setAttribute('aria-hidden','true');
  const symbol=document.createElement('span');symbol.textContent=task.symbol;art.append(symbol);
  const body=document.createElement('div');body.className='task-body';
  const meta=document.createElement('div');meta.className='task-meta';
  const number=document.createElement('span');number.textContent=`#${task.number} · ${task.category}`;
  const difficulty=document.createElement('span');difficulty.className=`difficulty ${task.difficulty.toLowerCase()}`;difficulty.textContent=task.difficulty;meta.append(number,difficulty);
  const title=document.createElement('h3');title.textContent=task.title;
  const description=document.createElement('p');description.textContent=task.description;
  const tags=document.createElement('div');tags.className='tags';for(const feature of task.features){const tag=document.createElement('span');tag.textContent=feature;tags.append(tag);}
  const bottom=document.createElement('div');bottom.className='card-bottom';const language=document.createElement('span');language.textContent=`${task.language} · Interactive 3D`;const action=document.createElement('strong');action.textContent='Open explorer ↗';bottom.append(language,action);
  body.append(meta,title,description,tags,bottom);link.append(art,body);list.append(link);
}
function filter(){let count=0;for(const card of list.children){card.hidden=!card.dataset.search.includes(search.value.trim().toLowerCase());if(!card.hidden)count++;}document.getElementById('task-count').textContent=String(count).padStart(2,'0');document.getElementById('empty').hidden=count!==0;}
search.addEventListener('input',filter);filter();
