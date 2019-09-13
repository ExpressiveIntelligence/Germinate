// ❌
// ↩

function upcaseFirst(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
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

let exampleIntent = {
  entities: [
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
  ],
  resources: [
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
  ],
  relationships: [
    {
      lhs: "Friend",
      type: "collides with",
      rhs: "Insecurity"
    },
    {
      lhs: "Insecurity",
      type: "produces",
      rhs: "Depression"
    }
  ],
  triggers: [{when: [], then: []}
  /*
    {
      when: [
        {
          cond: 'Resource greater than value',
          params: ['Depression', '5']
        }
      ],
      then: [
        {action: ''}
      ]
    }
  */]
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
  let html = `<div class="thing entity">
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
  let html = `<div class="thing entity">
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
  let html = `<div class="thing resource">
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
  let html = `<div class="thing resource">
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
  let html = `<div class="relationship">
    <div class="minibutton randomize" title="Randomize this relationship">🎲</div>
    <span class="not">NOT </span>
    <input type="text" value="${relationship.lhs}" placeholder="Something">
    <select>
      <option value=""${relationship.type === 'is related to' ? ' selected' : ''}>is related to</option>
      <option value=""${relationship.type === 'consumes' ? ' selected' : ''}>consumes</option>
      <option value=""${relationship.type === 'produces' ? ' selected' : ''}>produces</option>
      <option value=""${relationship.type === 'defeats' ? ' selected' : ''}>defeats</option>
      <option value=""${relationship.type === 'avoids' ? ' selected' : ''}>avoids</option>
      <option value=""${relationship.type === 'collides with' ? ' selected' : ''}>collides with</option>
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
  let html = `<div class="relationship">
    <span class="lhs">${relationship.lhs}</span>
    <span> ${relationship.type} </span>
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
  let html = `<div class="trigger">
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


function openTagEditor(thingNode) {
  let existingTagEditorNode = document.querySelector('.tag-editor');
  if (existingTagEditorNode) existingTagEditorNode.remove();

  // get the type of the thing whose tags we want to edit
  let thingType = [...thingNode.classList].find(c => c === 'entity' || c === 'resource' || c === 'outcome');

  let tagEditorNode = createTagEditorNode(thingType, thingNode);
  thingNode.appendChild(tagEditorNode);
}

for (let entity of exampleIntent.entities) {
  let node = createEntityNode(entity);
  intentEntitiesList.lastElementChild.insertAdjacentElement('beforebegin', node);
  let staticNode = createStaticEntityNode(entity);
  generatedEntitiesList.appendChild(staticNode);
}
for (let resource of exampleIntent.resources) {
  let node = createResourceNode(resource);
  intentResourcesList.lastElementChild.insertAdjacentElement('beforebegin', node);
  let staticNode = createStaticResourceNode(resource);
  generatedResourcesList.appendChild(staticNode);
}
for (let relationship of exampleIntent.relationships) {
  let node = createRelationshipNode(relationship);
  intentRelationshipsList.lastElementChild.insertAdjacentElement('beforebegin', node);
  let staticNode = createStaticRelationshipNode(relationship);
  generatedRelationshipsList.appendChild(staticNode);
}
for (let trigger of exampleIntent.triggers) {
  let node = createTriggerNode(trigger);
  intentTriggersList.lastElementChild.insertAdjacentElement('beforebegin', node);
  /*let staticNode = createStaticRelationshipNode(relationship);
  generatedTriggersList.appendChild(staticNode);*/
}


newEntityButton.onclick = function() {
  let defaultEntity = {
    name: "",
    icon: "❓",
    tags: [{family: 'optional', value: 'optional'}]
  };
  let node = createEntityNode(defaultEntity);
  intentEntitiesList.lastElementChild.insertAdjacentElement('beforebegin', node);
}

newResourceButton.onclick = function() {
  let defaultResource = {
    name: "",
    tags: [{family: 'optional', value: 'optional'}]
  };
  let node = createResourceNode(defaultResource);
  intentResourcesList.lastElementChild.insertAdjacentElement('beforebegin', node);
}

newRelationshipButton.onclick = function() {
  let defaultRelationship = {lhs: '', type: 'is related to', rhs: ''};
  let node = createRelationshipNode(defaultRelationship);
  intentRelationshipsList.lastElementChild.insertAdjacentElement('beforebegin', node);
}

newTriggerButton.onclick = function() {
  let defaultTrigger = {lhs: [], rhs: []};
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
