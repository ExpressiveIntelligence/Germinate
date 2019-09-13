// ❌
// ↩

function upcaseFirst(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

let lastID = -1;
function getNextID() {
  lastID++;
  return 'id' + lastID;
}

let triggerConditions = {
  rvalGte: ['resource', 'value'],
  rvalLte: ['resource', 'value'],
  collide: ['first entity', 'second entity'],
  entClick: ['entity'],
  mouseClick: [],
  mouseHold: [],
  keyPress: ['key'],
  keyHold: ['key'],
  timerDone: ['timer'],
  tick: []
};

let triggerActions = {
  setRval: ['resource', 'value'],
  incRval: ['resource', 'amount'],
  decRval: ['resource', 'amount'],
  teleport: ['entity', 'target'],
  moveEntToward: ['entity', 'target'],
  moveEntAway: ['entity', 'target'],
  moveEntDir: ['entity', 'direction'],
  restitution: ['first entity', 'second entity'],
  rotEntBy: ['entity', 'angle'],
  entLookAt: ['entity', 'target'],
  setEntSprite: ['entity', 'sprite'],
  setEntColor: ['entity', 'color'],
  setEntSize: ['entity', 'size'],
  spawnEnt: ['entity', 'target'],
  deleteEnt: ['entity'],
  win: ['message'],
  lose: ['message'],
  timerStart: ['timer'],
  timerPause: ['timer'],
  timerRestart: ['timer']
};

let tagFamilies = {
  optional: {
    name: 'optional',
    text: 'It is',
    tags: ['optional'],
    appliesTo: ['entity', 'resource', 'outcome']
  },
  playerAttitude: {
    name: 'playerAttitude',
    text: 'Player thinks it\'s',
    tags: ['good', 'neutral', 'bad', 'complicated'],
    appliesTo: ['entity', 'resource', 'outcome']
  },
  initialLevel: {
    name: 'initialLevel',
    text: 'Value starts off',
    tags: ['full', 'high', 'middling', 'low', 'empty'],
    appliesTo: ['resource']
  },
  tendency: {
    name: 'tendency',
    text: 'Tends to',
    tags: ['increase rapidly', 'increase slowly', 'stay the same',
           'decrease slowly', 'decrease rapidly', 'fluctuate wildly'],
    appliesTo: ['resource']
  }
};

function parseTag(fullTagText) {
  console.log('parseTag', fullTagText);
  let tagFamily = Object.values(tagFamilies).find(family => fullTagText.startsWith(family.text));
  let tagValue = fullTagText.replace(tagFamily.text, '').trim();
  return {family: tagFamily.name, familyInfo: tagFamily, value: tagValue};
}

function activeTags(thingNode) {
  return [...thingNode.querySelectorAll('.tag')].map(tn => parseTag(tn.innerText));
}

function cycleTag(fullTagText) {
  let tag = parseTag(fullTagText);
  let tagFamily = tag.familyInfo;
  let tagValue = tag.value;
  let tagIndex = tagFamily.tags.indexOf(tagValue);
  let nextTagIndex = (tagIndex + 1 >= tagFamily.tags.length) ? 0 : tagIndex + 1;
  return tagFamily.text + ' ' + tagFamily.tags[nextTagIndex];
}


let exampleIntent = {};

function addThingToIntent(thing, type) {
  let id = getNextID();
  thing.id = id;
  if (type) thing.type = type;
  if (!thing.type) console.error('thing must have type!', thing);
  exampleIntent[id] = thing;
}

let exampleEntities = [
  {
    name: "Friend",
    icon: "💁",
    tags: [
      {family: 'playerAttitude', value: 'good'}
    ]
  },
  {
    name: "",
    icon: "❓",
    tags: [
      {family: 'optional', value: 'optional'}
    ]
  }
];

let exampleResources = [
  {
    name: "Depression",
    tags: [
      {family: 'playerAttitude', value: 'bad'},
      {family: 'initialLevel', value: 'low'},
      {family: 'tendency', value: 'increase slowly'}
    ]
  },
  {
    name: "Resource2",
    tags: [
      {family: 'optional', value: 'optional'},
      {family: 'playerAttitude', value: 'bad', isNegated: true},
    ]
  }
];

let exampleRelationships = [
  {
    lhs: "Friend",
    reltype: "collides with",
    rhs: "Insecurity"
  },
  {
    lhs: "Insecurity",
    reltype: "produces",
    rhs: "Depression"
  }
];

let exampleTriggers = [
  {
    when: [
      {
        cond: 'Resource greater than value',
        params: ['Depression', '5']
      }
    ],
    then: [
      {action: 'Spawn entity at', params: ['Friend', '0,0']}
    ]
  }
];

for (let entity of exampleEntities) {
  addThingToIntent(entity, 'entity');
}
for (let resource of exampleResources) {
  addThingToIntent(resource, 'resource');
}
for (let relationship of exampleRelationships) {
  addThingToIntent(relationship, 'relationship');
}
for (let trigger of exampleTriggers) {
  addThingToIntent(trigger, 'trigger');
}

function createNode(html) {
  let div = document.createElement('div');
  div.innerHTML = html;
  return div.firstChild;
}

function negateTag(tagNode) {
  if (tagNode.classList.contains('negated')) {
    tagNode.classList.remove('negated');
  } else {
    tagNode.classList.add('negated');
  }
}

function wireUpOnclickHandlers(thingNode) {
  for (let editTagsLink of thingNode.querySelectorAll('.edit-tags')) {
    editTagsLink.onclick = function() {
      openTagEditor(thingNode);
    };
  }
  for (let deleteButton of thingNode.querySelectorAll('.delete')) {
    deleteButton.onclick = function() {
      thingNode.remove();
    }
  }
  for (let tagNode of thingNode.querySelectorAll('.tag')) {
    tagNode.onclick = function() {
      if (negateModeActive) {
        negateTag(tagNode);
      } else {
        tagNode.innerText = cycleTag(tagNode.innerText);
      }
    }
  }
}

function createEntityNode(entity) {
  let html = `<div class="thing entity" id="${entity.id}">
    <div class="minibutton randomize" title="Randomize this entity">🎲</div>
    <div class="minibutton delete" title="Delete this entity">🗑️</div>
    <input type="text" class="thing-name" value="${entity.name}"
           placeholder="[random name]">
    <div class="entity-icon">${entity.icon}</div>
    <div class="tags">`;
  for (let tag of entity.tags) {
    let tagText = tagFamilies[tag.family].text + ' ' + tag.value;
    html += `<span class="tag${tag.isNegated ? ' negated' : ''}">${upcaseFirst(tagText.trim())}</span>`
  }
  html += `</div><a class="edit-tags">edit tags</a>`;
  html += `</div>`;
  let node = createNode(html);
  wireUpOnclickHandlers(node);
  return node;
}

function createStaticEntityNode(entity) {
  let html = `<div class="thing entity static" id="static_${entity.id}">
    <div class="minibutton import" title="Add to intent">↩️</div>
    <div class="thing-name">${entity.name}</div>
    <div class="entity-icon">${entity.icon}</div>
    <div class="tags">`;
  for (let tag of entity.tags) {
    let tagText = tagFamilies[tag.family].text + ' ' + tag.value;
    html += `<span class="tag${tag.isNegated ? ' negated' : ''}">${upcaseFirst(tagText.trim())}</span>`
  }
  html += `</div>`;
  return createNode(html);
}

function createResourceNode(resource) {
  let html = `<div class="thing resource" id="${resource.id}">
    <div class="minibutton randomize" title="Randomize this resource">🎲</div>
    <div class="minibutton delete" title="Delete this resource">🗑️</div>
    <input type="text" class="thing-name" value="${resource.name}"
           placeholder="[random name]">
    <div class="tags">`;
  for (let tag of resource.tags) {
    let tagText = tagFamilies[tag.family].text + ' ' + tag.value;
    html += `<span class="tag${tag.isNegated ? ' negated' : ''}">${upcaseFirst(tagText.trim())}</span>`
  }
  html += `</div><a class="edit-tags">edit tags</a>`;
  html += `</div>`;
  let node = createNode(html);
  wireUpOnclickHandlers(node);
  return node;
}

function createStaticResourceNode(resource) {
  let html = `<div class="thing resource static" id="static_${resource.id}">
    <div class="minibutton import" title="Add to intent">↩️</div>
    <div class="thing-name">${resource.name}</div>
    <div class="tags">`;
  for (let tag of resource.tags) {
    let tagText = tagFamilies[tag.family].text + ' ' + tag.value;
    html += `<span class="tag${tag.isNegated ? ' negated' : ''}">${upcaseFirst(tagText.trim())}</span>`
  }
  html += `</div>`;
  return createNode(html);
}

function createRelationshipNode(relationship) {
  let html = `<div class="relationship" id="${relationship.id}">
    <div class="minibutton randomize" title="Randomize this relationship">🎲</div>
    <span class="not">NOT </span>
    <input type="text" value="${relationship.lhs}" placeholder="Something">
    <select>
      <option value=""${relationship.reltype === 'is related to' ? ' selected' : ''}>is related to</option>
      <option value=""${relationship.reltype === 'consumes' ? ' selected' : ''}>consumes</option>
      <option value=""${relationship.reltype === 'produces' ? ' selected' : ''}>produces</option>
      <option value=""${relationship.reltype === 'defeats' ? ' selected' : ''}>defeats</option>
      <option value=""${relationship.reltype === 'avoids' ? ' selected' : ''}>avoids</option>
      <option value=""${relationship.reltype === 'collides with' ? ' selected' : ''}>collides with</option>
    </select>
    <input type="text" value="${relationship.rhs}" placeholder="something">
    <div class="minibutton delete" title="Delete this relationship">🗑️</div>
  </div>`;
  let node = createNode(html);
  wireUpOnclickHandlers(node);
  node.onclick = function() {
    if (negateModeActive) {
      if (node.classList.contains('negated')) {
        node.classList.remove('negated');
      } else {
        node.classList.add('negated');
      }
    }
  }
  return node;
}

function createStaticRelationshipNode(relationship) {
  let html = `<div class="relationship static" id="static_${relationship.id}">
    <span class="lhs">${relationship.lhs}</span>
    <span> ${relationship.reltype} </span>
    <span class="rhs">${relationship.rhs}</span>
    <div class="minibutton import" title="Add to intent">↩️</div>
  </div>`;
  let node = createNode(html);
  return node;
}

function createTagEditorNode(thingType, thingNode) {
  let thingTags = activeTags(thingNode);
  let html = `<div class="tag-editor">
    <div class="close-tag-editor">X</div>`;
  for (let familyName of Object.keys(tagFamilies)) {
    let family = tagFamilies[familyName];
    if (family.appliesTo.indexOf(thingType) < 0) continue;
    html += `<div class="tag-family">${family.text}: `;
    for (let tag of family.tags) {
      let isActiveOnThing = thingTags.find(t => t.value === tag && t.family === familyName);
      html += `<span class="tag${isActiveOnThing ? ' active' : ''}">${tag}</span>`;
    }
    html += `</div>`;
  }
  html += `</div>`;
  let node = createNode(html);
  let closeTagEditor = node.querySelector('.close-tag-editor');
  closeTagEditor.onclick = function() {
    node.remove();
  }
  for (let tagNode of node.querySelectorAll('.tag')) {
    // TODO dear god this is brittle.
    // maybe make thing tag nodes change the active editor tag node if you click em while the editor is open?
    // maybe check if the tag family we're changing is negated, and persist the negation if it is?
    // maybe change inner text of the existing thing tag node if there is one, to preserve order?
    tagNode.onclick = function() {
      let familyText = tagNode.parentNode.innerText.split(':')[0];
      console.log(familyText);
      let family = Object.values(tagFamilies).find(tf => tf.text === familyText);
      console.log(family);
      let thingTagNodes = [...thingNode.querySelectorAll('.tag')];
      if (tagNode.classList.contains('active')) {
        tagNode.classList.remove('active');
        // remove corresponding tag from thingNode tags
        thingTagNodes.find(tn => tn.innerText.startsWith(family.text)).remove();
      } else {
        let otherActiveEditorTagNodeInFamily = tagNode.parentNode.querySelector('.active');
        if (otherActiveEditorTagNodeInFamily) {
          otherActiveEditorTagNodeInFamily.classList.remove('active');
          // remove corresponding tag from thingNode tags
          thingTagNodes.find(tn => tn.innerText.startsWith(family.text)).remove();
        }
        tagNode.classList.add('active');
        // add corresponding tag to thingNode tags
        let tagText = `${family.text} ${tagNode.innerText}`;
        let newThingTagNode = createNode(`<span class="tag">${upcaseFirst(tagText.trim())}</span>`);
        thingNode.querySelector('.tags').appendChild(newThingTagNode);
        // copied from wireUpOnclickHandlers - make the newThingTagNode behave correctly on click
        newThingTagNode.onclick = function() {
          if (negateModeActive) {
            negateTag(newThingTagNode);
          } else {
            newThingTagNode.innerText = cycleTag(newThingTagNode.innerText);
          }
        }
      }
    }
  }
  return node;
}

function createTriggerNode(trigger) {
  let html = `<div class="trigger" id="${trigger.id}">
    <div class="minibutton randomize" title="Randomize this trigger">🎲</div>
    <div class="minibutton delete" title="Delete this trigger">🗑️</div>
    <!--<span class="not">NOT </span>-->
    <div class="lhs">
      <h4>When</h4>
      <select class="whenSelect">
        <option value="rvalGte">Resource value greater than</option>
        <option value="rvalLte">Resource value less than</option>
        <option value="collide">Entity collides with entity</option>
        <option value="entClick">Entity is clicked</option>
        <option value="mouseClick">Mouse is clicked</option>
        <option value="mouseHold">Mouse is held</option>
        <option value="keyPress">Keyboard key is pressed</option>
        <option value="keyHold">Keyboard key is held</option>
        <option value="timerDone">Timer finishes</option>
        <option value="tick">Every frame</option>
      </select>
    </div>
    <div class="rhs">
      <h4>Then</h4>
      <select class="thenSelect">
        <option value="setRval">Set resource value</option>
        <option value="incRval">Increase resource value</option>
        <option value="decRval">Decrease resource value</option>
        <option value="teleport">Teleport entity to</option>
        <option value="moveEntToward">Move entity toward</option>
        <option value="moveEntAway">Move entity away from</option>
        <option value="moveEntDir">Move entity in direction</option>
        <option value="restitution">Prevent entity overlap</option>
        <option value="rotEntBy">Rotate entity by angle</option>
        <option value="entLookAt">Make entity look at</option>
        <option value="setEntSprite">Set entity sprite</option>
        <option value="setEntColor">Set entity color</option>
        <option value="setEntSize">Set entity size</option>
        <!--<option value="">Make entity draggable</option>-->
        <option value="spawnEnt">Spawn entity at</option>
        <option value="deleteEnt">Delete entity</option>
        <!--<option value="">Draw color at point</option>
        <option value="">Clear color at point</option>
        <option value="">Fill screen with color</option>-->
        <option value="win">Win game</option>
        <option value="lose">Lose game</option>
        <option value="timerStart">Start timer</option>
        <option value="timerPause">Pause timer</option>
        <option value="timerRestart">Restart timer</option>
      </select>
    </div>
  </div>`;
  let node = createNode(html);
  wireUpOnclickHandlers(node);
  let whenSelect = node.querySelector('.whenSelect');
  whenSelect.onchange = function() {
    // remove existing slot pairs if any
    let existingSlotPairs = whenSelect.parentNode.querySelectorAll('.slotPair');
    for (let existingSlotPair of existingSlotPairs) {
      existingSlotPair.remove();
    }
    // now do the actual work
    let value = whenSelect.options[whenSelect.selectedIndex].value;
    let slots = triggerConditions[value];
    for (let slot of slots) {
      let slotPair = createNode(`<div class="slotPair">
        <span>${upcaseFirst(slot)}</span>
        <input type="text">
      </div>`);
      whenSelect.parentNode.appendChild(slotPair);
    }
  };
  let thenSelect = node.querySelector('.thenSelect');
  thenSelect.onchange = function() {
    // remove existing slot pairs if any
    let existingSlotPairs = thenSelect.parentNode.querySelectorAll('.slotPair');
    for (let existingSlotPair of existingSlotPairs) {
      existingSlotPair.remove();
    }
    // now do the actual work
    let value = thenSelect.options[thenSelect.selectedIndex].value;
    let slots = triggerActions[value];
    for (let slot of slots) {
      let slotPair = createNode(`<div class="slotPair">
        <span>${upcaseFirst(slot)}</span>
        <input type="text">
      </div>`);
      thenSelect.parentNode.appendChild(slotPair);
    }
  }
  whenSelect.onchange();
  thenSelect.onchange();
  node.onclick = function() {
    if (negateModeActive) {
      if (node.classList.contains('negated')) {
        node.classList.remove('negated');
      } else {
        node.classList.add('negated');
      }
    }
  }
  return node;
}

function createStaticTriggerNode(trigger) {
  let html = `<div class="trigger static" id="static_${trigger.id}">
    <div class="minibutton import" title="Add to intent">↩️</div>
    <!--<span class="not">NOT </span>-->
    <div class="lhs">
      <h4>When</h4>
      <div class="contents">${trigger.when[0].cond}: ${trigger.when[0].params.join(', ')}</div>
    </div>
    <div class="rhs">
      <h4>Then</h4>
      <div class="contents">${trigger.then[0].action}: ${trigger.then[0].params.join(', ')}</div>
    </div>
  </div>`;
  return createNode(html);
}

function openTagEditor(thingNode) {
  let existingTagEditorNode = document.querySelector('.tag-editor');
  if (existingTagEditorNode) existingTagEditorNode.remove();

  // get the type of the thing whose tags we want to edit
  let thingType = [...thingNode.classList].find(c => c === 'entity' || c === 'resource' || c === 'outcome');

  let tagEditorNode = createTagEditorNode(thingType, thingNode);
  thingNode.appendChild(tagEditorNode);
}

for (let thing of Object.values(exampleIntent)) {
  if (thing.type === 'entity') {
    let node = createEntityNode(thing);
    intentEntitiesList.lastElementChild.insertAdjacentElement('beforebegin', node);
    let staticNode = createStaticEntityNode(thing);
    generatedEntitiesList.appendChild(staticNode);
  } else if (thing.type === 'resource') {
    let node = createResourceNode(thing);
    intentResourcesList.lastElementChild.insertAdjacentElement('beforebegin', node);
    let staticNode = createStaticResourceNode(thing);
    generatedResourcesList.appendChild(staticNode);
  } else if (thing.type === 'relationship') {
    let node = createRelationshipNode(thing);
    intentRelationshipsList.lastElementChild.insertAdjacentElement('beforebegin', node);
    let staticNode = createStaticRelationshipNode(thing);
    generatedRelationshipsList.appendChild(staticNode);
  } else if (thing.type === 'trigger') {
    let node = createTriggerNode(thing);
    intentTriggersList.lastElementChild.insertAdjacentElement('beforebegin', node);
    let staticNode = createStaticTriggerNode(thing);
    generatedTriggersList.appendChild(staticNode);
  } else {
    console.error('invalid thing type', thing);
  } 
}

newEntityButton.onclick = function() {
  let defaultEntity = {
    type: 'entity',
    name: "",
    icon: "❓",
    tags: [{family: 'optional', value: 'optional'}]
  };
  addThingToIntent(defaultEntity);
  let node = createEntityNode(defaultEntity);
  intentEntitiesList.lastElementChild.insertAdjacentElement('beforebegin', node);
}

newResourceButton.onclick = function() {
  let defaultResource = {
    type: 'resource',
    name: "",
    tags: [{family: 'optional', value: 'optional'}]
  };
  addThingToIntent(defaultResource);
  let node = createResourceNode(defaultResource);
  intentResourcesList.lastElementChild.insertAdjacentElement('beforebegin', node);
}

newRelationshipButton.onclick = function() {
  let defaultRelationship = {type: 'relationship', lhs: '', reltype: 'is related to', rhs: ''};
  addThingToIntent(defaultRelationship);
  let node = createRelationshipNode(defaultRelationship);
  intentRelationshipsList.lastElementChild.insertAdjacentElement('beforebegin', node);
}

newTriggerButton.onclick = function() {
  let defaultTrigger = {type: 'trigger', lhs: [], rhs: []};
  addThingToIntent(defaultTrigger);
  let node = createTriggerNode(defaultTrigger);
  intentTriggersList.lastElementChild.insertAdjacentElement('beforebegin', node);
}

let negateModeActive = false;

toggleNegateMode.onclick = function() {
  negateModeActive = !negateModeActive;
  toggleNegateMode.innerText = `${negateModeActive ? 'Disable' : 'Enable'} negate mode`;
  if (negateModeActive) {
    toggleNegateMode.classList.remove('inactive');
  } else {
    toggleNegateMode.classList.add('inactive');
  }
}
