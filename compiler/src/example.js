require("amd-loader");  //enables amd style requires to be interpreted by running node.
var fs = require('fs');
var AspPhaserGenerator = require('./index');


var aspGame = fs.readFileSync('./test/fixtures/dinner_9_lookAtNoEntity.lp', 'utf8');

//var aspGame = fs.readFileSync('./test/fixtures/create_entity_at_cursor.lp', 'utf8');

//var aspGame = fs.readFileSync('./test/fixtures/dean_17.lp', 'utf8');
//var aspGame = fs.readFileSync('./test/fixtures/timerTest.lp', 'utf8');
//var aspGame = fs.readFileSync('./test/fixtures/games-6-5/compiler_test/property-overlaps.lp', 'utf8');
//var aspGame = fs.readFileSync('./test/fixtures/games-6-5/compiler_test/property.lp', 'utf8');
//var aspGame = fs.readFileSync('./test/fixtures/games-6-5/compiler_test/property-clickHandler.lp', 'utf8');
//var aspGame = fs.readFileSync('./test/fixtures/games-6-5/compiler_test/random_int2.lp', 'utf8');
//var aspGame = fs.readFileSync('./test/fixtures/games-6-5/compiler_test/resource_speed.lp', 'utf8');
//var aspGame = fs.readFileSync('./test/fixtures/games-6-5/compiler_test/resource_speed-movesAway.lp', 'utf8');
//var aspGame = fs.readFileSync('./test/fixtures/games-5-26/games-5_36/lecture_5_26_11.lp', 'utf8');

///test/fixtures/games-5-26/games-5_36/dinner_5_26_1.lp -- precondition(tick,tick).
//var aspGame = fs.readFileSync('./test/fixtures/games-5-26/games-5_36/dinner_5_26_1.lp', 'utf8');

//testing look_at
//var aspGame = fs.readFileSync('./test/fixtures/look_at-theFirst.lp', 'utf8');

//test/fixtures/dinner_11-offendingClickFile.lp -- overlap
//var aspGame = fs.readFileSync('./test/fixtures/dinner_11-offendingClickFile.lp', 'utf8');

//testing clicking stuff.

//test/fixtures/games-5-18/dinner_test_10.lp -- click and delete
//var aspGame = fs.readFileSync('./test/fixtures/games-5-18/dinner_test_10.lp', 'utf8');

//test/fixtures/games-5-18/dinner_test_11.lp -- click and decrease resource
//var aspGame = fs.readFileSync('./test/fixtures/games-5-18/dinner_test_11.lp', 'utf8');

//test/fixtures/games-5-18/dinner_test_17.lp -- draggable example
//var aspGame = fs.readFileSync('./test/fixtures/games-5-18/dinner_test_17.lp', 'utf8');


var initialPhaserFile = fs.readFileSync('./test/fixtures/initial-phaser-file.json', 'utf8');

//apparantly we need to use JSON.parse now; if we don't, initialPhaserFile gets interpreted as a string.
initialPhaserFile = JSON.parse(initialPhaserFile);

//A quirk of amd-loader: AspPhaserGenerator is at this point an object, with a method called AspPhaserGenerator
//var generator = new AspPhaserGenerator(aspGame, initialPhaserFile);
var generator = new AspPhaserGenerator.AspPhaserGenerator(aspGame, initialPhaserFile)

//var phaserProgram = generator.generate(true);
var phaserProgram = AspPhaserGenerator.generate(generator.aspGame, generator.initialPhaser, false)

//console.log("\n------------------------------");
//console.log("Finished Phaser game:");
//console.log("------------------------------");
console.log(phaserProgram);
