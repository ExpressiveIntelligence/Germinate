/* 
 * Main entrypoint of the Rensa-based Cygnus compiler
 */

// TODO: More readable & consistent define names for each module
// TODO: Rename index.js > compile.js?

define(["../compiler/src/asp-to-cygnus-2", "../compiler/src/brain", 
        "../compiler/src/cygnus-to-phaser-brain-2", "../compiler/src/phaser-brain-to-code-2"], 
        function(translateAsp, rensa, ctp, translatePhaserBrain) {

  /*
   * Takes a Cygnus ASP file (as a String), an initial Phaser code file (as a JSON file), and a debug flag
   * e.g., compile (aspGameFile, ./src/initial-phaser-file.json, true)
   * Returns a Phaser Javascript program, with its expected preload(), create(), and update() functions
   */
  function compile (generatedASP, initialPhaserFile, debug) {

    // 1. Make initial Phaser brain

    // TODO: add require definition: initialPhaserFile = ./src/initial-phaser-file.json
    // TODO: accept generatedAsp as either a String or a file?

    if (typeof initialPhaserFile === "string"){
      initialPhaserFile = JSON.parse(initialPhaserFile);
    } 

    var initialPhaserBrain = rensa.makeBrain(initialPhaserFile);

    // 2. Make brain for Cygnus game

    // Read each line of the ASP game
    var lines = generatedASP.split('\n');
    
    // Remove any extra spaces in the lines of the ASP game
    for (var i=0; i<lines.length;i++){
      lines[i] = lines[i].replace(/\s+/g, '');
    }

    // Create a Rensa brain from the ASP game
    var cygnusBrain = rensa.makeBrain(translateAsp.translateASP(lines));
    
    // 3. Convert Cygnus brain to Phaser brain
    // (Translate Cygnus brain into Phaser Abstract Syntax given some initial Phaser assertions)
    var generatedPhaserBrain = ctp.cygnusToPhaser(initialPhaserBrain, cygnusBrain);

    // 4. Write a Phaser program using Phaser brain
    var gameProgram = translatePhaserBrain.writePhaserProgram(generatedPhaserBrain);

    // If debug flag is true, show output at each step.
    if (debug){
      console.log("------------------------------");
      console.log("Initial Phaser Brain: ");
      console.log(initialPhaserBrain);
      console.log("------------------------------");
      console.log("Cygnus Brain: ");
      console.log(cygnusBrain);
      console.log("------------------------------");
      console.log("Generated Phaser Brain: ");
      console.log(generatedPhaserBrain);
      console.log("------------------------------");
    }

    return gameProgram;
  }
  
  return {
    compile : compile
  }

});
