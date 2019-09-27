// ❌
// ↩

/// generic utility functions

function upcaseFirst(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function randNth(items){
  return items[Math.floor(Math.random()*items.length)];
}

function randInt(min, max) {
  min = Math.ceil(min); // inclusive
  max = Math.floor(max); // exclusive
  return Math.floor(Math.random() * (max - min)) + min;
}

function createNode(html) {
  let div = document.createElement('div');
  div.innerHTML = html;
  return div.firstChild;
}

/// static data structure setup

let themes = {
  depression: {
    entityNames: ['Friend', 'Family', 'Insecurity', 'Good thought', 'Bad thought', 'Brain'],
    resourceNames: ['Confidence', 'Happiness', 'Depression', 'Friends', 'Insecurity', 'Brain', 'Anxiety'],
    icons: ['💁', '😢', '😞', '❤️', '🔥', '💧', '😭', '😿', '😬', '🧠', '✨']
  }
};

let defaultTheme = {
  entityNames: ['Person', 'Car', 'Tree', 'Building', 'Fire', 'Leopard', 'Computer', 'Art'],
  resourceNames: ['Confusion', 'Understanding', 'Satisfaction', 'Fun', 'Enmity', 'Delight', 'Failure'],
  icons: ['😶', '🔥', '🕶️', '🤖', '🐙', '🌈', '🦄', '🎂', '🍰', '🎈', '🎉', '🎁']
};

let relationshipTypes = ['is related to', 'consumes', 'produces', 'defeats', 'avoids', 'collides with'];

let triggerConditions = {
  tick: {desc: 'Every frame', params: []},
  rvalGte: {desc: 'Resource greater than value', params: ['resource', 'value']},
  rvalLte: {desc: 'Resource less than value', params: ['resource', 'value']},
  collide: {desc: 'Entity collides with entity', params: ['entity #1', 'entity #2']},
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
  restitution: {desc: 'Prevent entity overlap', params: ['entity #1', 'entity #2']},
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

/// thing ID generation

let lastID = -1;
function getNextID() {
  lastID++;
  return 'id' + lastID;
}

/// global variables

let currentIntent, currentGameRules;

/// functions for messing with tags

function identicalTags(tag1, tag2) {
  // note deliberately fuzzy comparison for isNegated – negative value can be undefined or false
  return tag1.family === tag2.family && tag1.value === tag2.value && !tag1.isNegated === !tag2.isNegated;
}

function addTag(thing, tag) {
  // TODO sort by family on addition, so order is consistent + related tags grouped together?
  if (tag.isNegated) {
    // exit early if tag we're trying to add is already present
    if (thing.tags.find(t => identicalTags(t, tag))) return;
    // remove existing positive tag in same family, if any
    thing.tags = thing.tags.filter(t => !(t.family === tag.family && !t.isNegated));
    // add new tag to thing.tags
    thing.tags.push(tag);
  } else {
    // either modify existing positive tag in same family (if any) or add new tag to thing.tags directly
    let existingPositiveTagInFamily = thing.tags.find(t => t.family === tag.family && !t.isNegated);
    if (existingPositiveTagInFamily) {
      existingPositiveTagInFamily.value = tag.value;
    } else {
      thing.tags.push(tag);
    }
    // remove existing negative tags in same family, if any
    thing.tags = thing.tags.filter(t => !(t.family === tag.family && t.isNegated));
  }
}

function removeTag(thing, tag) {
  thing.tags = thing.tags.filter(t => !identicalTags(t, tag));
}

function negateTag(thing, tag) {
  let existingTag = thing.tags.find(t => identicalTags(t, tag));
  existingTag.isNegated = !existingTag.isNegated;
}

function cycleTag(thing, tag) {
  // TODO when cycling a negated tag, it might become identical to another negated tag from the same family!
  // this leads to weirdness and is nontrivial to fix.
  let existingTag = thing.tags.find(t => identicalTags(t, tag));
  let family = tagFamilies[tag.family];
  let valueIndex = family.tags.indexOf(tag.value);
  let nextValueIndex = (valueIndex + 1 >= family.tags.length) ? 0 : valueIndex + 1;
  existingTag.value = family.tags[nextValueIndex];
}

function rerenderTags(thingNode) {
  let thing = currentIntent[thingNode.id];
  let tagsNode = thingNode.querySelector('.tags');
  tagsNode.innerHTML = '';
  for (let tag of thing.tags) {
    let tagText = tagFamilies[tag.family].text + ' ' + tag.value;
    let tagHtml = `<span class="tag${tag.isNegated ? ' negated' : ''}">${upcaseFirst(tagText.trim())}</span>`;
    let tagNode = createNode(tagHtml);
    tagNode.onclick = function(ev) {
      if (negateModeActive || ev.shiftKey) {
        negateTag(thing, tag);
      } else {
        cycleTag(thing, tag);
      }
      rerenderTags(thingNode);
    }
    tagsNode.appendChild(tagNode);
  }
  // re-render tag editor too if open on thing
  let attachedTagEditorNode = thingNode.querySelector('.tag-editor');
  if (attachedTagEditorNode) openTagEditor(thingNode);
}

/// functions for messing with thingSets (intent and game rules datastructures)

function addThingToThingSet(thingSet, thing, type) {
  let id = getNextID();
  thing.id = id;
  if (type) thing.type = type;
  if (!thing.type) console.error('thing must have type!', thing);
  thingSet[id] = thing;
}

function hydrateThingSet(storedThingSet) {
  let thingSet = {};
  for (let entity of storedThingSet.entities) {
    addThingToThingSet(thingSet, entity, 'entity');
  }
  for (let resource of storedThingSet.resources) {
    addThingToThingSet(thingSet, resource, 'resource');
  }
  for (let relationship of storedThingSet.relationships) {
    addThingToThingSet(thingSet, relationship, 'relationship');
  }
  for (let trigger of storedThingSet.triggers) {
    addThingToThingSet(thingSet, trigger, 'trigger');
  }
  return thingSet;
}

/// other UI stuff

function randomEntityOrResourceName(intent) {
  let things = Object.values(intent);
  let entitiesAndResources = things.filter(thing => thing.type === 'entity' || thing.type === 'resource');
  let names = entitiesAndResources.map(thing => thing.name);
  return randNth(names);
}

function randomizeTriggerParam(paramName) {
  paramName = paramName.toLowerCase();
  if (paramName.includes('entity') || paramName === 'target') {
    let things = Object.values(currentIntent);
    let entities = things.filter(thing => thing.type === 'entity');
    return randNth(entities.map(e => e.name));
  } else if (paramName.includes('resource')) {
    let things = Object.values(currentIntent);
    let resources = things.filter(thing => thing.type === 'resource');
    return randNth(resources.map(r => r.name));
  } else if (paramName === 'key') {
    return randNth([randNth(['Up', 'Down', 'Left', 'Right', 'Space', 'Shift', 'Enter']),
                    randNth('ABDCEFGHIJKLMNOPQRSTUVWXYZ')]);
  } else if (paramName === 'sprite') {
    return randNth(getCurrentTheme().icons);
  } else if (paramName === 'value') {
    return randInt(0, 11);
  } else if (paramName === 'amount') {
    return randInt(1, 3);
  } else if (paramName === 'angle') {
    return randInt(0, 360);
  } else if (paramName === 'direction') {
    return randNth(['forward', 'backward', 'left', 'right']);
  } else if (paramName === 'color') {
    return randNth(['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'white', 'black']);
  } else if (paramName === 'size') {
    return randNth(['tiny', 'small', 'medium', 'large', 'huge']);
  } else if (paramName === 'message') {
    return randNth([
      'You win!', 'You lose!', 'Victory!', 'Defeat!',
      'Hopeless failure!', 'Ultimate supremacy achieved!',
      'Wasted', 'YOU DIED', 'You died!', 'Destruction!', 'Failure!',
      'Success!', 'Success achieved!', 'Incredible!', 'Impossible!', 'You did it!'
    ]);
  } else if (paramName === 'timer') {
    return 'default timer';
  } else {
    return '';
  }
}

function randomizeThing(thingNode) {
  let thing = currentIntent[thingNode.id];
  let thingType = thing.type;
  let theme = getCurrentTheme();
  if (thingType === 'entity') {
    // randomize name
    let newName = randNth(theme.entityNames);
    thing.name = newName;
    thingNode.querySelector('.thing-name').value = newName;
    // randomize icon
    let newIcon = randNth(theme.icons);
    thing.icon = newIcon;
    thingNode.querySelector('.entity-icon').innerText = newIcon;
  } else if (thingType === 'resource') {
    // randomize name
    let newName = randNth(theme.resourceNames);
    thing.name = newName;
    thingNode.querySelector('.thing-name').value = newName;
  } else if (thingType === 'relationship') {
    thing.lhs = randomEntityOrResourceName(currentIntent);
    thing.reltype = randNth(relationshipTypes);
    thing.rhs = randomEntityOrResourceName(currentIntent);
    // NOTE: replaceWith doesn't work in IE, maybe switch to replaceChild instead?
    thingNode.replaceWith(createRelationshipNode(thing));
  } else if (thingType === 'trigger') {
    let newCond = randNth(Object.values(triggerConditions));
    let newAction = randNth(Object.values(triggerActions));
    thing.when = [{cond: newCond.desc, params: newCond.params.map(randomizeTriggerParam)}];
    thing.then = [{action: newAction.desc, params: newAction.params.map(randomizeTriggerParam)}];
    // NOTE: replaceWith doesn't work in IE, maybe switch to replaceChild instead?
    thingNode.replaceWith(createTriggerNode(thing));
  }

  // if thing is an entity or resource, randomize tags
  if (thingType === 'entity' || thingType === 'resource') {
    // clear current tags
    thing.tags = [];
    // pick and add new tags, one for each valid tag family (other than 'optional')
    let validTagFamilies = Object.values(tagFamilies).filter(tf => tf.appliesTo.indexOf(thingType) > -1);
    validTagFamilies = validTagFamilies.filter(tf => tf.name !== 'optional');
    for (let tagFamily of validTagFamilies) {
      let value = randNth(tagFamily.tags);
      addTag(thing, {value, family: tagFamily.name});
    }
    // randomly either add or don't add the 'optional' tag
    if (Math.random() > 0.5) {
      addTag(thing, {value: 'optional', family: 'optional'});
    }
    // render new tags
    rerenderTags(thingNode);
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
      delete currentIntent[thingNode.id];
      thingNode.remove();
    }
  }
  for (let randomizeButton of thingNode.querySelectorAll('.randomize')) {
    randomizeButton.onclick = function() {
      randomizeThing(thingNode);
    }
  }
}

function wireUpStaticOnclickHandlers(thingNode) {
  for (let importButton of thingNode.querySelectorAll('.import')) {
    importButton.onclick = function() {
      let thingID = thingNode.id.replace('static_', '');
      let thing = currentGameRules[thingID];
      addThingToThingSet(currentIntent, thing);
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
    <div class="tags"></div>
    <a class="edit-tags">edit tags</a>
  </div>`;
  let node = createNode(html);
  wireUpOnclickHandlers(node);
  let emojiNode = node.querySelector('.entity-icon');
  emojiNode.onclick = function() {
    openEmojiPicker(node);
  }
  rerenderTags(node);
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
  wireUpStaticOnclickHandlers(node);
  return node;
}

function createResourceNode(resource) {
  let html = `<div class="thing resource" id="${resource.id}">
    <div class="minibutton randomize" title="Randomize this resource">🎲</div>
    <div class="minibutton delete" title="Delete this resource">🗑️</div>
    <input type="text" class="thing-name" value="${resource.name}"
           placeholder="(random name)">
    <div class="tags"></div>
    <a class="edit-tags">edit tags</a>
  </div>`;
  let node = createNode(html);
  wireUpOnclickHandlers(node);
  rerenderTags(node);
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
  wireUpStaticOnclickHandlers(node);
  return node;
}

function createRelationshipNode(relationship) {
  let optionsHtml = '';
  for (let reltype of relationshipTypes) {
    optionsHtml += `<option value=""${relationship.reltype === reltype ? ' selected' : ''}>${reltype}</option>`;
  }
  let html = `<div class="relationship" id="${relationship.id}">
    <div class="minibutton randomize" title="Randomize this relationship">🎲</div>
    <span class="not">NOT </span>
    <input type="text" value="${relationship.lhs}" placeholder="Something">
    <select>${optionsHtml}</select>
    <input type="text" value="${relationship.rhs}" placeholder="something">
    <div class="minibutton delete" title="Delete this relationship">🗑️</div>
  </div>`;
  let node = createNode(html);
  wireUpOnclickHandlers(node);
  node.onclick = function(ev) {
    if (negateModeActive || ev.shiftKey) {
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
  wireUpStaticOnclickHandlers(node);
  return node;
}

function createEmojiPickerNode(thingNode) {
  let html = `<div class="emoji-picker">
    <div class="close-emoji-picker">X</div>
    <span class="emoji">❓</span>`;
  let theme = getCurrentTheme();
  for (let emoji of theme.icons) {
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
      currentIntent[thingID].icon = emojiSpan.innerText;
    }
  }
  return node;
}

function createTagEditorNode(thingType, thingNode) {
  // create top-level editor node
  let thing = currentIntent[thingNode.id];
  let html = `<div class="tag-editor">
    <div class="close-tag-editor">X</div>
  </div>`;
  let editorNode = createNode(html);
  editorNode.querySelector('.close-tag-editor').onclick = function() {
    editorNode.remove();
  };
  // create each tag family
  for (let familyName of Object.keys(tagFamilies)) {
    let family = tagFamilies[familyName];
    if (family.appliesTo.indexOf(thingType) < 0) continue;
    let familyNode = createNode(`<div class="tag-family">${family.text}: </div>`);
    editorNode.appendChild(familyNode);
    // create individual tag nodes within this family
    for (let tag of family.tags) {
      let correspondingThingTag = thing.tags.find(t => t.value === tag && t.family === familyName);
      let tagState = correspondingThingTag ? (correspondingThingTag.isNegated ? 'negated' : 'active') : '';
      let tagNode = createNode(`<span class="tag ${tagState}">${tag}</span>`);
      familyNode.appendChild(tagNode);
      // set up onclick handler for this individual editor tag
      tagNode.onclick = function(ev) {
        if ((negateModeActive || ev.shiftKey) && tagState !== 'negated') {
          addTag(thing, {family: familyName, value: tag, isNegated: true});
        } else if (tagState === 'active') {
          removeTag(thing, {family: familyName, value: tag});
        } else {
          addTag(thing, {family: familyName, value: tag});
        }
        rerenderTags(thingNode);
      };
    }
  }
  return editorNode;
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
    <span class="not">NOT</span>
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
  node.onclick = function(ev) {
    if (negateModeActive || ev.shiftKey) {
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
  wireUpStaticOnclickHandlers(node);
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

function redrawIntentUI(intent) {
  // remove existing UI nodes for previous intent
  for (let targetList of [intentEntitiesList, intentResourcesList,
                          intentRelationshipsList, intentTriggersList]) {
    // remove all the children except the new-button.
    // we know this is awful but everything else we tried causes weird bugs.
    let newButton = targetList.querySelector('.new-button');
    targetList.innerHTML = '';
    targetList.appendChild(newButton);
  }
  // create new UI nodes for things in intent
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
}

function redrawGameRulesUI(rules) {
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

// add click handlers to new thing buttons in intent UI
newEntityButton.onclick = function() {
  let defaultEntity = {
    type: 'entity',
    name: "",
    icon: "❓",
    tags: [{family: 'optional', value: 'optional'}]
  };
  addThingToThingSet(currentIntent, defaultEntity);
  let node = createEntityNode(defaultEntity);
  intentEntitiesList.lastElementChild.insertAdjacentElement('beforebegin', node);
}
newResourceButton.onclick = function() {
  let defaultResource = {
    type: 'resource',
    name: "",
    tags: [{family: 'optional', value: 'optional'}]
  };
  addThingToThingSet(currentIntent, defaultResource);
  let node = createResourceNode(defaultResource);
  intentResourcesList.lastElementChild.insertAdjacentElement('beforebegin', node);
}
newRelationshipButton.onclick = function() {
  let defaultRelationship = {type: 'relationship', lhs: '', reltype: 'is related to', rhs: ''};
  addThingToThingSet(currentIntent, defaultRelationship);
  let node = createRelationshipNode(defaultRelationship);
  intentRelationshipsList.lastElementChild.insertAdjacentElement('beforebegin', node);
}
newTriggerButton.onclick = function() {
  let defaultTrigger = {
    type: 'trigger',
    when: [{cond: 'Every tick', params: []}],
    then: [{action: 'Do nothing', params: []}]
  };
  addThingToThingSet(currentIntent, defaultTrigger);
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

function getCurrentTheme() {
  return themes[currentThemeName] || defaultTheme;
}

let currentThemeName = themePickerText.value;

changeTheme.onclick = function() {
  themePicker.classList.add('active');
}

for (let themeButton of themePicker.querySelectorAll('.pick-theme')) {
  themeButton.onclick = function() {
    currentThemeName = themeButton.innerText;
    themePickerText.value = themeButton.innerText;
    themePicker.classList.remove('active');
  }
}

themePickerContinue.onclick = function() {
  currentThemeName = themePickerText.value;
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

let currentPoolIndex = 0;
let currentGameIndex = 0;

function updateCurrentGame() {
  let currentPool = gamePools[currentPoolIndex];
  //let {intent, intentFile, games} = currentPool;
  let {file, rules} = currentPool.games[currentGameIndex];
  gameCounter.innerText = `${currentGameIndex + 1} / ${currentPool.games.length}`;

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

  // update the intent datastructure and UI
  currentIntent = hydrateThingSet(currentPool.intent);
  redrawIntentUI(currentIntent);

  // update the game rules datastructure and UI
  currentGameRules = hydrateThingSet(rules);
  redrawGameRulesUI(currentGameRules);

  // TODO make it so that when you update the intent (via e.g. randomizeWhatever)
  // it doesn't update the stored version of the things that you're updating.
  // the issue here is hard to explain; if in doubt ask Max.

  if (currentGameIndex <= 0) {
    previousGame.disabled = true;
  } else {
    previousGame.disabled = false;
  }

  if (currentGameIndex >= currentPool.games.length - 1) {
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
