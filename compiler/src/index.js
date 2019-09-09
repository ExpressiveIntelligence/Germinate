/*
var translateAsp = require('./src/asp-to-cygnus-2');
var rensa = require('./src/brain');
var ctp = require('./src/cygnus-to-phaser-brain-2');
var translatePhaserBrain = require('./src/phaser-brain-to-code-2');
*/

//define(["translateAsp", "rensa", "ctp", "translatePhaserBrain"], function(translateAsp, rensa, ctp, translatePhaserBrain) {

define(["../compiler/src/asp-to-cygnus-2", "../compiler/src/brain", "../compiler/src/cygnus-to-phaser-brain-2", "../compiler/src/phaser-brain-to-code-2"], function(translateAsp, rensa, ctp, translatePhaserBrain) {


function AspPhaserGenerator(generatedAsp, initialPhaserFile) {

  var newGenerator = {};
  // Read each line of the ASP game.
  var lines = generatedAsp.split('\n');
  // For each line read,
  for (var i=0; i<lines.length;i++){
    // Remove any extra spaces, and add a period at the end if there isn't one.
    lines[i] = lines[i].replace(/\s+/g, '');
    if (lines[i]!="" && lines[i].slice(-1)!="."){
      lines[i] = lines[i]+".";
    }
    // Remove redundant button information.
    lines[i] = lines[i].replace("control_event(button(mouse_button,held))", 'control_event(mouse_button,held)');
    lines[i] = lines[i].replace("control_event(button(mouse_button,pressed))", 'control_event(mouse_button,pressed)');
  }

  // Store the ASP game.
  newGenerator.aspGame = lines;

  // Store the initial Phaser file as a brain.
  //this.initialPhaser = rensa.makeBrain(JSON.parse(initialPhaserFile));
  if (typeof initialPhaserFile === "string"){
    initialPhaserFile = JSON.parse(initialPhaserFile);
  } 
  newGenerator.initialPhaser = rensa.makeBrain(initialPhaserFile);

  return newGenerator;
}

var generate = function(aspGame, initialPhaser, debug) {
  // Create a Rensa brain from literal ASP.
  var cygnus = rensa.makeBrain(translateAsp.translateASP(aspGame));

  // Translate this brain into Phaser Abstract Syntax given some initial Phaser assertions.
  var generatedPhaserBrain = ctp.cygnusToPhaser(initialPhaser, cygnus);

  // Write a Phaser program using this brain.
  var gameProgram = translatePhaserBrain.writePhaserProgram(generatedPhaserBrain);

  // If debug flag is true, show output at each step.
  if (debug){
    console.log("\n------------------------------");
    console.log("Initial Phaser Brain: ");
    console.log("------------------------------");
    initialPhaser.prettyprint();
    console.log("\n------------------------------");
    console.log("Cygnus Brain: ");
    console.log("------------------------------");
    cygnus.prettyprint();
    console.log("\n------------------------------");
    console.log("Generated Phaser Brain: ");
    console.log("------------------------------");
    generatedPhaserBrain.prettyprint();
  }
  return gameProgram;
};

return {
  AspPhaserGenerator : AspPhaserGenerator,
  generate : generate
}
});
