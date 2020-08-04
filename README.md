# GeminiTool

This repository contains the web frontend for Germinate, a casual creator for rhetorical games built on the Gemini game generator.

## Repository contents

* `assets/`: Sprites and sounds used by the generated Gemini games.
* `client/`: JS files responsible for implementing the Germinate UI.
* `compiler/`: JS files responsible for compiling generated Gemini games (in AnsProlog format) into executable JS.
* `lib/`: External JS libraries used by the `compiler/` and `loader/` JS.
* `loader/`: JS files responsible for loading Gemini games by passing them to the `compiler/`, then concatenating the output JS with necessary libraries and inserting the resulting Phaser game into the HTML page. Provides the global `loadGame(gameFileContents)` function invoked by the main client JS.
* `index.html`: Main HTML file for the Germinate UI.
* `main.css`: Main CSS stylesheet for the Germinate UI.
