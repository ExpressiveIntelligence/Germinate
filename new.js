// ❌
// ↩

/// generic utility functions

function upcaseFirst(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function createNode(html) {
  let div = document.createElement('div');
  div.innerHTML = html;
  return div.firstChild;
}

/// static data structure setup

let triggerConditions = {
  tick: {desc: 'Every frame', params: []},
  rvalGte: {desc: 'Resource greater than value', params: ['resource', 'value']},
  rvalLte: {desc: 'Resource less than value', params: ['resource', 'value']},
  collide: {desc: 'Entity collides with entity', params: ['first entity', 'second entity']},
  entClick: {desc: 'Entity is clicked', params: ['entity']},
  mouseClick: {desc: 'Mouse is clicked', params: []},
  mouseHold: {desc: 'Mouse is held', params: []},
  keyPress: {desc: 'Keyboard key is pressed', params: ['key']},
  keyHold: {desc: 'Keyboard key is held', params: ['key']},
  timerDone: {desc: 'Timer finishes', params: ['timer']}
};

let triggerActions = {
  nothing: {desc: 'Do nothing', params: []},
  setRval: {desc: 'Set resource value', params: ['resource', 'value']},
  incRval: {desc: 'Increase resource value', params: ['resource', 'amount']},
  decRval: {desc: 'Decrease resource value', params: ['resource', 'amount']},
  teleport: {desc: 'Teleport entity to', params: ['entity', 'target']},
  moveEntToward: {desc: 'Move entity toward', params: ['entity', 'target']},
  moveEntAway: {desc: 'Move entity away from', params: ['entity', 'target']},
  moveEntDir: {desc: 'Move entity in direction', params: ['entity', 'direction']},
  restitution: {desc: 'Prevent entity overlap', params: ['first entity', 'second entity']},
  rotEntBy: {desc: 'Rotate entity by angle', params: ['entity', 'angle']},
  entLookAt: {desc: 'Make entity look at', params: ['entity', 'target']},
  setEntSprite: {desc: 'Set entity sprite', params: ['entity', 'sprite']},
  setEntColor: {desc: 'Set entity color', params: ['entity', 'color']},
  setEntSize: {desc: 'Set entity size', params: ['entity', 'size']},
  spawnEnt: {desc: 'Spawn entity at', params: ['entity', 'target']},
  deleteEnt: {desc: 'Delete entity', params: ['entity']},
  win: {desc: 'Win game', params: ['message']},
  lose: {desc: 'Lose game', params: ['message']},
  timerStart: {desc: 'Start timer', params: ['timer']},
  timerPause: {desc: 'Pause timer', params: ['timer']},
  timerRestart: {desc: 'Restart timer', params: ['timer']}
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

let relevantEmoji = ['❓', '💁', '😢', '😞', '❤️', '🔥'];

/// thing ID generation

let lastID = -1;
function getNextID() {
  lastID++;
  return 'id' + lastID;
}

/// functions for messing with tags

function parseTag(fullTagText) {
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

function negateTag(tagNode) {
  if (tagNode.classList.contains('negated')) {
    tagNode.classList.remove('negated');
  } else {
    tagNode.classList.add('negated');
  }
}

/// set up the initial intent

let intent = {};

function addThingToIntent(thing, type) {
  let id = getNextID();
  thing.id = id;
  if (type) thing.type = type;
  if (!thing.type) console.error('thing must have type!', thing);
  intent[id] = thing;
}

let exampleEntities = [
  {name: "Friend", icon: "💁", tags: [{family: 'playerAttitude', value: 'good'}]},
  {name: "", icon: "❓", tags: [{family: 'optional', value: 'optional'}]}
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
  {lhs: "Friend", reltype: "collides with", rhs: "Insecurity"},
  {lhs: "Insecurity", reltype: "produces", rhs: "Depression"}
];

let exampleTriggers = [
  {
    when: [{cond: 'Every tick', params: []}],
    then: [{action: 'Do nothing', params: []}]
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

/// set up the initial generated game rules

let gameRules = {};

function addThingToGameRules(thing, type) {
  let id = getNextID();
  thing.id = id;
  if (type) thing.type = type;
  if (!thing.type) console.error('thing must have type!', thing);
  gameRules[id] = thing;
}

let gameExampleEntities = [
  {name: "Friend", icon: "💁", tags: [{family: 'playerAttitude', value: 'good'}]}
];

let gameExampleResources = [
  {
    name: "Depression",
    tags: [
      {family: 'playerAttitude', value: 'bad'},
      {family: 'initialLevel', value: 'low'},
      {family: 'tendency', value: 'increase slowly'}
    ]
  }
];

let gameExampleRelationships = [
  {lhs: "Friend", reltype: "collides with", rhs: "Insecurity"},
  {lhs: "Insecurity", reltype: "produces", rhs: "Depression"}
];

let gameExampleTriggers = [
  {
    when: [{cond: 'Resource greater than value', params: ['Depression', '5']}],
    then: [{action: 'Spawn entity at', params: ['Friend', '0,0']}]
  }
];

for (let entity of gameExampleEntities) {
  addThingToGameRules(entity, 'entity');
}
for (let resource of gameExampleResources) {
  addThingToGameRules(resource, 'resource');
}
for (let relationship of gameExampleRelationships) {
  addThingToGameRules(relationship, 'relationship');
}
for (let trigger of gameExampleTriggers) {
  addThingToGameRules(trigger, 'trigger');
}

/// other UI stuff

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
  for (let importButton of thingNode.querySelectorAll('.import')) {
    importButton.onclick = function() {
      let thingID = thingNode.id.replace('static_', '');
      let thing = gameRules[thingID];
      addThingToIntent(thing);
      let [uiBuilderFunction, targetList] = {
        entity: [createEntityNode, intentEntitiesList],
        resource: [createResourceNode, intentResourcesList],
        relationship: [createRelationshipNode, intentRelationshipsList],
        trigger: [createTriggerNode, intentTriggersList]
      }[thing.type];
      let node = uiBuilderFunction(thing);
      targetList.lastElementChild.insertAdjacentElement('beforebegin', node);
      // TODO if it's an entity or a resource, try to find one in the intent with the same name and merge.
      // TODO if it's a relationship or trigger, try to find a partial match and merge?
    }
  }
}

function createEntityNode(entity) {
  let html = `<div class="thing entity" id="${entity.id}">
    <div class="minibutton randomize" title="Randomize this entity">🎲</div>
    <div class="minibutton delete" title="Delete this entity">🗑️</div>
    <input type="text" class="thing-name" value="${entity.name}"
           placeholder="(random name)">
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
  let emojiNode = node.querySelector('.entity-icon');
  emojiNode.onclick = function() {
    openEmojiPicker(node);
  }
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
  let node = createNode(html);
  wireUpOnclickHandlers(node);
  return node;
}

function createResourceNode(resource) {
  let html = `<div class="thing resource" id="${resource.id}">
    <div class="minibutton randomize" title="Randomize this resource">🎲</div>
    <div class="minibutton delete" title="Delete this resource">🗑️</div>
    <input type="text" class="thing-name" value="${resource.name}"
           placeholder="(random name)">
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
  let node = createNode(html);
  wireUpOnclickHandlers(node);
  return node;
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
  wireUpOnclickHandlers(node);
  return node;
}

function createEmojiPickerNode(thingNode) {
  let html = `<div class="emoji-picker">
    <div class="close-emoji-picker">X</div>`;
  for (let emoji of relevantEmoji) {
    html += `<span class="emoji">${emoji}</span>`;
  }
  html += `</div>`;
  let node = createNode(html);
  let closeEmojiPicker = node.querySelector('.close-emoji-picker');
  closeEmojiPicker.onclick = function() {
    node.remove();
  }
  let thingID = thingNode.id;
  let thingEmojiNode =  thingNode.querySelector('.entity-icon');
  for (let emojiSpan of node.querySelectorAll('.emoji')) {
    emojiSpan.onclick = function() {
      thingEmojiNode.innerText = emojiSpan.innerText;
      intent[thingID].icon = emojiSpan.innerText;
    }
  }
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
      let family = Object.values(tagFamilies).find(tf => tf.text === familyText);
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
  let whenOptionsHtml = '';
  for (let cond of Object.keys(triggerConditions)) {
    let desc = triggerConditions[cond].desc;
    whenOptionsHtml += `<option value="${cond}"${trigger.when[0].cond === desc ? 'selected' : ''}>
                        ${desc}</option>`;
  }
  let thenOptionsHtml = '';
  for (let action of Object.keys(triggerActions)) {
    let desc = triggerActions[action].desc;
    thenOptionsHtml += `<option value="${action}"${trigger.then[0].action === desc ? 'selected' : ''}>
                        ${desc}</option>`;
  }
  let html = `<div class="trigger" id="${trigger.id}">
    <div class="minibutton randomize" title="Randomize this trigger">🎲</div>
    <div class="minibutton delete" title="Delete this trigger">🗑️</div>
    <!--<span class="not">NOT </span>-->
    <div class="lhs">
      <h4>When</h4>
      <select class="whenSelect">${whenOptionsHtml}</select>
    </div>
    <div class="rhs">
      <h4>Then</h4>
      <select class="thenSelect">${thenOptionsHtml}</select>
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
    let slots = triggerConditions[value].params;
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
    let slots = triggerActions[value].params;
    for (let slot of slots) {
      let slotPair = createNode(`<div class="slotPair">
        <span>${upcaseFirst(slot)}</span>
        <input type="text">
      </div>`);
      thenSelect.parentNode.appendChild(slotPair);
    }
  }
  // dynamically create param fields
  whenSelect.onchange();
  thenSelect.onchange();
  // populate param fields with appropriate values
  let whenParamFields = node.querySelectorAll('.lhs input[type="text"]');
  let thenParamFields = node.querySelectorAll('.rhs input[type="text"]');
  for (let i = 0; i < trigger.when[0].params.length; i++) {
    whenParamFields[i].value = trigger.when[0].params[i];
  }
  for (let i = 0; i < trigger.then[0].params.length; i++) {
    thenParamFields[i].value = trigger.then[0].params[i];
  }
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
  let node = createNode(html);
  wireUpOnclickHandlers(node);
  return node;
}

function openEmojiPicker(thingNode) {
  // close other modals if any exist
  let existingEmojiPickerNode = document.querySelector('.emoji-picker');
  if (existingEmojiPickerNode) existingEmojiPickerNode.remove();
  let existingTagEditorNode = document.querySelector('.tag-editor');
  if (existingTagEditorNode) existingTagEditorNode.remove();

  let emojiPickerNode = createEmojiPickerNode(thingNode);
  thingNode.appendChild(emojiPickerNode);
}

function openTagEditor(thingNode) {
  // close other modals if any exist
  let existingEmojiPickerNode = document.querySelector('.emoji-picker');
  if (existingEmojiPickerNode) existingEmojiPickerNode.remove();
  let existingTagEditorNode = document.querySelector('.tag-editor');
  if (existingTagEditorNode) existingTagEditorNode.remove();

  // get the type of the thing whose tags we want to edit
  let thingType = [...thingNode.classList].find(c => c === 'entity' || c === 'resource' || c === 'outcome');

  let tagEditorNode = createTagEditorNode(thingType, thingNode);
  thingNode.appendChild(tagEditorNode);
}

// set up initial intent UI
for (let thing of Object.values(intent)) {
  let [uiBuilderFunction, targetList] = {
    entity: [createEntityNode, intentEntitiesList],
    resource: [createResourceNode, intentResourcesList],
    relationship: [createRelationshipNode, intentRelationshipsList],
    trigger: [createTriggerNode, intentTriggersList]
  }[thing.type];
  let node = uiBuilderFunction(thing);
  targetList.lastElementChild.insertAdjacentElement('beforebegin', node);
}

// set up initial generated game rules UI
function setCurrentGameRules(rules) {
  // remove existing UI nodes for previous ruleset
  for (let targetList of [generatedEntitiesList, generatedResourcesList,
                          generatedRelationshipsList, generatedTriggersList]) {
    targetList.innerHTML = '';
  }
  // create new UI nodes for things in ruleset
  for (let thing of Object.values(rules)) {
    let [uiBuilderFunction, targetList] = {
      entity: [createStaticEntityNode, generatedEntitiesList],
      resource: [createStaticResourceNode, generatedResourcesList],
      relationship: [createStaticRelationshipNode, generatedRelationshipsList],
      trigger: [createStaticTriggerNode, generatedTriggersList]
    }[thing.type];
    targetList.appendChild(uiBuilderFunction(thing));
  }
}
setCurrentGameRules(gameRules);

// add click handlers to new thing buttons in intent UI
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
  let defaultTrigger = {
    type: 'trigger',
    when: [{cond: 'Every tick', params: []}],
    then: [{action: 'Do nothing', params: []}]
  };
  addThingToIntent(defaultTrigger);
  let node = createTriggerNode(defaultTrigger);
  intentTriggersList.lastElementChild.insertAdjacentElement('beforebegin', node);
}

// add click handler to negate mode button in intent UI
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

/// theme picker stuff

let currentTheme = themePickerText.value;

changeTheme.onclick = function() {
  themePicker.classList.add('active');
}

for (let themeButton of themePicker.querySelectorAll('.pick-theme')) {
  themeButton.onclick = function() {
    currentTheme = themeButton.innerText;
    themePickerText.value = themeButton.innerText;
    themePicker.classList.remove('active');
  }
}

themePickerContinue.onclick = function() {
  currentTheme = themePickerText.value;
  themePicker.classList.remove('active');
}

/// code viewing stuff

viewCodeIntent.onclick = function() {
  if (intentNode.classList.contains('viewing-code')) {
    intentNode.classList.remove('viewing-code');
    viewCodeIntent.innerText = 'View code';
  } else {
    intentNode.classList.add('viewing-code');
    viewCodeIntent.innerText = 'View cards';
  }
}

viewCodeGameRules.onclick = function() {
  if (gameRulesNode.classList.contains('viewing-code')) {
    gameRulesNode.classList.remove('viewing-code');
    viewCodeGameRules.innerText = 'View code';
  } else {
    gameRulesNode.classList.add('viewing-code');
    viewCodeGameRules.innerText = 'View cards';
  }
}

/// game pool navigation

let gamePools = [
  [{file: 'games/depression-A-game_1.lp', rules: gameRules},
   {file: 'games/depression-A-game_2.lp', rules: gameRules},
   {file: 'games/depression-A-game_3.lp', rules: gameRules},
   {file: 'games/depression-A-game_4.lp', rules: gameRules},
   {file: 'games/depression-A-game_5.lp', rules: gameRules}],

  [{file: 'games/depression-B-game_1.lp', rules: gameRules},
   {file: 'games/depression-B-game_2.lp', rules: gameRules}],

  [{file: 'games/depression-C-game_1.lp', rules: gameRules}],

  [{file: 'games/depression-D-game_1.lp', rules: gameRules},
   {file: 'games/depression-D-game_2.lp', rules: gameRules},
   {file: 'games/depression-D-game_3.lp', rules: gameRules},
   {file: 'games/depression-D-game_4.lp', rules: gameRules},
   {file: 'games/depression-D-game_5.lp', rules: gameRules}],

  [{file: 'games/depression-E-game_1.lp', rules: gameRules},
   {file: 'games/depression-E-game_2.lp', rules: gameRules},
   {file: 'games/depression-E-game_3.lp', rules: gameRules},
   {file: 'games/depression-E-game_4.lp', rules: gameRules},
   {file: 'games/depression-E-game_5.lp', rules: gameRules}]
];

let currentPoolIndex = 0;
let currentGameIndex = 0;

function updateCurrentGame() {
  let currentPool = gamePools[currentPoolIndex];
  let {file, rules} = currentPool[currentGameIndex];
  gameCounter.innerText = `${currentGameIndex + 1} / ${currentPool.length}`;

  // load the actual game
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      // we have to run this first, so that the errors on first game load in the rest of the function
      // don't prevent the rules code from being loaded. this kind of sucks but don't mess with it for now.
      gameRulesCodeNode.innerHTML = this.responseText.split('==========')[0];

      // Destroy the current game
      if ( game != "undefined") {
        game.destroy();
      }
      loadGame(this.responseText);
    }
  };
  console.log("loading game file:", file)
  xhttp.open("GET", file, true);
  xhttp.send();

  setCurrentGameRules(rules);

  if (currentGameIndex <= 0) {
    previousGame.disabled = true;
  } else {
    previousGame.disabled = false;
  }

  if (currentGameIndex >= currentPool.length - 1) {
    nextGame.disabled = true;
  } else {
    nextGame.disabled = false;
  }
}

generateGames.onclick = function() {
  currentPoolIndex += 1;
  currentGameIndex = 0;
  updateCurrentGame();
}

previousGame.onclick = function() {
  currentGameIndex -= 1;
  updateCurrentGame();
}

nextGame.onclick = function() {
  currentGameIndex += 1;
  updateCurrentGame();
}

updateCurrentGame();
