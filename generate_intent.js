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
  // TODO if negated good, bad and neutral tags are all present on the same thing,
  // we generate an unsatisfiable intent
  let asp = '';
  if (tag.value === 'good') {
    asp += `:- not reading(good,${thingASPHandle}). % positive valence\n`;
    if (tag.isNegated) {
      asp = asp.replace(':- not', ':-').replace('%', '% NOT');
    }
  } else if (tag.value === 'bad') {
    asp += `:- not reading(bad,${thingASPHandle}). % negative valence\n`;
    if (tag.isNegated) {
      asp = asp.replace(':- not', ':-').replace('%', '% NOT');
    }
  } else if (tag.value === 'neutral') {
    if (tag.isNegated) {
      // TODO negation is weird here so we're just ignoring it for now
      // (negated 'neutral' should become "1 { good, bad } 2")
      console.warn("can't currently generate ASP for negated 'neutral' valence tag!", tag);
      asp += "% (omitted negated 'neutral' valence tag)\n";
    } else {
      asp += `:- reading(good,${thingASPHandle}). % neutral valence\n`;
      asp += `:- reading(bad,${thingASPHandle}).  % neutral valence\n`;
    }
  } else if (tag.value === 'complicated') {
    if (tag.isNegated) {
      // TODO negation is weird here so we're just ignoring it for now
      // (negated 'complicated' should become "0 { good, bad } 1")
      console.warn("can't currently generate ASP for negated 'complicated' valence tag!", tag);
      asp += "% (omitted negated 'complicated' valence tag)\n";
    } else {
      asp += `:- not reading(good,${thingASPHandle}). % complicated valence\n`;
      asp += `:- not reading(bad,${thingASPHandle}).  % complicated valence\n`;
    }
  } else {
    console.warn('invalid valence tag value!', tag);
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
  const thingASPHandle = makeThingASPHandle(entity);
  const thingName = entity.name === '' ? '$$RANDOM_NAME$$' : entity.name;
  let asp = `% ENTITY: ${thingName} (${entity.id})\n`;
  // label is actually just emoji icon for now
  // if icon is the question mark, swap it for a random one from the current theme
  const icon = entity.icon === '❓' ? randNth(getCurrentTheme().icons) : entity.icon;
  asp += `label(${thingASPHandle},${icon},write).\n`;
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
  const thingASPHandle = makeThingASPHandle(resource);
  const thingName = resource.name === '' ? '$$RANDOM_NAME$$' : resource.name;
  let asp = `% RESOURCE: ${thingName} (${resource.id})\n`;
  asp += `label(${thingASPHandle},${thingName},write).\n`;
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
  // TODO complain to the user if the named LHS and RHS things don't actually exist
  const {lhs, rhs, reltype} = relationship;

  // figure out whether lhs and rhs are deliberately wildcards
  const lhsIsWildcard = lhs === '';
  const rhsIsWildcard = rhs === '';

  // generate header comment
  let asp = `% RELATIONSHIP: ${lhsIsWildcard ? '_' : lhs} ${reltype} ${rhsIsWildcard ? '_' : rhs}\n`;

  // bail out early if lhs or rhs are non-wildcard but don't point to any extant thing
  const lhsThing = lhsIsWildcard ? null : findThingWithName(intent, lhs);
  const rhsThing = rhsIsWildcard ? null : findThingWithName(intent, rhs);
  if (!lhsThing && !lhsIsWildcard) {
    console.warn(`couldn't find an entity or resource named ${lhs}!`);
    asp += `% (omitted code for relationship involving nonexistent entity or resource type ${lhs})\n\n`;
    return asp;
  }
  if (!rhsThing && !rhsIsWildcard) {
    console.warn(`couldn't find an entity or resource named ${rhs}!`);
    asp += `% (omitted code for relationship involving nonexistent entity or resource type ${rhs})\n\n`;
    return asp;
  }

  // generate appropriate ASP for the specified reltype
  const lhsASPHandle = lhsThing ? makeThingASPHandle(lhsThing) : '_';
  const rhsASPHandle = rhsThing ? makeThingASPHandle(rhsThing) : '_';
  if (reltype === 'consumes') {
    asp += `:- not reading(consumes,relation(${lhsASPHandle},${rhsASPHandle})).`;
  } else if (reltype === 'produces') {
    asp += `:- not reading(produces,relation(${lhsASPHandle},${rhsASPHandle})).`;
  } else if (reltype === 'collides with') {
    asp += `% apply restitution between these entities every frame
precondition(tick,tick).
result(tick,apply_restitution(${lhsASPHandle},${rhsASPHandle})).`;
  } else {
    console.warn(`I ain't never heard of no relationship with reltype: ${reltype} before! \
What in tarnation are you doin'?`);
  }
  return asp + '\n\n';
}

function isThingRequired(thing) {
  return thing.tags.filter(tag => tag.family === 'optional').length === 0;
}

function generateASPForIntent(intent) {
  // NB: this is a *hydrated* intent! it's just an object with keys of idN
  // and values of the things that are in the intent.
  // don't pass in a stored intent – those are shaped differently and we will get confused!
  let asp = `% generated at ${Date.now()}\n\n`;
  // TODO rest of the universal preamble

  // figure out how many entity slots we'll need, set min and max entities
  const entities = Object.values(intent).filter(t => t.type === 'entity');
  const minEntitySlots = entities.filter(isThingRequired).length;
  const maxEntitySlots = entities.length;
  asp += `#const min_entities = ${minEntitySlots}.
#const max_entities = ${maxEntitySlots}.\n`;

  // figure out how many resource slots we'll need, set min and max resources
  const resources = Object.values(intent).filter(t => t.type === 'resource');
  const minResourceSlots = resources.filter(isThingRequired).length;
  const maxResourceSlots = resources.length;
  asp += `#const min_resources = ${minResourceSlots}.
#const max_resources = ${maxResourceSlots}.\n`;

  // set min and max outcomes, assuming these are always constants
  asp += `#const min_outcomes = 2.
#const max_outcomes = 10.
#const min_end_outcomes = 0.\n\n`;

  // intent has: entities, resources, relationships, triggers
  for (let entity of entities) {
    asp += generateASPForEntity(entity);
  }
  for (let resource of resources) {
    asp += generateASPForResource(resource);
  }
  for (let relationship of Object.values(intent).filter(t => t.type === 'relationship')) {
    asp += generateASPForRelationship(intent, relationship);
  }
  // TODO generate intent code for triggers

  return asp.trim();
}
