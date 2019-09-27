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

let exampleGameRules = {
  entities: [
    {name: "Friend", icon: "💁", tags: [{family: 'playerAttitude', value: 'good'}]}
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

/// GODAWFUL HACKS

let gamePoolAIntent = exampleIntent;
let gamePoolBIntent = exampleIntent;
let gamePoolCIntent = exampleIntent;
let gamePoolDIntent = exampleIntent;
let gamePoolEIntent = exampleIntent;

let gameA1Rules = exampleGameRules;
let gameA2Rules = exampleGameRules;
let gameA3Rules = exampleGameRules;
let gameA4Rules = exampleGameRules;
let gameA5Rules = exampleGameRules;
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
