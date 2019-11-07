function makeThingASPHandle(thing) {
  return `${thing.type}(${thing.type[0]}(${thing.id}))`;
}

function findThingWithName(intent, name) {
  for (let thing of Object.values(intent)) {
    if (thing.name === name) return thing;
  }
  return null;
}

function generateASPForValenceTag(thingASPHandle, tag) {
  let asp = '';
  if (tag.value === 'good') {
    asp += `:- not reading(good,${thingASPHandle}). % positive valence\n`;
    if (tag.isNegated) {
      asp = asp.replace(':- not', ':- not not');
    }
  } else if (tag.value === 'bad') {
    asp += `:- not reading(bad,${thingASPHandle}). % negative valence\n`;
    if (tag.isNegated) {
      asp = asp.replace(':- not', ':- not not');
    }
  } else if (tag.value === 'neutral') {
    // TODO negation is weird here so we're just ignoring it for now
    // (negated 'neutral' is just good or bad or complicated)
    asp += `:- not reading(good,${thingASPHandle}). % neutral valence\n`;
    asp += `:- not reading(bad,${thingASPHandle}).  % neutral valence\n`;
  } else if (tag.value === 'complicated') {
    // TODO negation is weird here so we're just ignoring it for now
    // (negated 'complicated' is just good or bad or neutral)
    asp += `:- not not reading(good,${thingASPHandle}). % complicated valence\n`;
    asp += `:- not not reading(bad,${thingASPHandle}).  % complicated valence\n`;
  } else {
    console.warn('invalid valence tag value!', valenceTags[0]);
  }
  if (tag.isNegated) {
    asp = asp.replace(/%/g, '% negated');
  }
  return asp;
}

function generateASPForValueTag(thingASPHandle, tag) {
  let asp = '';
  let [minValue, maxValue] = {full:[11,11],high:[7,10],middling:[4,6],low:[1,3],empty:[0,0]}[tag.value];
  if (tag.isNegated) {
    asp += `% prevent initial value range: ${tag.value}`;
    for (let i = minValue; i < maxValue + 1; i++) {
      asp += `not initialize(set_value(${thingASPHandle},scalar(${i}))).\n`;
    }
  } else {
    asp += `initialize(set_value(${thingASPHandle},scalar(${randInt(minValue, maxValue + 1)}))). `
    asp += `% initially ${tag.value}\n`;
  }
  return asp;
}

function generateASPForEntity(entity) {
  // TODO handle optional entities
  let thingASPHandle = makeThingASPHandle(entity);
  let asp = `% ENTITY: ${entity.name}\n`;
  // label is actually just emoji icon for now
  // TODO if icon is the qmark one, swap it for a random one from the current theme (or the default theme if none)
  asp += `label(${thingASPHandle},${entity.icon},write).\n`;
  // set its valence (good, bad, whatever)
  let valenceTags = entity.tags.filter(t => t.family === 'playerAttitude');
  for (let valenceTag of valenceTags) {
    asp += generateASPForValenceTag(thingASPHandle, valenceTag);
  }
  // TODO set its count (like whether it's singular or multiple)
  return asp + '\n';
}

function generateASPForResource(resource) {
  // TODO handle optional resources
  let thingASPHandle = makeThingASPHandle(resource);
  let asp = `% RESOURCE: ${resource.name}\n`;
  asp += `label(${thingASPHandle},${resource.name},write).\n`;
  // set its valence (good, bad, whatever)
  let valenceTags = resource.tags.filter(t => t.family === 'playerAttitude');
  for (let valenceTag of valenceTags) {
    asp += generateASPForValenceTag(thingASPHandle, valenceTag);
  }
  // set its initial value
  let valueTags = resource.tags.filter(t => t.family === 'initialLevel');
  for (let valueTag of valueTags) {
    asp += generateASPForValueTag(thingASPHandle, valueTag);
  }
  return asp += '\n';
}

function generateASPForRelationship(intent, relationship) {
  // TODO handle negated relationships
  // TODO check if it makes sense for this kind of relationship to exist between these two things
  // (persecute non-conforming relationships)
  // TODO complain to the user if the named LHS and RHS things don't actually exist?
  // (but still allow empty string to denote "anything"?)
  let lhsThing = findThingWithName(intent, relationship.lhs);
  let rhsThing = findThingWithName(intent, relationship.rhs);
  let lhsThingName = lhsThing ? lhsThing.name : '_';
  let rhsThingName = rhsThing ? rhsThing.name : '_';
  let lhsThingASPHandle = lhsThing ? makeThingASPHandle(lhsThing) : '_';
  let rhsThingASPHandle = rhsThing ? makeThingASPHandle(rhsThing) : '_';
  let asp = `% RELATIONSHIP: ${lhsThingName} ${relationship.reltype} ${rhsThingName}\n`;
  if (relationship.reltype === 'consumes') {
    asp += `:- not reading(consumes,relation(${lhsThingASPHandle},${rhsThingASPHandle})).`;
  } else if (relationship.reltype === 'produces') {
    asp += `:- not reading(produces,relation(${lhsThingASPHandle},${rhsThingASPHandle})).`;
  } else if (relationship.reltype === 'collides with') {
    asp += `% apply restitution between ${lhsThingName} and ${rhsThingName} every frame
precondition(tick,tick).
result(tick,apply_restitution(${lhsThingASPHandle},${rhsThingASPHandle})).`;
  } else {
    console.warn(`I ain't never heard of no relationship with reltype: ${relationship.reltype} before!
What in tarnation are you doin'?`);
  }
  return asp + '\n\n';
}

function generateASPForIntent(intent) {
  // NB: this is a *hydrated* intent! it's just an object with keys of idN
  // and values of the things that are in the intent.
  // don't pass in a stored intent – those are shaped differently and we will get confused!
  let asp = `% generated at ${Date.now()}\n\n`;
  // TODO rest of the universal preamble

  // TODO figure out how many entity slots we'll need, set min and max entities
  // TODO same for resources

  // intent has: entities, resources, relationships, triggers
  for (let entity of Object.values(intent).filter(t => t.type === 'entity')) {
    asp += generateASPForEntity(entity);
  }
  for (let resource of Object.values(intent).filter(t => t.type === 'resource')) {
    asp += generateASPForResource(resource);
  }
  for (let relationship of Object.values(intent).filter(t => t.type === 'relationship')) {
    asp += generateASPForRelationship(intent, relationship);
  }
  // TODO generate intent code for triggers

  return asp.trim();
}
