requirejs.config({
	paths: {

		"text" : "../lib/text", // Needed for loading text resources like JSON files via RequireJS. Uses 'text!' prefix.
		"Phaser" : "../lib/phaser",
		"jQuery": "../lib/jquery-3.0.0.min",
		//"jQueryUI": "../lib/jquery-ui.min",

		"AspPhaserGenerator" : "../compiler/index",
		"translateAsp" : "../compiler/src/asp-to-cygnus-2",
		"rensa" : "../compiler/src/brain",
		"ctp" : "../compiler/src/cygnus-to-phaser-brain-2",
		"translatePhaserBrain" : "../compiler/src/phaser-brain-to-code-2",

		"initialPhaserFile" : "../compiler/src/initial-phaser-file.json",

		"HealthBar" : "../lib/healthbarstandalone.js", // Needed for generated Phaser games that use HealthBar class
		"State" : "./State.js", // From StoryAssembler/. Needed because generated Phaser games reference Story Assembler's State object
		"Condition" : "./Condition.js", // From StoryAssembler/. Needed by State.js
		"Display" : "./Display.js", // Dummy version of the one from ClimateChange/js/. Referenced by the generated Phaser games. 
		"StoryAssembler" : "./StoryAssembler.js", // Dummy version of StoryAssembler for Phaser to reference

		// *** Initial Cygnus file ***
		"initialGame" : "../games/depression-A-game_1.lp"
	}
});

var loadGame;

requirejs(
	["Phaser","AspPhaserGenerator","text!initialPhaserFile","text!initialGame",
	"text!HealthBar","text!State","text!Condition","text!Display","text!StoryAssembler",
	"jQuery"],
	function (Phaser, AspPhaserGenerator, initialPhaserFile, initialGame,
		HealthBar, State, Condition, Display, StoryAssembler) {


	loadGame_ (initialGame);
	previousGame.disabled=true;

	function loadGame_ (gameFile) {

		var aspGameFile  = gameFile.split("==========")[0];
		var instructions = gameFile.split("==========")[1];
	
		// Compile Cygnus .lp files into Phaser code
		//var generator = AspPhaserGenerator.AspPhaserGenerator (aspGameFile,initialPhaserFile);
		//var phaserProgram = AspPhaserGenerator.generate (generator.cygnusBrain, generator.initialPhaserBrain, true);
		var phaserProgram = AspPhaserGenerator.compile (aspGameFile, initialPhaserFile, false);
	
		/* Phaser Game Constructor: new Game(width, height, renderer, parent, state, transparent, antialias, physicsConfig);
		 * Creates a canvas element
		 */

		phaserProgram = 
			"game = new Phaser.Game({ \
				width: 500, \
				height: 400,\
				renderer: Phaser.AUTO,\
				parent: 'game',\
				resolution: window.devicePixelRatio,\
				transparent: true,\
				state: { preload: preload, create: create, update: update }\
			});"
			+ Display
			+ StoryAssembler
			+ phaserProgram
			+ HealthBar
			+ Condition
			+ State;
	
		eval(phaserProgram);
		
		$("#instructionsdiv").prepend("<div id='instructions'>"//+"<h2>Beach Cleanup</h2>"
			+instructions+"</div>");

		//console.log ("FINISHED PHASER PROGRAM:\n", phaserProgram);

		restart.onclick = function() { restartGame(); };
	}

	// Save the loadGame function to the global scope so we can call it from ../main.js
	loadGame = loadGame_;

	function restartGame() {
		this.game.state.restart();
	}

});
