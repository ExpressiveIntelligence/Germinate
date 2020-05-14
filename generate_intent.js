function makeThingASPHandle(thing) {
  return `${thing.type}(${thing.type[0]}(${thing.aspID}))`;
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
  // set its valence (good, bad, whatever)
  const valenceTags = entity.tags.filter(t => t.family === 'playerAttitude');
  for (let valenceTag of valenceTags) {
    asp += generateASPForValenceTag(thingASPHandle, valenceTag);
  }
  // set its controller (player, computer)
  const controlledByTags = entity.tags.filter(t => t.family === 'controlledBy');
  for (let tag of controlledByTags) {
    asp += `:- ${tag.isNegated ? '' : 'not'} ${tag.value}_controls(${thingASPHandle}).\n`;
  }
  // set its quantity (just one => singular, several => many)
  const quantityTags = entity.tags.filter(t => t.family === 'quantity');
  for (let tag of quantityTags) {
    const predicate = {'just one': 'singular', 'several': 'many'}[tag.value];
    asp += `:- ${tag.isNegated ? '' : 'not'} ${predicate}(${thingASPHandle}).\n`;
  }
  return asp + '\n';
}

function generateASPForResource(resource) {
  // TODO handle optional resources
  const thingASPHandle = makeThingASPHandle(resource);
  const thingName = resource.name === '' ? '$$RANDOM_NAME$$' : resource.name;
  let asp = `% RESOURCE: ${thingName} (${resource.id})\n`;
  //asp += `label(${thingASPHandle},${thingName},write).\n`; // resource labels seem to cause problems – disable for now
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
  }
  else if (reltype === 'produces') {
    asp += `:- not reading(produces,relation(${lhsASPHandle},${rhsASPHandle})).`;
  }
  else if (reltype === 'tradeoff') {
    asp += `:- not reading(tradeoff,relation(${lhsASPHandle},${rhsASPHandle})).`;
  }
  else if (reltype === 'collides with') {
    asp += `% apply restitution between these entities every frame
precondition(tick,tick).
result(tick,apply_restitution(${lhsASPHandle},${rhsASPHandle})).`;
  }
  else {
    console.warn(`I ain't never heard of no relationship with reltype: ${reltype} before! \
What in tarnation are you doin'?`);
  }
  return asp + '\n\n';
}

function getASPHandle(intent, name, type) {
  const thing = Object.values(intent).find(t => t.name === name && (!type || t.type === type));
  if (!thing && name !== '') console.warn(`no such ${type || 'thing'}`, name);
  return thing ? makeThingASPHandle(thing) : '_';
}

function generateASPForTrigger(intent, trigger) {
  const triggerASPHandle = 'trigger_' + trigger.id;
  const aspClauses = [];
  for (let when of trigger.when) {
    if (when.cond === 'Something happens') {
      // don't need to push anything
    }
    else if (when.cond === 'Every frame') {
      aspClauses.push('precondition(tick,O)');
    }
    else if (when.cond === 'Resource greater than value') {
      const aspHandle = getASPHandle(intent, when.params[0], 'resource');
      aspClauses.push(`precondition(compare(ge,${aspHandle}),O)`);
    }
    else if (when.cond === 'Resource less than value') {
      const aspHandle = getASPHandle(intent, when.params[0], 'resource');
      aspClauses.push(`precondition(compare(le,${aspHandle}),O)`);
    }
    else if (when.cond === 'Entity collides with entity') {
      const aspHandle1 = getASPHandle(intent, when.params[0], 'entity');
      const aspHandle2 = getASPHandle(intent, when.params[1], 'entity');
      aspClauses.push(`precondition(overlaps(${aspHandle1},${aspHandle2},true),O)`);
    }
    else if (when.cond === 'Entity is clicked') {
      const aspHandle = getASPHandle(intent, when.params[0], 'entity');
      aspClauses.push(`precondition(control_event(click(${aspHandle})),O)`);
    }
    else if (when.cond === 'Mouse is clicked') {
      aspClauses.push(`precondition(control_event(button(mouse,pressed)),O)`);
    }
    else if (when.cond === 'Mouse is held') {
      aspClauses.push(`precondition(control_event(button(mouse,held)),O)`);
    }/*
    else if (when.cond === 'Keyboard key is pressed') {
      aspClauses.push(`precondition(${},O)`);
    }
    else if (when.cond === 'Keyboard key is held') {
      aspClauses.push(`precondition(${},O)`);
    }*/
    else if (when.cond === 'Periodically') {
      // TODO allow user to specify which timer?
      aspClauses.push(`precondition(timer_elapsed(_),O)`);
    }
    else {
      console.warn('unsupported cond type', when);
    }
  }
  for (let then of trigger.then) {
    if (then.action === 'Do something') {
      // don't need to push anything
    }/*
    else if (then.action === 'Set resource value') {

    }*/
    else if (then.action === 'Increase resource value') {
      const aspHandle = getASPHandle(intent, then.params[0], 'resource');
      aspClauses.push(`result(O,modify(increase,${aspHandle}))`);
    }
    else if (then.action === 'Decrease resource value') {
      const aspHandle = getASPHandle(intent, then.params[0], 'resource');
      aspClauses.push(`result(O,modify(decrease,${aspHandle}))`);
    }
    else if (then.action === 'Spawn entity') {
      const aspHandle = getASPHandle(intent, then.params[0], 'entity');
      aspClauses.push(`result(O,add(${aspHandle},_,_))`);
    }
    else if (then.action === 'Delete entity') {
      const aspHandle = getASPHandle(intent, then.params[0], 'entity');
      aspClauses.push(`result(O,delete(${aspHandle}))`);
    }
    else {
      console.warn('unsupported action type', then);
    }
  }
  if (aspClauses.length === 0) return ''; // bail out early if there's no supported clauses in this trigger
  let asp = triggerASPHandle + ' :-\n';
  asp += aspClauses.map(clause => '  ' + clause).join(',\n') + '.\n';
  asp += `:- ${trigger.isNegated ? '' : 'not '}${triggerASPHandle}.\n\n`;
  return asp;
}

function isThingRequired(thing) {
  return thing.tags.filter(tag => tag.family === 'optional').length === 0;
}

function generateASPForIntent(intent) {
  // NB: this is a *hydrated* intent! it's just an object with keys of idN
  // and values of the things that are in the intent.
  // don't pass in a stored intent – those are shaped differently and we will get confused!

  // generate ASP header comment
  let asp = `% generated at ${Date.now()}\n\n`;

  // figure out how many entity slots we'll need, set min and max entities
  const entities = Object.values(intent).filter(t => t.type === 'entity');
  //const minEntitySlots = entities.filter(isThingRequired).length;
  const maxEntitySlots = Math.max(entities.length, maxEntitiesInput.value);
  asp += `#const min_entities = 1.
#const max_entities = ${maxEntitySlots}.\n`;

  // figure out how many resource slots we'll need, set min and max resources
  const resources = Object.values(intent).filter(t => t.type === 'resource');
  //const minResourceSlots = resources.filter(isThingRequired).length;
  const maxResourceSlots = Math.max(resources.length, maxResourcesInput.value);
  asp += `#const min_resources = 1.
#const max_resources = ${maxResourceSlots}.\n`;

  // assign aspID properties to all the entities and resources
  for (let i = 0; i < entities.length; i++) {
    entities[i].aspID = i + 1;
  }
  for (let i = 0; i < resources.length; i++) {
    resources[i].aspID = i + 1;
  }

  // set min and max timers, assuming these are always constants
  asp += `#const min_timers = 0.
#const max_timers = 2.\n`;

  // set min and max outcomes, assuming these are always constants
  asp += `#const min_outcomes = 2.
#const max_outcomes = ${maxTriggersInput.value}.
#const min_end_outcomes = 0.
#const max_end_outcomes = 2.\n`;

  // set the remaining utility constants
  asp += `#const max_resource_change_per = 2.
#const max_conditions_per = 2.\n\n`;

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
  for (let trigger of Object.values(intent).filter(t => t.type === 'trigger')) {
    asp += generateASPForTrigger(intent, trigger);
  }

  return asp.trim();
}
