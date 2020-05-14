/// EXAMPLES

let exampleIntent = {
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
    },
    {
      name: "Confidence",
      tags: [
        {family: 'playerAttitude', value: 'bad', isNegated: true},
      ]
    }
  ],
  relationships: [
    {lhs: "Friend", reltype: "produces", rhs: "Confidence"}
  ],
  triggers: [
    {
      when: [{cond: 'Something happens', params: []}],
      then: [{action: 'Do something', params: []}]
    }
  ]
};
