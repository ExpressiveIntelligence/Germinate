function upcaseFirst(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

let tagFamilies = {
  optional: {
    text: 'It is',
    tags: ['optional'],
    appliesTo: ['entity', 'resource', 'outcome']
  },
  playerAttitude: {
    text: 'Player thinks it\'s',
    tags: ['good', 'neutral', 'bad', 'complicated'],
    appliesTo: ['entity', 'resource', 'outcome']
  },
  initialLevel: {
    text: 'Value starts off',
    tags: ['full', 'high', 'middling', 'low', 'empty'],
    appliesTo: ['resource']
  },
  tendency: {
    text: 'Tends to',
    tags: ['increase rapidly', 'increase slowly', 'stay the same',
           'decrease slowly', 'decrease rapidly', 'fluctuate wildly'],
    appliesTo: ['resource']
  }
};

let exampleIntent = {
  entities: [
    {
      name: "Friend",
      isRequired: true,
      icon: "💁",
      tags: [
        {family: 'playerAttitude', value: 'good'},
        {family: 'tendency', value: 'decrease rapidly', isNegated: true}
      ]
    },
    {
      name: "Entity2",
      isRequired: false,
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
      tags: [{family: 'optional', value: 'optional'}]
    }
  ],
  relationships: [
    {
      lhs: "Friend",
      type: "collides with",
      rhs: "Entity2"
    },
    {
      lhs: "Entity2",
      type: "produces",
      rhs: "Depression"
    }
  ],
  triggers: []
}

function createNode(html) {
  let div = document.createElement('div');
  div.innerHTML = html;
  return div.firstChild;
}

function createEntityNode(entity) {
  let html = `<div class="thing entity">
    <input type="text" class="thing-name" value="${entity.name}">
    <div class="randomize">🎲</div>
    <div class="entity-icon">${entity.icon}</div>
    <div class="tags">`;
  for (let tag of entity.tags) {
    let tagText = tagFamilies[tag.family].text + ' ' + tag.value;
    html += `<span class="tag${tag.isNegated ? ' negated' : ''}">${upcaseFirst(tagText.trim())}</span>`
  }
  html += `</div><a class="edit-tags">edit tags</a>`;
  html += `</div>`;
  return createNode(html);
}

function createResourceNode(resource) {
  let html = `<div class="thing resource">
    <input type="text" class="thing-name" value="${resource.name}">
    <div class="randomize">🎲</div>
    <div class="tags">`;
  for (let tag of resource.tags) {
    let tagText = tagFamilies[tag.family].text + ' ' + tag.value;
    html += `<span class="tag${tag.isNegated ? ' negated' : ''}">${upcaseFirst(tagText.trim())}</span>`
  }
  html += `</div><a class="edit-tags">edit tags</a>`;
  html += `</div>`;
  return createNode(html);
}

let isTagEditorOpen = false;

function openTagEditor(thingNode) {
  let thingType;
  for (let c of thingNode.classList) {
    console.log(c);
    if (c === 'entity' || c === 'resource' || c === 'outcome') {
      thingType = c;
      break;
    }
  }

  if (isTagEditorOpen) return;
  isTagEditorOpen = true;
  let html = `<div class="tag-editor">
    <div class="close-tag-editor">X</div>`;
  for (let familyName of Object.keys(tagFamilies)) {
    let family = tagFamilies[familyName];
    if (family.appliesTo.indexOf(thingType) < 0) {
      continue;
    }
    html += `<div class="tag-family">${family.text}: `;
    for (let tag of family.tags) {
      html += `<span class="tag">${tag}</span>`;
    }
    html += `</div>`;
  }
  html += `</div>`;
  let node = createNode(html);
  thingNode.appendChild(node);

  let closeTagEditor = document.querySelector('.close-tag-editor');
  closeTagEditor.onclick = function() {
    isTagEditorOpen = false;
    node.remove();
  }
}

for (let entity of exampleIntent.entities) {
  let node = createEntityNode(entity);
  intentEntitiesList.lastElementChild.insertAdjacentElement('beforebegin', node);
}
for (let resource of exampleIntent.resources) {
  let node = createResourceNode(resource);
  intentResourcesList.lastElementChild.insertAdjacentElement('beforebegin', node);
}

for (let editTagsLink of document.querySelectorAll('.edit-tags')) {
  editTagsLink.onclick = function() {
    openTagEditor(editTagsLink.parentNode);
  };
}

/*
for (let relationship of exampleIntent.relationships) {
  createRelationshipNode(relationship);
}
for (let trigger of exampleIntent.triggers) {
  createTriggerNode(trigger);
}
*/


