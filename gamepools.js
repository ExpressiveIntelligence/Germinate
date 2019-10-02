/// EXAMPLES

let exampleIntent = {
  entities: [
    {name: "Friend", icon: "💁", tags: [{family: 'playerAttitude', value: 'good'}]},
    {name: "", icon: "❓", tags: [{family: 'optional', value: 'optional'}]}
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
    {lhs: "Friend", reltype: "collides with", rhs: "Insecurity"},
    {lhs: "Insecurity", reltype: "produces", rhs: "Depression"}
  ],
  triggers: [
    {
      when: [{cond: 'Every tick', params: []}],
      then: [{action: 'Do nothing', params: []}]
    }
  ]
};

let gamePoolAIntent = {
  entities: [
    {name: "", icon: "❓", tags: [{family: 'optional', value: 'optional'}]},
    {name: "", icon: "❓", tags: [{family: 'optional', value: 'optional'}]},
    {name: "", icon: "❓", tags: [{family: 'optional', value: 'optional'}]},
    {name: "", icon: "❓", tags: [{family: 'optional', value: 'optional'}]}
  ],
  resources: [
    {
      name: "Depression",
      tags: [
        {family: 'initialLevel', value: 'low'},
        {family: 'tendency', value: 'decrease slowly', isNegated: true},
        {family: 'tendency', value: 'decrease rapidly', isNegated: true},
        {family: 'tendency', value: 'stay the same', isNegated: true},
        {family: 'tendency', value: 'fluctuate wildly', isNegated: true}
      ]
    }
  ],
  relationships: [],
  triggers: []
};

let gamePoolBIntent = {
  entities: [
    {name: "", icon: "❓", tags: [{family: 'optional', value: 'optional'}]},
    {name: "", icon: "❓", tags: [{family: 'optional', value: 'optional'}]},
    {name: "", icon: "❓", tags: [{family: 'optional', value: 'optional'}]},
    {name: "", icon: "❓", tags: [{family: 'optional', value: 'optional'}]}
  ],
  resources: [
    {
      name: "Depression",
      tags: [
        {family: 'initialLevel', value: 'low'},
        {family: 'playerAttitude', value: 'bad'},
        {family: 'tendency', value: 'decrease slowly', isNegated: true},
        {family: 'tendency', value: 'decrease rapidly', isNegated: true},
        {family: 'tendency', value: 'stay the same', isNegated: true},
        {family: 'tendency', value: 'fluctuate wildly', isNegated: true}
      ]
    }
  ],
  relationships: [],
  triggers: [
    {
      when: [{cond: 'Every frame', params: []}],
      then: [{action: 'Increase resource value', params: ['Depression', '']}]
    }
  ]
};

let gamePoolCIntent = {
  entities: [
    {name: "", icon: "❓", tags: [{family: 'optional', value: 'optional'}]},
    {name: "", icon: "❓", tags: [{family: 'optional', value: 'optional'}]}
  ],
  resources: [
    {
      name: "Depression",
      tags: [
        {family: 'initialLevel', value: 'low'},
        {family: 'playerAttitude', value: 'bad'},
        {family: 'tendency', value: 'decrease slowly', isNegated: true},
        {family: 'tendency', value: 'decrease rapidly', isNegated: true},
        {family: 'tendency', value: 'stay the same', isNegated: true},
        {family: 'tendency', value: 'fluctuate wildly', isNegated: true}
      ]
    }
  ],
  relationships: [],
  triggers: [
    {
      when: [{cond: 'Every frame', params: []}],
      then: [{action: 'Increase resource value', params: ['Depression', '']}]
    }
  ]
};

let gamePoolDIntent = {
  entities: [
    {name: "", icon: "❓", tags: [{family: 'optional', value: 'optional'}]},
    {name: "", icon: "❓", tags: [{family: 'optional', value: 'optional'}]}
  ],
  resources: [
    {
      name: "Depression",
      tags: [
        {family: 'initialLevel', value: 'low'},
        {family: 'playerAttitude', value: 'bad'}
      ]
    }
  ],
  relationships: [],
  triggers: [
    {
      when: [{cond: 'Every frame', params: []}],
      then: [{action: 'Increase resource value', params: ['Depression', '']}]
    }
  ]
};

let gamePoolEIntent = {
  entities: [
    {name: "", icon: "❓", tags: []},
    {name: "", icon: "❓", tags: [{family: 'optional', value: 'optional'}]}
  ],
  resources: [
    {
      name: "Depression",
      tags: [
        {family: 'initialLevel', value: 'low'},
        {family: 'playerAttitude', value: 'bad'}
      ]
    }
  ],
  relationships: [],
  triggers: [
    {
      when: [{cond: 'Every frame', params: []}],
      then: [{action: 'Increase resource value', params: ['Depression', '']}]
    },
    {
      when: [{cond: 'Entity is clicked', params: ['']}],
      then: [{action: 'Increase resource value', params: ['Depression', '']}],
      isNegated: true
    }
  ]
};

let exampleGameRules = {
  entities: [
    {name: "Friend", icon: "💁", tags: [
      {family: 'playerAttitude', value: 'good'}
    ]}
  ],
  resources: [
    {
      name: "Depression",
      tags: [
        {family: 'playerAttitude', value: 'bad'},
        {family: 'initialLevel', value: 'low'},
        {family: 'tendency', value: 'increase slowly'}
      ]
    }
  ],
  relationships: [
    {lhs: "Friend", reltype: "collides with", rhs: "Insecurity"},
    {lhs: "Insecurity", reltype: "produces", rhs: "Depression"}
  ],
  triggers: [
    {
      when: [{cond: 'Resource greater than value', params: ['Depression', '5']}],
      then: [{action: 'Spawn entity at', params: ['Friend', '0,0']}]
    }
  ]
};

let gameA1Rules = {
  entities: [
    {name: "Brain", icon: "🧠", tags: [{family: 'playerAttitude', value: 'neutral'}]}
  ],
  resources: [
    {
      name: "Depression",
      tags: [
        {family: 'initialLevel', value: 'low'},
        {family: 'tendency', value: 'increase slowly'}
      ]
    }
  ],
  relationships: [
  ],
  triggers: [
    {
      when: [{cond: 'Mouse is clicked', params: []}],
      then: [{action: 'Increase resource value', params: ['Depression', '1']}]
    },
    {
      when: [{cond: 'Mouse is held', params: []}],
      then: [{action: 'Increase resource value', params: ['Depression', '1']}]
    },
    {
      when: [{cond: 'Resource greater than value', params: ['Depression', '9']}],
      then: [{action: 'Lose game', params: ['Game Over']}]
    },
    {
      when: [{cond: 'Every frame', params: []}],
      then: [{action: 'Prevent entity overlap', params: ['Brain', 'Brain']}]
    }
  ]
};

let gameA2Rules = {
  entities: [
    {name: "Brain", icon: "🧠", tags: [{family: 'playerAttitude', value: 'neutral'}]}
  ],
  resources: [
    {
      name: "Depression",
      tags: [
        {family: 'initialLevel', value: 'low'},
        {family: 'tendency', value: 'increase slowly'}
      ]
    }
  ],
  relationships: [],
  triggers: [
    {
      when: [{cond: 'Mouse is held', params: []}],
      then: [{action: 'Increase resource value', params: ['Depression', '1']}]
    },
    {
      when: [{cond: 'Every frame', params: []}],
      then: [{action: 'Prevent entity overlap', params: ['Brain', 'Brain']}]
    }
  ]
};

let gameA3Rules = {
  entities: [
    {name: "Brain", icon: "🧠", tags: [{family: 'playerAttitude', value: 'neutral'}]},
    {name: "Good thought", icon: "✨", tags: [{family: 'playerAttitude', value: 'neutral'}]}
  ],
  resources: [
    {
      name: "Depression",
      tags: [
        {family: 'initialLevel', value: 'low'},
        {family: 'playerAttitude', value: 'bad'},
        {family: 'tendency', value: 'increase slowly'}
      ]
    }
  ],
  relationships: [
    {lhs: "Good thought", reltype: "collides with", rhs: "Brain"},
    {lhs: "Good thought", reltype: "consumes", rhs: "Brain"},
    {lhs: "Good thought", reltype: "avoids", rhs: "Cursor"}
  ],
  triggers: [
    {
      when: [{cond: 'Entity is clicked', params: ['Good thought']}],
      then: [{action: 'Spawn entity at', params: ['Brain', 'BrainSpawnPoint']}]
    },
    {
      when: [{cond: 'Entity collides with entity', params: ['Brain', 'Good thought']}],
      then: [{action: 'Delete entity', params: ['Brain']}]
    },
    {
      when: [{cond: 'Resource greater than value', params: ['Depression', '9']}],
      then: [{action: 'Lose game', params: ['Game Over']}]
    },
    {
      when: [{cond: 'Mouse is held', params: []}],
      then: [{action: 'Increase resource value', params: ['Depression', '1']}]
    },
    {
      when: [{cond: 'Mouse is held', params: []}],
      then: [{action: 'Make entity look at', params: ['Good thought', 'Cursor']}]
    },
    {
      when: [{cond: 'Mouse is held', params: []}],
      then: [{action: 'Move entity away from', params: ['Good thought', 'Cursor']}]
    },
    { // TODO Eventually probably want all 'Every frame' thens in same trigger
      when: [{cond: 'Every frame', params: []}],
      then: [{action: 'Prevent entity overlap', params: ['Brain', 'Brain']}]
    },
    {
      when: [{cond: 'Every frame', params: []}],
      then: [{action: 'Prevent entity overlap', params: ['Brain', 'Good thought']}]
    },
    {
      when: [{cond: 'Every frame', params: []}],
      then: [{action: 'Prevent entity overlap', params: ['Good thought', 'Brain']}]
    },
    {
      when: [{cond: 'Every frame', params: []}],
      then: [{action: 'Prevent entity overlap', params: ['Good thought', 'Good thought']}]
    }
  ]
};

let gameA4Rules = {
  entities: [
    {name: "Brain", icon: "🧠", tags: [{family: 'playerAttitude', value: 'bad'}]}
  ],
  resources: [
    {
      name: "Depression",
      tags: [
        {family: 'initialLevel', value: 'low'},
        {family: 'tendency', value: 'increase slowly'}
      ]
    }
  ],
  relationships: [
    {lhs: "Brain", reltype: "produces", rhs: "Depression"},
  ],
  triggers: [
    {
      when: [{cond: 'Entity is clicked', params: ['Brain']}],
      then: [{action: 'Increase resource value', params: ['Depression', '1']}]
    },
    {
      when: [{cond: 'Mouse is held', params: []}],
      then: [{action: 'Make entity look at', params: ['Brain', 'Cursor']}]
    },
    {
      when: [{cond: 'Mouse is held', params: []}],
      then: [{action: 'Move entity away from', params: ['Brain', 'Cursor']}]
    },
    {
      when: [{cond: 'Resource greater than value', params: ['Depression', '8']}],
      then: [{action: 'Lose game', params: ['Game Over']}]
    },
    {
      when: [{cond: 'Every frame', params: []}],
      then: [{action: 'Prevent entity overlap', params: ['Brain', 'Brain']}]
    }
  ]
};

let gameA5Rules = {
  entities: [
    {name: "Brain", icon: "🧠", tags: [{family: 'playerAttitude', value: 'good'}]},
    {name: "Good thought", icon: "✨", tags: [{family: 'playerAttitude', value: 'complicated'}]}
  ],
  resources: [
    {
      name: "Depression",
      tags: [
        {family: 'initialLevel', value: 'low'},
        {family: 'playerAttitude', value: 'bad'},
        {family: 'tendency', value: 'increase slowly'}
      ]
    }
  ],
  relationships: [
    {lhs: "Good thought", reltype: "collides with", rhs: "Brain"},
    {lhs: "Good thought", reltype: "avoids", rhs: "Cursor"}
  ],
  triggers: [
    {
      when: [{cond: 'Entity collides with entity', params: ['Brain', 'Good thought']}],
      then: [{action: 'Win game', params: ['CLEARED']}]
    },
    {
      when: [{cond: 'Mouse is held', params: []}],
      then: [{action: 'Increase resource value', params: ['Depression', '1']}]
    },
    {
      when: [{cond: 'Mouse is held', params: []}],
      then: [{action: 'Make entity look at', params: ['Good thought', 'Cursor']}]
    },
    {
      when: [{cond: 'Mouse is held', params: []}],
      then: [{action: 'Move entity away from', params: ['Good thought', 'Cursor']}]
    },
    { // TODO Eventually probably want all 'Every frame' thens in same trigger
      when: [{cond: 'Every frame', params: []}],
      then: [{action: 'Prevent entity overlap', params: ['Brain', 'Brain']}]
    },
    {
      when: [{cond: 'Every frame', params: []}],
      then: [{action: 'Prevent entity overlap', params: ['Brain', 'Good thought']}]
    },
    {
      when: [{cond: 'Every frame', params: []}],
      then: [{action: 'Prevent entity overlap', params: ['Good thought', 'Brain']}]
    },
    {
      when: [{cond: 'Every frame', params: []}],
      then: [{action: 'Prevent entity overlap', params: ['Good thought', 'Good thought']}]
    }
  ]
};

/// GODAWFUL HACKS

let gameB1Rules = exampleGameRules;
let gameB2Rules = exampleGameRules;
let gameB3Rules = exampleGameRules;
let gameB4Rules = exampleGameRules;
let gameB5Rules = exampleGameRules;
let gameC1Rules = exampleGameRules;
let gameC2Rules = exampleGameRules;
let gameC3Rules = exampleGameRules;
let gameC4Rules = exampleGameRules;
let gameC5Rules = exampleGameRules;
let gameD1Rules = exampleGameRules;
let gameD2Rules = exampleGameRules;
let gameD3Rules = exampleGameRules;
let gameD4Rules = exampleGameRules;
let gameD5Rules = exampleGameRules;
let gameE1Rules = exampleGameRules;
let gameE2Rules = exampleGameRules;
let gameE3Rules = exampleGameRules;
let gameE4Rules = exampleGameRules;
let gameE5Rules = exampleGameRules;

/// GAME POOL A

let gamePoolA = {
  intent: gamePoolAIntent,
  intentFile: 'intents/depression-A-intent.lp',
  games: [
    {rules: gameA1Rules, file: 'games/depression-A-game_1.lp'},
    {rules: gameA2Rules, file: 'games/depression-A-game_2.lp'},
    {rules: gameA3Rules, file: 'games/depression-A-game_3.lp'},
    {rules: gameA4Rules, file: 'games/depression-A-game_4.lp'},
    {rules: gameA5Rules, file: 'games/depression-A-game_5.lp'}
  ]
};

/// GAME POOL B

let gamePoolB = {
  intent: gamePoolBIntent,
  intentFile: 'intents/depression-B-intent.lp',
  games: [
    {rules: gameB1Rules, file: 'games/depression-B-game_1.lp'},
    {rules: gameB2Rules, file: 'games/depression-B-game_2.lp'}/*,
    {rules: gameB3Rules, file: 'games/depression-B-game_3.lp'},
    {rules: gameB4Rules, file: 'games/depression-B-game_4.lp'},
    {rules: gameB5Rules, file: 'games/depression-B-game_5.lp'}*/
  ]
};

/// GAME POOL C

let gamePoolC = {
  intent: gamePoolCIntent,
  intentFile: 'intents/depression-C-intent.lp',
  games: [
    {rules: gameC1Rules, file: 'games/depression-C-game_1.lp'}/*,
    {rules: gameC2Rules, file: 'games/depression-C-game_2.lp'},
    {rules: gameC3Rules, file: 'games/depression-C-game_3.lp'},
    {rules: gameC4Rules, file: 'games/depression-C-game_4.lp'},
    {rules: gameC5Rules, file: 'games/depression-C-game_5.lp'}*/
  ]
};

/// GAME POOL D

let gamePoolD = {
  intent: gamePoolDIntent,
  intentFile: 'intents/depression-D-intent.lp',
  games: [
    {rules: gameD1Rules, file: 'games/depression-D-game_1.lp'},
    {rules: gameD2Rules, file: 'games/depression-D-game_2.lp'},
    {rules: gameD3Rules, file: 'games/depression-D-game_3.lp'},
    {rules: gameD4Rules, file: 'games/depression-D-game_4.lp'},
    {rules: gameD5Rules, file: 'games/depression-D-game_5.lp'}
  ]
};

/// GAME POOL E

let gamePoolE = {
  intent: gamePoolEIntent,
  intentFile: 'intents/depression-E-intent.lp',
  games: [
    {rules: gameE1Rules, file: 'games/depression-E-game_1.lp'},
    {rules: gameE2Rules, file: 'games/depression-E-game_2.lp'},
    {rules: gameE3Rules, file: 'games/depression-E-game_3.lp'},
    {rules: gameE4Rules, file: 'games/depression-E-game_4.lp'},
    {rules: gameE5Rules, file: 'games/depression-E-game_5.lp'}
  ]
};

/// EVERYTHING

let gamePools = [gamePoolA, gamePoolB, gamePoolC, gamePoolD, gamePoolE];

/*
// OLD
games[currentPoolIndex][currentGameIndex]

// NEW
gamePools[currentPoolIndex].intent
gamePools[currentPoolIndex].intentFile
gamePools[currentPoolIndex].games[currentGameIndex].file
gamePools[currentPoolIndex].games[currentGameIndex].rules
*/
