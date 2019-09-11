/*
  This file generates a string containing a complete Phaser program, given a brain that contains Phaser abstract syntax.
*/
//define(["ctp", "rensa"], function(ctp, rensa) {
define(["./cygnus-to-phaser-brain-2", "./brain"], function(ctp, rensa) {
    // Change to false to remove whitespace from output.
    var addWhitespace = true;
    var maxEntityCount = 4;
    var labelEntities = true;

    // Contains realized goals from the ASP code.
    var goals;
    var boundary;
    var pools;
    var top = 50;
    var middle = 160;
    var bottom = 250;
    var left  = 50;
    var center = 190;
    var right = 300;
    //var ctp = require('./cygnus-to-phaser-brain-2');
    //var rensa = require('./brain');

    // Input: Phaser abstract syntax (brain).
    // Output: Phaser program (string).
    var writePhaserProgram = function(brain){

        // This string variable will contain the Phaser code.
        var programText = "";

        // Set the realized goals from the ASP code to an empty array.
        goals = [];

        pools = {};
        // Grab variable assertions so we can store their values in create.
        var variableValues = [];

        //Grab sounds so we can set them up in create.
        var sounds = [];

        // Go through each assertion, looking for variable declarations, goals, and pools.
        // If it is a variable initialization,
        // add it to our program.  If it is a goal assertion, update the goals array.
        for (var i in brain.assertions) {

            /* VARIABLE INSTANTIATIONS */
            if (ctp.isVariableAssertion(brain.assertions[i])){
                programText += defineVariable(brain, brain.assertions[i]);
                //console.log("VARIABLE ASSERTION ")
                //console.log(brain.assertions[i]);
                variableValues.push(brain.assertions[i]);
            }
            if (brain.assertions[i]["r"] == "sound"){
                programText += defineVariable(brain,brain.assertions[i]);
                sounds.push(brain.assertions[i]);
            }

            /* REALIZING GOALS */
            if (ctp.isGoalAssertion(brain.assertions[i])){
                updateAspGoals(brain, brain.assertions[i]);
            }

            // Boundary type
            if (brain.assertions[i]["r"] == "boundary"){
                boundary = brain.assertions[i]["l"];
            }

            // Pools
            if (brain.assertions[i]["r"] == "pool"){
                name = brain.assertions[i]["l"];
                if (Object.keys(pools).length == 0){
                    programText += "var pools = {};\n";
                    programText += "var pool_counters = {};\n";
                }

                if (pools[name] == undefined){
                    pools[name] = {
                        "location_order":brain.assertions[i]["location_order"],
                        "location_gen":brain.assertions[i]["location_gen"],
                        "locations":[]}
                    programText += "pools['" + name + "'] = [];\n";
                    programText += "pool_counters['" + name+ "'] = 0;\n";
                }
                pools[name]["locations"].push(brain.assertions[i]["location"][0].terms);

                x = 0;
                y = 0;
                row = brain.assertions[i]["location"][0].terms[0].predicate;
                col = brain.assertions[i]["location"][0].terms[1].predicate;

                if (row=="top"){
                    y = top;
                }
                else if (row=="middle"){
                    y = middle;
                }
                else if (row=="bottom"){
                    y = bottom;
                }
                else{
                    //console.log("Warning: keyword " + row + " is not a known row name.");
                }

                if (col=="left"){
                    x = left;
                }
                else if (col=="center"){
                    x = center;
                }
                else if (col=="right"){
                    x = right;
                }

                programText += "pools['" + name + "'].push({'x':" + x +",'y':" + y + "});\n";

            }
        }

        // Now, go through the assertions again.
        for (var j in brain.assertions){

            /* DEFINED FUNCTIONS */
            if (ctp.isFunctionAssertion(brain.assertions[j])){
                programText += translateFunctionAssertion(brain.assertions[j]);
            }

            /* WRITING A PROGRAM FROM A PROGRAM ASSERTION CONTAINING PHASER ABSTRACT SYNTAX */
            // We assume, for now, there is only one "program" assertion.
            else if (brain.assertions[j]["relation"]=="instance_of" && brain.assertions[j]["r"].indexOf("program")>=0){

                // For each function property specified in the object (e.g. "create"),
                for (var p in brain.assertions[j]) {

                    if (brain.assertions[j].hasOwnProperty(p) && typeof brain.assertions[j][p]!=="function") {
                        if (p!="l" && p!="relation" && p!="r"){
                            // We're going to write the content for that function!
                            // First, let's start by defining the method signature.
                            programText += "function " + p + "("

                            // If this function has parameters, list them.
                            if (brain.assertions[j][p].hasOwnProperty("params")){
                                var paramsList = brain.assertions[j][p]["params"];
                                for (var v=0; v<paramsList.length;v++){
                                    programText += paramsList[v];
                                    if (v<paramsList.length-1){
                                        programText+=",";
                                    }
                                }
                            }
                            programText += "){";

                            /* (Now we can define the body of the function.) */
                            // If this is the create function, assign any initial variable values.
                            // (We assign variable values here, because outside the functions, variables like
                            // game.width have not been correctly assigned yet.)
                            // Also, add default values for arcade physics (like velocity), unless they have been initialized already.
                            if (p==="create"){
                                programText = addDefaultCreateValues(programText, variableValues, brain, j, p);
                                programText = addCreateSounds(programText, sounds, brain, j, p);
                            }

                            // If this is the update function, include default code about entity
                            // velocities.
                            else if (p==="update"){
                                programText = addDefaultUpdateValues(programText);
                            }
                            /* Now, we are going to add statements that we see, regardless of
                               what type of function they correspond to (because we assume they are organized
                               according to the appropriate function names already). */

                            // For each content property specified in the function (e.g. "vars"),
                            for (var c in brain.assertions[j][p]) {
                                if (brain.assertions[j][p].hasOwnProperty(c)) {
                                    // For each assertion in the list of assertions,
                                    for (var a in brain.assertions[j][p][c]){
                                        if (addWhitespace){programText+="\n\t";}
                                        //console.log("FUNCTION " + p + " " + c + " " + a + " ")
                                        //console.log(brain.assertions[j][p][c][a])
                                        programText = addGenericFunctionStatement(programText, brain, brain.assertions[j][p][c][a],p);
                                    }
                                }
                            }

                            // If we are in the update function, add direction changes.
                            if (p==="update"){
                                programText = addDefaultUpdateDirections(programText);
                            }

                            // if we are in the update function, add function to update status of bars that reveal resource values.

                            if (p==="create"){
                                //programText = addResourceBarUpdateCalls(programText, variableValues)
                                programText += "updateLabelsWithVariableValues();\n";

                                programText = addResourceBarCreateCalls (programText, variableValues);
                            }

                            if (p==="create"){
                                programText = addTimerToUpdateNarrative(programText);
                            }

                            if (p==="create"){
                                programText += "updateLabelsWithVariableValues();\n";
                                programText += "informNarrativeOfUpdatedVariables();\n";
                                programText += "updateLabelsWithVariableValues();\n";
                                if (labelEntities) {
                                    programText = addEntityLabelCreateCalls (programText, variableValues);
                                }
                            }

                            if (p==="update"){
                                programText = addResourceValueClamping(programText, variableValues);
                                programText = addUpdateLabelsWithNewValues(programText, variableValues);
                            }

                            if (p==="update"){
                                programText = addResourceBarUpdateCalls(programText, variableValues);
                                // addEntityLabelUpdateCalls()?
                            }
                            if (p==="update"){
                                programText = addDefaultPropertyChecks(programText);
                            }
                            /*
                              if (p === "update"){
                              programText = addCallToUpdateNarrativeStateBasedOnGameValues(programText);
                              }
                            */

                            /* We are all done with the function body! */
                            programText += "};";
                            if (addWhitespace){programText += "\n\n"}
                        }
                    }
                }
            }
        }
        // Set the goals variable.
        programText = setGoalsVariable(programText,goals)

        // Return the final program text.
        return programText;
    };
    
    var addCreateSounds = function(programText, sounds, brain, j, p){

        if(addWhitespace){programText+="\n"};
        for (var z=0; z<sounds.length;z++){
            var curAssert = sounds[z];
            programText += curAssert["l"][0] + " =  game.add.audio('" + curAssert["l"][0] +"');";
            if(addWhitespace){programText+="\n"};
        }
        return programText;
    }

    /*
      Helper function for writePhaserProgram.
      Writes content inside the create function, including assigning values to variables.
    */
    var addDefaultCreateValues = function(programText, variableValues, brain, j, p){
        // Define initial values.
        //Draw the rounded corners of the playspace.

        if(addWhitespace){programText+="\n"};
        for (var z=0; z<variableValues.length;z++){
            var curAssert = variableValues[z];
            //console.log("INITIALIZATION ");
            //console.log(curAssert);
            if (curAssert.hasOwnProperty("value")){
                if (curAssert["value"]!==""){

                    // if(addWhitespace){programText+="\n"};
                    programText += translateVariableAssertion(brain, curAssert, false);
                }
            }
            // If it's an entity, we need to initialize the entity as a group.
            if (curAssert.hasOwnProperty("variableType")){
                if (curAssert["variableType"].indexOf("entity")>=0){
                    programText += translateInitGroup(curAssert);
                }
            }
        }

        programText += establishRoundedPlayArea();
        //add a call to setting up the "walls" that form the boundry of the game
        //the body of this function is defined inside of initial-phaser-file.json
        //programText += "\n\tsetUpWalls();\n";
        programText += "\n\tsetUpSlowDown();\n";

        // Add any entities to the canvas.
        // For each content property specified in the function (e.g. "vars"),
        for (var d in brain.assertions[j][p]) {
            if (brain.assertions[j][p].hasOwnProperty(d)) {
                // For each assertion in the list of assertions,
                for (var b in brain.assertions[j][p][d]){
                    if (ctp.isRelationType(brain.assertions[j][p][d][b], "add_to_location")){
                        if (addWhitespace){programText+="\n\t";}
                        programText += translateAddSpriteAssertion(brain, brain.assertions[j][p][d][b]);
                    }
                }
            }
        }
        return programText;
    }

    /*
      Helper function for writePhaserProgram.
      Writes content inside the update function.  Specifically, this chunk of code:

      for(var k in addedEntities) {if (addedEntities.hasOwnProperty(k)) {
      var entity = addedEntities[k];
      entity.forEach(function(item) {
      item.body.velocity.x *= 0.9;
      item.body.velocity.y *= 0.9;
      }, this);
      }}
    */
    var addDefaultUpdateValues = function(programText){
        if(addWhitespace){programText+="\n\t"};
        programText += "for(var k in addedEntities) {if (addedEntities.hasOwnProperty(k)) {"
        if(addWhitespace){programText+="\n\t\t"};
        programText += "var entity = addedEntities[k];";
        if(addWhitespace){programText+="\n\t\t"};
        programText += "entity.forEach(function(item) {"
        if(addWhitespace){programText+="\n\t\t"};
        programText += "item.body.velocity.x *= 0.9;";
        if(addWhitespace){programText+="\n\t\t"};
        programText += "item.body.velocity.y *= 0.9;";
        if(addWhitespace){programText+="\n\t\t"};
        programText += "item.invincible = false;";
        if(addWhitespace){programText+="\n\t\t"};
        programText+="}, this);"
        if(addWhitespace){programText+="\n\t"};
        programText += "}}";
        if(addWhitespace){programText+="\n"};



        return programText;
    }

    /*
      Helper function for writePhaserProgram.
      Writes content inside the update function.  Specifically, this chunk of code relating to direction changes:

      for(var k in addedEntities) {if (addedEntities.hasOwnProperty(k)) {
      var entity = addedEntities[k];
      entity.forEach(function(item) {
      item.body.velocity.clamp(-300,300);
      if(item.x>game.width){item.x=game.width;}if (item.x<0){item.x=0;} if (item.y>game.height){item.y=game.height;}if (item.y<0){item.y=0;}
      if(item.deleted){item.destroy();}
      }, this);
      }}
    */
    var addDefaultUpdateDirections = function(programText){
        if(addWhitespace){programText+="\n\t"};
        programText += "for(var k in addedEntities) {if (addedEntities.hasOwnProperty(k)) {"
        if(addWhitespace){programText+="\n\t\t"};
        programText += "var entity = addedEntities[k];";
        if(addWhitespace){programText+="\n\t\t"};
        programText += "entity.forEach(function(item) {"
        if(addWhitespace){programText+="\n\t\t"};
        programText += "item.body.velocity.clamp(-300,300);";
        if(addWhitespace){programText+="\n\t\t\t"};

        programText += "item.health = Math.max(0, Math.min(item.health, 100));";
        if(addWhitespace){programText+="\n\t\t\t"};

        programText += "item.alpha = item.health/100;";
        if(addWhitespace){programText+="\n\t\t\t"};

        //programText += "if(item.x>game.width){item.x=game.width;}if (item.x<0){item.x=0;} if (item.y>game.height){item.y=game.height;}if (item.y<0){item.y=0;}"

        programText += "item.angle = angleLerp(item.angle,item.desired_angle,0.05);\n";
        if (boundary == "torus"){

            programText += "item.x_teleported += 1;\n";
            programText += "item.y_teleported += 1;\n";
            if(addWhitespace){programText+="\n\t\t\t"};
            programText += " if (item.x_teleported > 5) {if(item.x + item.width/2 >=  xOffset + 400 ){item.x =item.x - 400+2 + item.width;item.x_teleported = 0;}  if (item.x - item.width/2 <= xOffset){item.x =item.x + 400-2 - item.width;item.x_teleported = 0;} }   if (item.y_teleported > 5) { if(item.y + item.height/2 >=  yOffset + 300 ){item.y =item.y - 300+2 + item.height;item.y_teleported = 0;}   if (item.y - item.height/2 <= yOffset){item.y =item.y + 300-2 - item.height;item.y_teleported = 0;}  }\n";
        }
        else if (boundary == "closed"){
            programText += "if(item.x + item.width/2 > xOffset + 400){item.x = -item.width/2 + xOffset + 400;}  if(item.x - item.width/2 < xOffset){item.x=xOffset+item.width/2;} if(item.y + item.height/2 > yOffset + 300){item.y = -item.height/2 + yOffset + 300;} if(item.y - item.height/2 < yOffset){item.y=yOffset+item.height/2;}\n";
        }
        if(addWhitespace){programText+="\n\t\t"};
        programText += "if(item.deleted && !item.invincible){item.destroy();}";
        if(addWhitespace){programText+="\n\t\t"};
        programText+="}, this);"
        if(addWhitespace){programText+="\n\t"};
        programText += "}}";
        if(addWhitespace){programText+="\n"};
        return programText;
    }

    /*
      Helper function to clamp the values of our resources to be between 0 and 10
    */
    var addResourceValueClamping = function(programText, variableValues){
        var currentVariable;
        var numResources = 0; // need to keep track, as each resource needs to be displayed on a different part of the screen.

        //we need to add an update call for each of our variables of type "resource"
        for(var i = 0; i < variableValues.length; i += 1){

            currentVariable = variableValues[i];
            var variableTypeArray = currentVariable.variableType; // might be undefined
            if(variableTypeArray !== undefined && variableTypeArray[0] === "resource"){
                //we've found a variable of type resource. Add a call ot update it to the progrma text!
                var resourceName = currentVariable.l[0];
                if(addWhitespace){programText+="\n\t"};
                programText += "if(" + resourceName + " > 10){\n\t\t";
                programText += resourceName + " = 10;\n\t}\n\t";
                programText += "else if (" + resourceName + " < 0 ){\n\t\t";
                programText += resourceName + " = 0;\n\t}";
                if(addWhitespace){programText+="\n\t"};
                numResources += 1; // update at end, we want the first bar to have a count of zero.
            }
        }
        return programText;
    }

    var addUpdateLabelsWithNewValues = function(programText, variableValues){
        programText += "updateLabelsWithVariableValues()";
        return programText;
    }

    /*
      Helper function to add calls to update the bars that display the current values of resources.
    */
    var addResourceBarUpdateCalls = function(programText, variableValues){
        var currentVariable;
        var numResources = 0; // need to keep track, as each resource needs to be displayed on a different part of the screen.

        //we need to add an update call for each of our variables of type "resource"
        for(var i = 0; i < variableValues.length; i += 1){

            currentVariable = variableValues[i];
            var variableTypeArray = currentVariable.variableType; // might be undefined

            if(variableTypeArray !== undefined && variableTypeArray[0] === "resource"){
                //we've found a variable of type resource. Add a call ot update it to the progrma text!
                var resourceBarName = "resourceBar" + numResources;
                var resourceName = currentVariable.l[0];
                var percentName = "percent" + numResources;

                if(addWhitespace){programText+="\n\t"};

                programText += "var " + percentName + " = " + resourceName + "/10;";
                
                if(addWhitespace){programText+="\n\t"};
                
                programText += percentName + " = " + percentName + " * 100;";
                
                if(addWhitespace){programText+="\n\t"};
                
                programText += "this."+resourceBarName+".setPercent("+percentName+");";
                
                if(addWhitespace){programText+="\n\t"};
                
                numResources += 1; // update at end, we want the first bar to have a count of zero.
            }
        }
        return programText;
    }

    var addDefaultPropertyChecks = function(programText){

        if(addWhitespace){programText+="\n\t"};
        programText += "markZeroHealthEntitiesForDeletion();";
        if(addWhitespace){programText+="\n\t"};

        return programText
    }

    var addTimerToUpdateNarrative = function(programText){

        if(addWhitespace){programText+="\n\t"};
        programText += "game.time.events.loop(Phaser.Timer.SECOND * 1, informNarrativeOfUpdatedVariables, this);";
        if(addWhitespace){programText+="\n\t"};

        return programText;
    }

    /*
      REPLACED WITH a function inserted into initial-phaser-file.json.
      var addCallToUpdateNarrativeStateBasedOnGameValues = function(programText){


      if(addWhitespace){programText+="\n\t"};
      programText += "//updating program values! TODO: add this to a timer so that it isn't udating every single moment: game.time.events.loop(Phaser.Timer.SECOND * numSecondsPerupdate, callBackFunction, this);";
      if(addWhitespace){programText+="\n\t"};
      //programText += "if(State.get('debugMode') === true){";
      //if(addWhitespace){programText+="\n\t"};
      //programText += "  setVariable("

      programText += "for (i = 0; i < Object.keys(labels).length; i += 1) {";
      if(addWhitespace){programText+="\n\t"};
      programText +=  "var variableName = Object.keys(labels)[i];";
      if(addWhitespace){programText+="\n\t"};
      //programText +=  "    console.log(labels[variableName].name + ' -> ' + labels[variableName].variable + ' ' + labels[variableName].readWrite);";
      if(addWhitespace){programText+="\n\t"};
      programText +=  "    if(labels[variableName].readWrite === 'write'){";
      if(addWhitespace){programText+="\n\t"};
      programText +=  "      setVariable(labels[variableName].name, window[labels[variableName].variable]);";
      if(addWhitespace){programText+="\n\t"};
      programText +=  "    }";
      if(addWhitespace){programText+="\n\t"};
      programText += "  }";
      if(addWhitespace){programText+="\n\t"};
      //programText += "}";




      programText += "for (var key in labels) {";
      if(addWhitespace){programText+="\n\t"};
      programText += "  if (labels.hasOwnProperty(key)) {";
      if(addWhitespace){programText+="\n\t"};
      programText +=  "    console.log(key + ' -> ' + p[key]);";
      if(addWhitespace){programText+="\n\t"};
      programText +=  "    if(p[key] === satiation){";
      if(addWhitespace){programText+="\n\t"};
      programText +=  "      setVariable(satiation, p[key]);";
      if(addWhitespace){programText+="\n\t"};
      programText +=  "    }";
      if(addWhitespace){programText+="\n\t"};
      programText += "  }";
      if(addWhitespace){programText+="\n\t"};
      programText += "}";
      if(addWhitespace){programText+="\n\t"};
      programText += "}";

      return programText;
      }
    */

    var addResourceBarCreateCalls = function(programText, variableValues){
        var currentVariable;
        var numResources = 0; // need to keep track, as each resource needs to be displayed on a different part of the screen.
        if(addWhitespace){programText+="\n\t"};
        for(var i = 0; i < variableValues.length; i += 1){

            currentVariable = variableValues[i];
            var variableTypeArray = currentVariable.variableType; // might be undefined
            if(variableTypeArray !== undefined && variableTypeArray[0] === "resource"){

                //we've found a variable of type resource. Add a call to update it to the program text!
                var barConfigName= "barConfig" + numResources;
                if(addWhitespace){programText+="\n\t"};
                var resourceName = currentVariable.l[0];
                
                programText += "var " + barConfigName + " = createProgressBarConfig(" + resourceName + ", " + numResources + ");";//", labels['" + resourceName + "'].name);";

                
                if(addWhitespace){programText+="\n\t"};
                programText += "this.resourceBar" + numResources + " = new HealthBar(this.game, " + barConfigName +")";
                if(addWhitespace){programText+="\n\t"};

                //programText += "\n console.log('labels:',labels);";
                //console.log ("current Variable: ", currentVariable);
                //console.log ("resourceName: ", resourceName);

                //programText += "if (labels[" + resourceName + "] != undefined) { " +
                //   "\n console.log('resource label:', labels['" + resourceName + "'].name);" +
                 //   "\n } else { console.log (" + resourceName + ", 'has no label'); } ";

                //programText += "addBarLabel(" + barConfigName + ", " + numResources + ", labels['" + resourceName + "'].name);"
                programText += //"\n if(labels[" + resourceName + "] != undefined) {" +
                    "\n \t addBarLabel(" + barConfigName + ", " + numResources + ", labels['" + resourceName +
                    "'].name);";// +
                    //"\n console.log('resource label:', labels['" + resourceName + "'].name);" +
                    //"\n }" ;


                if(addWhitespace){programText+="\n\t"};


                //we've found a variable of type resource. Add a call ot update it to the progrma text!
                var resourceBarName = "resourceBar" + numResources;
                var resourceName = currentVariable.l[0];
                var percentName = "percent" + numResources;

                if(addWhitespace){programText+="\n\t"};
                programText += "var " + percentName + " = " + resourceName + "/10;";
                if(addWhitespace){programText+="\n\t"};
                programText += percentName + " = " + percentName + " * 100;";
                if(addWhitespace){programText+="\n\t"};
                programText += "this."+resourceBarName+".setPercentNow("+percentName+");";
                if(addWhitespace){programText+="\n\t"};

                numResources += 1; // update at end, we want the first bar to have a count of zero.
            }
        }
        return programText;
    }


    /*
     * Add labels to entities (if a label was defined for that entity)
     */
    var addEntityLabelCreateCalls = function (programText, variableValues){

        programText +=  "for (var k in addedEntities) {\n" +
                        "\t if (addedEntities.hasOwnProperty(k)) {\n" +
                        "\t \t var entity = addedEntities[k];\n" +
                        "\t \t if (labels[k] != null) {\n" +
                        "\t \t \t var labelText = labels[k].name;\n" +
                        "\t \t \t //console.log ('entity labeltext',labelText);\n" +
                        "\t \t \t entity.forEach (function(item) {\n" +
                        "\t \t \t \t //console.log('item',item);\n" +
                        "\t \t \t \t var entityLabel = game.add.text (0,0,labelText," +
                            "{font:'16px Arial',fill:'#ffffff'});\n" +
                        "\t \t \t \t //entityLabel.anchor.set(2.1,0.4); // For very short labels (e.g., 'e1') \n" +
                        "\t \t \t \t entityLabel.anchor.set(1.6,0.5); // For normal labels \n" +
                        "\t \t \t \t item.addChild(entityLabel);\n" +
                        "\t \t \t })\n"+
                        "\t \t }\n"+
                        "\t }\n"+
                        "}\n";

        return programText;

    }

    /*
      Helper function for writePhaserProgram.
      Writes out the goals at the end of the JS file.

      Example output that would be added to programText:
      goals=['Prevent:[r1] le [0]','Maintain r1'];
    */
    var setGoalsVariable = function(programText, goals){
        // Set goals variable.
        if (goals !== undefined && goals.length != 0){
            programText += "goals=[";
            for (var y=0;y<goals.length;y++){
                programText += "'"+goals[y]+"'";
                if (y<goals.length-1){
                    programText+=",";
                }
            }
            programText+="];";
        }
        return programText;
    }

    /*
      Helper function for writePhaserProgram.
      For any Phaser function (e.g., "create", "update"), checks the current assertion
      and attempts to translate it.
    */
    var addGenericFunctionStatement = function(programText,brain,curAssert,p){
        // Declare / change value of variables.
        if (ctp.isVariableAssertion(curAssert)){
            programText += translateVariableAssertion(brain, curAssert, true);
        }
        else if (ctp.isConditionalAssertion(curAssert)){
            programText += translateConditionalAssertion(brain, curAssert);
        }
        else if (ctp.isSetValueAssertion(curAssert)){
            //console.log("TRANSLATING SET VALUE");
            //console.log(curAssert);
            programText += translateSetValue(curAssert);
        }
        else if (ctp.isRelationType(curAssert, "has_sprite")){
            programText += translateHasSpriteAssertion(brain, curAssert);
        }
        else if (ctp.isRelationType(curAssert, "add_to_location") && p!=="create"){
            programText += translateAddSpriteAssertion(brain, curAssert);
        }
        else if (ctp.isRelationType(curAssert, "action")&& curAssert["r"][0].indexOf("delete")>=0){
            programText += translateDeleteSpriteAssertion(brain, curAssert);
        }
        else if (ctp.isRelationType(curAssert, "set_mode")){
            programText += translateSetMode(brain, curAssert);
        }
        else if (ctp.isMotionAssertion(curAssert)){
            programText += translateMove(curAssert,curAssert["relation"]);
        }
        else if (ctp.isRelationType(curAssert, "apply_force")){
            programText += translateGravity(curAssert);
        }
        else if (ctp.isGoalAssertion(curAssert)){
            updateAspGoals(brain, curAssert);
        }
        else if (ctp.isCallbackAssertion(curAssert)){

            programText += translateListenerAssertion(curAssert);
        }
        else if (ctp.isTimerCallbackAssertion(curAssert)){
            programText += translateTimer_elapsedAssertion(brain, curAssert);
        }
        else if (ctp.isMousePressedAssertion(curAssert)){
            programText += translatePressedAssertion(curAssert);
        }
        else if (ctp.isDraggableAssertion(curAssert)){
            programText += translateDraggableAssertion(curAssert);
        }
        else if (ctp.isOverlapAssertion(curAssert)){
            programText += translateOverlapAssertion(curAssert);
        }
        else if (ctp.isNotOverlapAssertion(curAssert)){
            programText += translateNotOverlapAssertion(curAssert);
        }
        else if (ctp.isStaticAssertion(curAssert)){
            programText += translateStaticAssertion(curAssert);
        }
        else if (ctp.isSetColorAssertion(curAssert)){
            programText += translateSetColorAssertion(brain, curAssert);
        }
        else if (ctp.isRestitutionAssertion(curAssert)){
            programText += translateRestitutionAssertion( curAssert);
        }
        else if (ctp.isRotatesAssertion(curAssert)){
            programText += translateRotatesAssertion( curAssert);
        }
        else if (ctp.isRotateToAssertion(curAssert)){
            programText += translateRotateToAssertion( curAssert);
        }
        else if (ctp.isDenotesAssertion(curAssert)){
            programText += translateDenotesAssertion( curAssert);
        }
        else if(ctp.isLabelAssertion(curAssert)){
            programText += translateLabelAssertion(curAssert);
        }
        else if(ctp.isLookAtAssertion(curAssert)){
            programText += translateLookAtAssertion(curAssert);
        }
        else if (curAssert["relation"] == "add_sound") {
            programText += translateAddSound(curAssert);
        }
        else if (curAssert["relation"] == "fill"){
            //console.log('A');
            programText += translateFill(curAssert);
        }
        else if (curAssert["relation"] == "clear"){
            programText += translateClear(curAssert);
        }
        else if (curAssert["relation"] == "draw"){
            programText += translateDraw(curAssert);
        }
        else if (curAssert["relation"] == "clear"){
            programText += translateClear(curAssert);
        }
        else{
            //console.log('DONT KNOW WHAT TO DO WITH:');
            //console.log(curAssert);
        }
        return programText;
    }
    var translateClear = function(cur, nested_entity){
        var x = "0";
        var y = "0";
        var prefix = "";
        var postfix = "";
        nested_entity = (typeof nested_entity !== 'undefined') ?  nested_entity : "*****";

        if (cur.l[0].predicate === "cursor"){
            x = "game.input.mousePointer.x"
            y = "game.input.mousePointer.y"
        }
        else if(cur.handler !== undefined && cur.handler.indexOf("ClickListener") >= 0){
            x = "clickedOnObject.x-clickedOnObject.width/2";
            y = "clickedOnObject.y-clickedOnObject.height/2";
        }
        else {
            var current = cur["l"][0].predicate;
            if (current == undefined){
                current = cur["l"][0];
            }
            var nesting = current == nested_entity;
            if (!nesting) {
                prefix = "addedEntities['"+current+"'].forEach(function(item) {\n";
                x = "item.x-item.width/2";
                y = "item.y-item.height/2";
                postfix = "},this)\n;";
            }
            else {
                x = current + ".x-" + current + ".width/2";
                y = current + ".y-" + current + ".height/2";
            }
        }


        return prefix + "clear(" + x + "-xOffset," + y + "-yOffset,'circle');\n" + postfix;


    }
    var translateDraw = function(cur, nested_entity){
        var x = "0";
        var y = "0";
        var prefix = "";
        var postfix = "";
        nested_entity = (typeof nested_entity !== 'undefined') ?  nested_entity : "*****";

        if (cur.l[0].predicate === "cursor"){
            x = "game.input.mousePointer.x"
            y = "game.input.mousePointer.y"
        }
        else if(cur.handler !== undefined && cur.handler.indexOf("ClickListener") >= 0){
            x = "clickedOnObject.x-clickedOnObject.width/2";
            y = "clickedOnObject.y-clickedOnObject.height/2";
        }
        else {
            var current = cur["l"][0].predicate;
            if (current == undefined){
                current = cur["l"][0];
            }
            var nesting = current == nested_entity;
            if (!nesting) {
                prefix = "addedEntities['"+current+"'].forEach(function(item) {\n";
                x = "item.x-item.width/2";
                y = "item.y-item.height/2";
                postfix = "},this)\n;";
            }
            else {
                x = current + ".x-" + current + ".width/2";
                y = current + ".y-" + current + ".height/2";
            }
        }


        return prefix + "draw(" + x + "-xOffset," + y + "-yOffset,'circle','" + cur.r + "');\n" + postfix;

    }
    var translateFill = function(cur){
        //console.log(cur);
        var x = 0;
        var y = 0;
        var width = 400;
        var height = 300;
        var location_ = '';
        if (cur["l"][0].predicate === "all"){
            location_ = 'all';
        }
        else if  (cur["l"][0].predicate === "location"){
            row = cur["l"][0].terms[0].predicate;
            col = cur["l"][0].terms[1].predicate;
            location_ = 'location(' + row + ',' + col + ')';
        }

        return "fill('" + location_ + "','" + cur["r"] + "');";
    }
    /*
      The remaining functions will translate an assertion ("a"), sometimes based on the
      contents of the brain ("b").
    */

    /* Helper function - declares a variable. */
    var defineVariable = function(b,a){
        str = "";
        // If variable is a property, don't define it.
        if (a["l"][0].indexOf(".")<0){
            str = "var " + a["l"][0] + ";";
            if (addWhitespace){str+="\n";}
        }
        return str;
    }

    // Input: assertion to convert ("a"), brain that contains that assertion ("b")
    // Convert an assertion containing a variable declaration to string.
    // We're assuming here, like in most other places, that there is only one
    // element in the list.
    var translateVariableAssertion = function(b, a, isNewVar){
        var str="";
        if (addWhitespace){str+="\t";}
        // If this is an attribute (e.g. "e1.health")
        if (a["l"][0].indexOf(".")>=0){
            // Make sure there is a value defined (for e.g. "e1.health"),
            // and also make sure that e1 is a defined variable.
            var parent = a["l"][0].substring(0,a["l"][0].indexOf("."))
            if (a.hasOwnProperty("value") && b.getAssertionsWith({"l":[parent],"relation":"instance_of","r":["variable"]}).length>0){
                // TODO deal with hash
                str += a["l"][0]+"="+a["value"]+";";
                if (addWhitespace){str+="\n";}
            }
        }
        // If this isn't an attribute (e.g. "e1")
        else{
            if (isNewVar){str += "var ";}
            str+=a["l"][0];
            // Set variable equal to value, if specified.
            if (a.hasOwnProperty("value")){
                // if value is a {}, set appropriately
                if (!(a["value"] instanceof Array) && typeof a["value"]  === "object"){
                    var size = Object.keys(a["value"]).length;
                    str += "={";
                    var count = 0;
                    for (var k in a["value"]){
                        if (a["value"].hasOwnProperty(k)){
                            str += "'" + k + "':'" + a["value"][k] + "'";
                            count+=1;
                            if (count<size){str+=",";}
                        }
                    }
                    str +="}"
                }
                // Otherwise,
                else{
                    str += "="+a["value"];
                }
            }
            str += ";";
            if (addWhitespace){str+="\n";}
        }
        return str;
    }

    // Convert an assertion that changes the value of a variable to string.
    var translateSetValue = function(a,nested_entity){

        nested_entity = (typeof nested_entity !== 'undefined') ?  nested_entity : "*****";
        var str="";

        var entity1 = "";
        if (a["l"][0].indexOf(".")>0){
            names = a["l"][0].split(".");
            // Find entity1
            entity1 = names[0];
        }

        //console.log(str=a["l"][0] + "=" + a["r"][0] + ";\n")
        // Check if dealing with properties
        if (!(nested_entity === entity1) && (a["l"][0].indexOf(".")>0 || a["r"][0].indexOf(".")>0) && !(a["l"][0].indexOf("game.")>0) && !(a["r"][0].indexOf("game.")>0)){
            if (a["l"][0].indexOf(".")>0){
                names = a["l"][0].split(".");
                // Find entity1
                entity1 = names[0];
                // Find property1
                property1 = names[1];

                if (a["r"][0].indexOf(".")>0){
                    names = a["r"][0].split(".");
                    // Find entity2
                    entity2 = names[0];
                    // Find property2
                    property2 = names.slice(1).join('.');//names[1];
                    if(entity1 !== entity2){
                        throw "It is nonsensical to set a single entity's property to be the value of all of another group of entities' properties."
                    }
                    else{
                        /* CASE 1.5: if e1.property  = modified value of e1 (e.g. e1.health = e1.health - 1) */
                        if(a.handler !== undefined && a.handler.indexOf("ClickListener") >= 0){
                            str="clickedOnObject."+property1+"=clickedOnObject."+property2;
                        }
                        else if(a.handler !== undefined && a.handler.indexOf("OverlapHandler") >= 0){
                            if (addWhitespace){str+="\n";}
                            str += "\tif (typeof e1 !== \'undefined\' && e1.key === '" + entity1 + "'){\n\t\te1."+property1+" = " + "e1."+property2+";\n\t}";
                            if (addWhitespace){str+="\n";}
                            str += "\tif (typeof e2 !== \'undefined\' && e2.key === '" + entity1 + "'){\n\t\te2."+property1+" = " + "e2."+property2+";\n\t}";
                            if (addWhitespace){str+="\n";}
                        }
                        else{
                            str="addedEntities['"+entity1+"'].forEach(function(item){item." + property1 + " = item."+property2+";}, this);";
                        }
                    }
                }
                /* CASE 2: If e1.property = some_known_var_or_value, */
                else{
                    entity2 = a["r"][0];
                    str="addedEntities['"+entity1+"'].forEach(function(item){item." + property1 + " = "+entity2+";}, this);";
                }
            }
            /* CASE 3: If non-property variable = e2.property's value, */
            else{
                entity1 = a["l"][0];
                names = a["r"][0].split(".");
                // Find entity2
                entity2 = names[0];
                // Find property2
                property2 = names[1];

                str+="var propVal = "+a['r'][0]+";"
                if(addWhitespace){str+="\n"};
                // TODO There is probably a better way to access a group's item property.
                str+="addedEntities['"+entity2+"'].forEach(function(item){propVal=item."+property2+";}, this);";
                if(addWhitespace){str+="\n"};
                str+=a["l"][0] + "= propVal;";
            }
        }
        // Simple set value.
        else{
            if (addWhitespace){
                str=a["l"][0] + "=" + a["r"][0] + ";\n";
            }
            else{
                str=a["l"][0] + "=" + a["r"][0] + ";";
            }
        }
        return str;
    }

    // Convert an assertion containing a conditional to string.
    var translateConditionalAssertion = function(b,a){
        var str="";

        var emptyHypothesis = false;
        if (a["l"].length < 1){
            emptyHypothesis = true;
        }

        var nested = false;

        if(a["r"][0].handler !== undefined && a["r"][0].handler.indexOf("OverlapHandler") >= 0){
            str += "if (e1.deleted || e1.invincible){ console.log('e1.deleted'); return;}\n";
            str += "if (e2.deleted || e1.invincible){ console.log('e2.deleted');return;}\n";
            str += "console.log('No one deleted');\n";
        }
        var nesting_entity = "****";
        /* Formulate hypothesis. */
        if (!emptyHypothesis){

            for (var i=0; i< a["l"].length;i++){
                //console.log("LHS")
                //console.log(a["l"][i]["l"][0])
                if (a["l"][i]["l"][0].predicate === "property" ){
                    nested = true;
                    entity = a["l"][i]["l"][0].terms[0].predicate;
                    str += "addedEntities['" + entity +"'].forEach(function(" + entity + ") {";
                    var property_name = a["l"][i]["l"][0].terms[1].predicate;
                    a["l"][i]["l"] = entity + "." + property_name;
                    nesting_entity = entity;
                }
                if (a["l"][i]["l"][0].predicate === "distance"){
                    nested = true;
                    entity = a["l"][i]["l"][0].terms[0].terms[0].predicate;
                    str += "addedEntities['" + entity +"'].forEach(function(" + entity + ") {";
                    var other = a["l"][i]["l"][0].terms[1].terms[0].predicate;
                    var type = a["l"][i]["l"][0].terms[2].predicate;
                    a["l"][i]["l"] = 'get_distance(' + entity + ',"' + other + '","' + type + '")\n';
                    nesting_entity = entity;
                    //todo: JG
                    //console.log("DISTANCE STU|FFFF");
                }
            }

            str += "if(";
            // Add each assertion in the hypothesis.

            for (var i=0; i< a["l"].length;i++){
                //console.log(a["l"][i]["l"][0]);
                if (a["l"][i]["relation"]=="eq"){
                    str += a["l"][i]["l"];
                    str += "==";
                    str+=a["l"][i]["r"];
                }
                else if (a["l"][i]["relation"]=="gt"){
                    str += a["l"][i]["l"];
                    str += ">";
                    str+=a["l"][i]["r"];
                }
                else if (a["l"][i]["relation"]=="ge"){

                    str += a["l"][i]["l"];
                    str += ">=";
                    str+=a["l"][i]["r"];
                }
                else if (a["l"][i]["relation"]=="lt"){
                    str += a["l"][i]["l"];
                    str += "<";
                    str+=a["l"][i]["r"];
                }
                else if (a["l"][i]["relation"]=="le"){
                    str += a["l"][i]["l"];
                    str += "<=";
                    str+=a["l"][i]["r"];
                }
                else if (a["l"][i]["relation"]=="near"){
                    // str+= |entity2.location - entity1.location| < screen.width*0.1
                    var left = a["l"][i]["l"];
                    var right = a["l"][i]["r"];
                    // var leftLoc = new Phaser.Point(left.x, left.y);
                    // var rightLoc = new Phaser.Point(right.x, right.y);
                    // var distance = Phaser.Point.distance(leftLoc,rightLoc);
                    str+="Phaser.Point.distance(new Phaser.Point("+left+".x,"+left+".y),new Phaser.Point("+right+".x,"+right+".y)) < game.width*0.1";
                }
                else if (a["l"][i]["relation"]=="control_event" && a["l"][i]["l"][0]==[ 'mouse_button' ] && a["l"][i]["r"][0]==["held"]){
                    str+="game.input.activePointer.leftButton.isDown";
                }
                else if (a["l"][i]["relation"]=="control_event" && a["l"][i]["l"][0]==[ 'mouse_button' ] && a["l"][i]["r"][0]==["released"]){
                    str+="!game.input.activePointer.leftButton.isDown";
                }
                else{
                    console.error("Error: unrecognized relation " + a["relation"] + " for conditional assertion.  \n\tFile: PhaserInterpreter.  Function: translateConditionalAssertion.");
                }


                if (i <a["l"].length-1){
                    str+=" " + a["l"][i+1]["logicalOp"] + " ";
                }
            }
            str+="){";
            if (addWhitespace){str+="\n";}
        }

        /* Formulate conclusion. */
        // Add each assertion in the conclusion.
        if (!emptyHypothesis && addWhitespace){str+="\t\t";}
        for (var j=0; j<a["r"].length;j++){
            //console.log(a["r"][j]);
            if (a["r"][j]["relation"]==="set_value"){
                //console.log("TRANSLATE SET VALUE")

                str+=translateSetValue(a["r"][j],nesting_entity);
            }
            else if (a["r"][j]["relation"]==="add_to_location"){
                str+=translateAddSpriteAssertion(b,a["r"][j],nesting_entity);
            }
            else if (a["r"][j]["relation"]==="action" && a["r"][j]["r"].indexOf("delete")>=0){
                str+=translateDeleteSpriteAssertion(b,a["r"][j]);
            }
            else if (a["r"][j]["relation"]==="set_mode"){
                str+=translateSetMode(b,a["r"][j]);
            }
            else if (a["r"][j]["relation"]==="move_towards" || a["r"][j]["relation"]==="move_away" || a["r"][j]["relation"]==="moves"){
                str += translateMove(a["r"][j],a["r"][j]["relation"],nesting_entity);
            }
            else if (a["r"][j]["relation"]==="instance_of" && a["r"][j]["r"].indexOf("static")>=0){
                str+=translateStaticAssertion(a["r"][j]);
            }
            else if (a["r"][j]["relation"]==="set_color"){
                str+=translateSetColorAssertion(b,a["r"][j],nesting_entity);
            }
            else if (a["r"][j]["relation"]==="rotates"){
                str+=translateRotatesAssertion(a["r"][j],nesting_entity);
            }
            else if (a["r"][j]["relation"]==="rotate_to"){
                str+=translateRotateToAssertion(a["r"][j], nesting_entity);
            }
            else if (a["r"][j]["relation"]==="look_at"){
                str+=translateLookAtAssertion(a["r"][j], nesting_entity);
            }
            else if (a["r"][j]["relation"]==="fill"){
                str +=translateFill(a["r"][j]);
            }
            else if (a["r"][j]["relation"]==="draw"){
                str +=translateDraw(a["r"][j], nesting_entity);
            }
            else if (a["r"][j]["relation"]==="clear"){
                str +=translateClear(a["r"][j], nesting_entity);
            }
            else{
                //console.log("translateConditionalAssertion -- DONT KNOW WHAT TO DO WITH:");
                //console.log(a["r"][j]);
            }
            if (addWhitespace){str+="\n\t";}
        }
        if (addWhitespace){str+="\t";}
        if (!emptyHypothesis){
            str+="}"
            if (a["r"][0].handler != undefined && (a["r"][0].handler.indexOf("PressedHandler") > 0  ||  a["r"][0].handler.indexOf("ClickListener") > 0)){
                used_whitespace = "";
                if (addWhitespace){
                    used_whitespace = "\n";
                }
                //str += used_whitespace + "else {"+used_whitespace;
                //str += "bad_sound.play();"+used_whitespace;
                //str += "}";
            }
        }
        if (addWhitespace){str+="\n";}
        if (nested){
            str += "}, this);"
        }
        return str;
    };

    // Input: b is the full brain, a is the assertion to translate.
    // Example:
    // > player has_sprite sprite1
    // > sprite1 instance_of sprite with image: someImageName
    // > game.load.image('"'+player+'"', 'assets/sprites/' + someImageName);
    var translateHasSpriteAssertion=function(b, a){
        var str = "";

        // Find sprite image name.
        var spriteImgID = b.getAssertionsWith({"l":[a["r"][0]],"relation":"instance_of","r":["sprite"]});

        var useFancySprites = false;
        var circleAssetNames = ["Circle_Outlined_GradientSwirl2.png", "Circle_Outlined_grid2.png", "Circle_Swirl_NegativeSpace.png", "Circle_grid2.png", "Circle_outergradient.png", "Circle_outlined_outergradient.png", "Circle_outlined_swirl2.png","Circle_pixels.png"];
        var squareAssetNames = ["square.png", "square1.0.png", "square1.1.png","square2.0.png","square2.1.png","square2.2.png","square3.0.png","square3.1.png","square3.2.png"];
        var starAssetNames = ["starCircleCut.png","starCircleCut2.png","starDiagonalLines.png","starDiagonalLines2.png","starGradientLinear.png","starGradientRadial.png","starGradientRadial2.png","starStyled01.png","starTriCuts.png"];
        var pentagonAssetNames = ["pentagon.png","pentagon1.0.png","pentagon2.0.png","pentagon3.0.png","pentagon3.1.png"];
        var triangleAssetNames = ["triangleCircleCut.png","triangleCircleCut2.png","triangleDiagonalLines.png","triangleDiagonalLines2.png","triangleLinearGradient.png","triangleRadialGradient.png","triangleStyled01.png","triangleStyled02.png"];
        //console.log("ADD SPRITE");
        // If the image name exists, add the appropriate preload message for the sprite.

        str+= "game.load.image('circle','assets/sprites/circle.png');"
        str+= "game.load.image('triangle','assets/sprites/triangle.png');"
        str+= "game.load.image('square','assets/sprites/square.png');"
        str+= "game.load.image('smiley','assets/sprites/smiley.png');"

        if (spriteImgID!=undefined && b.assertions[spriteImgID]!=undefined){
            if (b.assertions[spriteImgID]["image"]){
                var img = b.assertions[spriteImgID]["image"];
                if(useFancySprites){
                    var assetIndex = -999;
                    if(img === "circle.png"){
                        //dealing with circles
                        assetIndex = Math.floor(Math.random()*circleAssetNames.length);
                        str+= "game.load.image('" + a["l"][0] + "','assets/sprites/newArt/Circle/"+circleAssetNames[assetIndex]+"');"
                    }
                    else if(img === "triangle.png"){
                        //dealing with triangles
                        assetIndex = Math.floor(Math.random()*triangleAssetNames.length);
                        str+= "game.load.image('" + a["l"][0] + "','assets/sprites/newArt/Triangle/"+triangleAssetNames[assetIndex]+"');"
                    }
                    else if(img === "pentagon.png"){
                        //dealing with pentagons
                        assetIndex = Math.floor(Math.random()*pentagonAssetNames.length);
                        str+= "game.load.image('" + a["l"][0] + "','assets/sprites/newArt/Pentagon/"+pentagonAssetNames[assetIndex]+"');"
                    }
                    else if(img === "star.png"){
                        //dealing with stars
                        assetIndex = Math.floor(Math.random()*starAssetNames.length);
                        str+= "game.load.image('" + a["l"][0] + "','assets/sprites/newArt/Star/"+starAssetNames[assetIndex]+"');"
                    }
                    else if(img === "square.png"){
                        //dealing with squares.
                        assetIndex = Math.floor(Math.random()*squareAssetNames.length);
                        str+= "game.load.image('" + a["l"][0] + "','assets/sprites/newArt/Square/"+squareAssetNames[assetIndex]+"');"
                    }
                    else{
                        str+= "game.load.image('" + a["l"][0] + "','assets/sprites/"+img+"');"
                    }
                }
                else{
                    //we are just using the simple sprites!
                    str+= "game.load.image('" + a["l"][0] + "','assets/sprites/"+img+"');"
                }
                if (addWhitespace){str+="\n";}
            }
        }
        //console.log("returning this image string: " , str);
        return str;
    }

    /* Example: Init new group entity */
    // e1 = game.add.physicsGroup();
    // addedEntities['e1'] = e1;
    // initEntityProperties(e1);
    var translateInitGroup=function(a){
        var str="";
        if (addWhitespace){str+="\n\t";}
        str+= a["l"][0]+"=game.add.physicsGroup();"
        if (addWhitespace){str+="\n\t";}
        str+= "addedEntities['"+a["l"][0]+"']="+a["l"][0]+";";
        if (addWhitespace){str+="\n\t";}
        str+="initEntityProperties("+a["l"][0]+");";
        if (addWhitespace){str+="\n";}
        return str;
    };

    /* Example: Add single entity */
    // addedEntities['e1'].create(x, y,'e1');
    // updateGrid();
    // initEntityProperties(addedEntities['e1']);

    // Example 1:
    // initialize(add(e2,10,location(top,center))).
    // l: ["e2"]
    // relation: "add_to_location"
    // r: ["abstract"]
    // num: "10"
    // row: "top"
    // col: "center"

    // Example 2:
    // initialize (add(e1, 10, e2)).
    // l: ["e1"]
    // relation: "add_to_location"
    // r: ["e2"]
    // num: "10"
    var translateAddSpriteAssertion=function(b,a,nested_entity){
        var str="";
        var entityName = a["l"][0]; // e.g. e1
        var num = a["num"];         // e.g. 10

        nested_entity = (typeof nested_entity !== 'undefined') ?  nested_entity : "*****";


        var x = 0;
        var y = 0;
        // Example 1:
        // initialize(add(e2,10,location(top,center))).
        if (a["r"][0]=="abstract"){
            // Rows: top, middle, bottom
            // Cols: left, center, right
            var row = a["row"];
            var col = a["col"];

            // x and y are based on row and col
            // These values were quickly approximated and are not exact.
            if (row=="top"){
                y = top;
            }
            else if (row=="middle"){
                y = middle;
            }
            else if (row=="bottom"){
                y = bottom;
            }
            else{
                //console.log("Warning: keyword " + row + " is not a known row name.");
            }

            if (col=="left"){
                x = left;
            }
            else if (col=="center"){
                x = center;
            }
            else if (col=="right"){
                x = right;
            }
            else{
                //console.log("Warning: keyword " + col + " is not a known col name.");
            }
            str+="var x="+x+"+ xOffset;";
            str+="var y="+y+"+ yOffset;";
        }
        // Example 1.5:
        // add(e1, 1, cursor)
        else if(a["r"][0] === "cursor"){
            var handler = a["handler"];
            str+="var x = 0;";
            if (addWhitespace){str+="\n\t";}
            str+="var y = 0;";
            if (addWhitespace){str+="\n\t";}
            if(handler.indexOf("PressedHandler") >= 0){
                str+="x = game.input.mousePointer.x;";
                if (addWhitespace){str+="\n\t";}
                str+="y = game.input.mousePointer.y;";
                if (addWhitespace){str+="\n\t";}
            }
        }

        // Example 2:
        // initialize (add(e1, 10, e2)).
        else if (a["r"][0] === "entity"){
            var locationToAddTo = a["entityName"];
            var handler = a["handler"];
            // Find coordinates of entity with name a["r"][0].
            str+="var x = 0;";
            if (addWhitespace){str+="\n\t";}
            str+="var y = 0;";
            if (addWhitespace){str+="\n\t";}
            // TODO: There is probably a better way of finding group item coordinates.
            //str+="addedEntities['"+a["r"][0]+"'].forEach(function(item){x=item.x;y=item.y;}, this);";
            if(handler !== undefined && handler.indexOf("ClickListener") >= 0){
                //we are dealing with a click listener! Add our new guy at the location of the thing that was clicked on!
                if (addWhitespace){str+="\n\t";}
                str+="x=clickedOnObject.x";
                if (addWhitespace){str+="\n\t";}
                str+="y=clickedOnObject.y";
                if (addWhitespace){str+="\n\t";}


            }
            else{
                if (addWhitespace){str+="\n\t";}
                str+="x="+locationToAddTo+".x";
                if (addWhitespace){str+="\n\t";}
                str+="y="+locationToAddTo+".y";
                if (addWhitespace){str+="\n\t";}
            }
        }

        if (num.indexOf("_") >= 0){
            str+="var num_to_add ="+num+"/3;\n";
            //str+="console.log( num_to_add);";

            num = "num_to_add";
        }
        // Create entity at location x,y.
        str+="for (var ii = 0; ii < "+num+"; ii++){";
        if (addWhitespace){str+="\n\t\t";}


        // (make sure that we aren't over populating the screen!)
        if (addWhitespace){str+="\n\t\t";}
        str+= "if(addedEntities['"+entityName+"'].length < " + maxEntityCount + "){"
        if (addWhitespace){str+="\n\t\t\t";}


        if (a["r"][0] === "pool"){

            entity_pool =  a["pool"][0][0]["terms"][0]["predicate"];
            pool = pools[entity_pool];
            if (pool["location_order"] == "random"){
                str+= "pool_counters['" + entity_pool + "'] = Math.floor(Math.random() * (pools['" +
                    entity_pool + "'].length));\n"
            }
            else if  (pool["location_order"] == "ordered"){
                str+="pool_counters['" + entity_pool +
                    "'] = (pool_counters['" + entity_pool +
                    "'] + 1) % pools['" + entity_pool + "'].length;\n";

            }

            if (addWhitespace){str+="\n\t";}
            str+="x= pools['" + entity_pool + "'][pool_counters['" + entity_pool + "']].x+ xOffset;\n";
            if (addWhitespace){str+="\n\t";}
            str+="y= pools['" + entity_pool + "'][pool_counters['" + entity_pool + "']].y+ yOffset;\n";
            if (addWhitespace){str+="\n\t";}

        }

        str+= "initEntity(addedEntities['"+entityName+"'].create(x,y,'"+entityName+"'));"
        if (addWhitespace){str+="\n\t\t\t";}
        str+= "updateGrid();";
        if (addWhitespace){str+="\n\t\t";}
        str += "}";
        if (addWhitespace){str+="\n\t\t";}
        str+="}";

        /*
        //OLD WAY where we updated *every* entity in the group when we created a new one.
        str+= "addedEntities['"+entityName+"'].create(x,y,'"+entityName+"');"
        if (addWhitespace){str+="\n\t\t";}
        str+= "updateGrid();";
        if (addWhitespace){str+="\n\t\t";}
        str+="initEntityProperties(addedEntities['"+entityName+"']);"
        if (addWhitespace){str+="\n\t";}
        str+="}";
        */



        return str;
    }

    // Example: {"l":["e1"],"relation":"triggers","r":["e1ClickListener"]}
    //  >> addedEntities['e1'].forEach(function(item) {
    //  >> item.inputEnabled = true;
    //  >> item.events.onInputDown.add(e1ClickListener, this);
    //  >> }, this);
    var translateListenerAssertion=function(a){
        var str="";
        str += "addedEntities['"+a["l"][0]+"'].forEach(function(item){";
        if (addWhitespace){str+="\n\t\t";}
        str +="item.inputEnabled=true;";
        if (addWhitespace){str+="\n\t\t";}
        str+="item.events.onInputDown.add("+a["r"][0]+",this);";
        if (addWhitespace){str+="\n\t";}
        str+="}, this);"
        if (addWhitespace){str+="\n";}
        return str;
    }

    // Example: controlLogic(draggable(e1)). --> e1 instance_of draggable -->
    // >>e1.inputEnabled = true;
    // >>e1.input.enableDrag(true);
    var translateDraggableAssertion=function(a){
        var str="";
        str += "addedEntities['"+a["l"][0]+"'].forEach(function(item){";
        if (addWhitespace){str+="\n\t\t";}
        str += "item.inputEnabled=true;";
        if (addWhitespace){str+="\n\t\t";}
        str += "item.input.enableDrag(true);";
        if (addWhitespace){str+="\n\t";}
        str+="}, this);"
        if (addWhitespace){str+="\n";}
        return str;
    }

    // We assume the function has a single name.
    var translateFunctionAssertion=function(a){
        var str="";
        str += "function " + a["l"][0] + "("
        count = 0;
        for (var i=0;i<a.params.length;i++){
            str+=a.params[i]
            count+=1;
            if (count<a.params.length){
                str+=","
            }
        }
        str += "){";

        if (a["lines"]!=undefined && a["lines"]!=""){
            for (var j=0;j<a["lines"].length;j++){
                if (addWhitespace){str+="\n\t";}
                str+=a.lines[j];
            }
            if (addWhitespace){str+="\n";}
        }

        str += "};";
        if (addWhitespace){str +="\n\n";}
        return str;
    }

    // tempPoint.x = other.x-entity.x;
    // tempPoint.y = other.y-entity.y;
    // tempPoint.normalize();
    // tempPoint.x *= 10;
    // tempPoint.y *= 10;
    // entity.body.velocity.x *= 0.1;
    // entity.body.velocity.y *= 0.1;
    // entity.movementProfile(entity, tempPoint)
    var translateMove = function(a, move_type,nested_entity){
        str = "";


        nested_entity = (typeof nested_entity !== 'undefined') ?  nested_entity : "*****";

        var entity1 = a["l"][0];

        var nested = (entity1 === nested_entity);
        //console.log("MOVE");
        //console.log(entity1);
        //console.log(nested_entity);
        //console.log(nested);
        if (!nested){
            str+= "addedEntities['"+a["l"][0]+"'].forEach(function(item) {";
            entity1 = "item";
        }

        if (addWhitespace){str+="\n\t\t";}
        // if move_toward(entity, other) or move_away(entity, other)
        if (move_type==="move_towards" || move_type==="move_away"){
            // if a["r"][0]==="cursor", change it to to "game.input.mousePointer"
            var other = a["r"][0];
            var speed;
            if(a["num_r"] === undefined){
                speed = 1; // default
            }
            else{
                speed = a["num_r"][0];
            }
            if (other==="cursor"){
                other="game.input.mousePointer";
            }
            else{
                str+= "addedEntities['"+other+"'].forEach(function(item2) {";
                other="item2";
                if (addWhitespace){str+="\n\t\t";}
            }
            str += "var tempPoint = new Phaser.Point("+other+".x-" + entity1 + ".x,"+other+".y-" + entity1 + ".y);";
            if (addWhitespace){str+="\n\t\t";}
            str+="tempPoint.normalize();"
            if (addWhitespace){str+="\n\t\t";}
            str+="tempPoint.x *= 10;"
            if (addWhitespace){str+="\n\t\t";}
            str+="tempPoint.y *= 10;"
            if (addWhitespace){str+="\n\t\t";}
            str+=move_type+"(" + entity1 + ", tempPoint, "+speed+"+1);";
            if (addWhitespace){str+="\n";}
            if (other=="item2"){
                str+="}, this);"
                if (addWhitespace){str+="\n";}
            }
        }
        // Otherwise, assume move(entity, direction)
        else{
            var amount;
            //See if an amount to move by has been specified and store it in amount. If not, default amount to 1.
            if( a["num_r"] === undefined){
                amount = 1;
            }
            else{
                amount = a["num_r"][0];
            }

            var lowest_speed = 4;
            // str+="moves(";
            if (a["r"][0]==="north"){
                // move(entity, 0, -1);
                //str += "moves(item,0,-1);"
                str += "moves(" + entity1 + ",0,-("+amount+"+" + lowest_speed +"));"
            }
            else if (a["r"][0]==="south"){
                //str += "moves(" + entity1 + ",0,1);"
                str += "moves(" + entity1 + ",0,("+amount+"+" + lowest_speed +"));"
            }
            else if (a["r"][0]==="east"){
                //str += "moves(" + entity1 + ",1,0);"
                str += "moves(" + entity1 + ",("+amount+"+" + lowest_speed +"),0);"
            }
            else if (a["r"][0]==="west"){
                //str += "moves(" + entity1 + ",-1,0);"
                str += "moves(" + entity1 + ",-("+amount+"+" + lowest_speed +"),0);"
            }
            else if (a["r"][0]==="northeast"){
                // move(entity, 0, -1);
                //str += "moves(" + entity1 + ",1,-1);"
                str += "moves(" + entity1 + ",("+amount+"+" + lowest_speed +"),-("+amount+"+" + lowest_speed +"));"
            }
            else if (a["r"][0]==="northwest"){
                //str += "moves(" + entity1 + ",-1,-1);"
                str += "moves(" + entity1 + ",-("+amount+"+" + lowest_speed +"),-("+amount+"+" + lowest_speed +"));"
            }
            else if (a["r"][0]==="southeast"){
                //str += "moves(" + entity1 + ",1,1);"
                str += "moves(" + entity1 + ",("+amount+"+" + lowest_speed +"),("+amount+"+" + lowest_speed +"));"
            }
            else if (a["r"][0]==="southwest"){
                //str += "moves(" + entity1 + ",-1,1);"
                str += "moves(" + entity1 + ",-("+amount+"+" + lowest_speed +"),("+amount+"+" + lowest_speed +"));"
            }
            else if (a["r"][0]==="forward"){
                str += "move_forward(" + entity1 + ",("+amount+"+" + lowest_speed +"));"
            }
            else if (a["r"][0]==="backward"){
                str += "move_backward(" + entity1 + ",("+amount+"+" + lowest_speed +"));"
            }
            else if (a["r"][0]==="left"){
                str += "move_left(" + entity1 + ",("+amount+"+" + lowest_speed +"));"
            }
            else if (a["r"][0]==="right"){
                str += "move_right(" + entity1 + ",("+amount+"+" + lowest_speed +"));"
            }
            if (addWhitespace){str+="\n";}
        }
        if (!nested){
            str+="}, this);"
        }
        if (addWhitespace){str+="\n";}
        return str;
    }

    // TODO: there are no examples beyond setting gravity to -mid at this
    // time, but we should really store gravity value in the Cygnus brain.
    var translateGravity = function(a){
        var str="";
        var entity = a["l"][0];
        str+= entity+".forEach(function(item){item.body.gravity.y = mid;}, this);"
        if (addWhitespace){str+="\n";}
        return str;
    }

    var translateDeleteSpriteAssertion = function(b, a){
        var str ="";
        var entity = a["l"][0];
        // Deletes *all* instances of this entity type.
        //str+="addedEntities['"+entity+"'].forEach(function(item){item.deleted=true;}, this);";

        // str+= entity+".destroy();"

        //We are thinking that, instead of deleting every instance of the sprite,
        //we only want to delete the single instance reference?

        //the assertion (the "a" parameter) knows what needs to be deleted,
        //and that gets stored in "entity"
        //the function itself receives two parameters, e1 and e2.
        //both of these have "key" properties -- the key property will match the string stored in "entity"
        //Let's make an if statement to see if the key matches "entity" for both e1 and e2, and delete the entity if it does!

        //str += "e1.deleted = true";

        if (addWhitespace){str+="\n";}
        str += "\tif (typeof e1 !== \'undefined\' && e1.key === '" + entity + "'){\n\t\te1.deleted = true;\n\t}";
        if (addWhitespace){str+="\n";}
        str += "\tif (typeof e2 !== \'undefined\' && e2.key === '" + entity + "'){\n\t\te2.deleted = true;\n\t}";
        if (addWhitespace){str+="\n";}
        //check if we are in a click handler.
        str += "\tif (typeof clickedOnObject !== \'undefined\'){\n\t\tclickedOnObject.deleted = true;\n\t}";


        if (addWhitespace){str+="\n";}
        return str;
    }

    var translateSetMode = function(b,a){
        var str="";
        var newMode = a["r"][0];
        str+="changeMode('" + newMode +"');"
        if (addWhitespace){str+="\n";}
        return str;
    }

    var updateAspGoals = function(b, a){
        // For each element of left...
        for (var i=0;i<a["l"].length;i++){
            // This is the natural text translation of the ASP goal.
            var realizedGoal = "";
            // This is the string that specifies the ASP goal.
            var left = a["l"][i];
            // Goal types: "achieve", "prevent", "maintain"
            var goalType = left.substring(left.indexOf(".")+1);
            // Goal objects are resources (e.g. "r1") or precondition keywords (e.g. "o1").
            var goalObj = left.substring(0,left.indexOf("."));
            // If it's a precondition keyword, we have to find the preconditions.
            if (goalObj.indexOf("o")===0){
                var goalObjIDsOne = b.getAssertionsWith({"goal_keyword":goalObj});
                var goalObjsOne = [];
                for (var z=0; z<goalObjIDsOne.length;z++){
                    goalObjsOne.push(b.getAssertionByID(goalObjIDsOne[z]))
                }

                /* Now we need to get any preconditions in the program assertion... */
                var goalObjsTwo = [];
                // First, retrieve the program assertion.  There can only be one!
                var pID = b.getAssertionsWith({"relation":"instance_of","r":["program"]})[0];
                var pAssert = b.getAssertionByID(pID);
                // For each assertion in pAssert,
                for (var p in pAssert) {
                    if (pAssert.hasOwnProperty(p) && typeof pAssert[p]!=="function") {
                        if (p!="l" && p!="relation" && p!="r"){
                            for (var c in pAssert[p]) {
                                if (pAssert[p].hasOwnProperty(c)) {

                                    for (var e=0;e<pAssert[p][c].length;e++){
                                        if (pAssert[p][c][e].hasOwnProperty("goal_keyword")){
                                            if (pAssert[p][c][e]["goal_keyword"]===goalObj){
                                                goalObjsTwo.push(pAssert[p][c][e]);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // var goalObjIDsTwo = b.getAssertionsWith({"goal_keyword":goalObj});
                // merge one and two
                var goalObjs = goalObjsOne.concat(goalObjsTwo);

                for (var j=0;j<goalObjs.length;j++){
                    var assert = goalObjs[j];

                    preconds = assert["l"];
                    realizedGoal = goalType.charAt(0).toUpperCase() + goalType.substr(1).toLowerCase() + ":"
                    for (var k=0; k<preconds.length; k++){
                        var pre = rensa.prettyprint(preconds[k],false);
                        pre = pre.replace(/['"]+/g, '');
                        realizedGoal += pre;
                        if (k<preconds.length-1){
                            realizedGoal+=",";
                        }
                    }
                }
            }
            // Otherwise, if it's a resource, simply state the resource.
            else if (goalObj.indexOf("r")===0){
                realizedGoal = goalType.charAt(0).toUpperCase() + goalType.substr(1).toLowerCase() + " " + goalObj;
            }
            else {
                console.error("ERROR: Unrecognized goal object.")
            }
            // Add the realized goal to the "goals" array.
            if (realizedGoal !== ""){
                goals.push(realizedGoal);
            }
        }
    }

    /*
      Each of the following are explicitly translating specific types of assertions into JS code, and returning that code as a string.
    */

    // e.g. {"l":["e1"],"relation":"overlaps","r":["e2"],"goal_keyword":"o3"}
    var translateOverlapAssertion = function(a){
        var str="";
        var e1 = a['l'][0];
        var e2 = a['r'][0];
        var callback = a['goal_keyword'] + "OverlapHandler";

        str+="game.physics.arcade.overlap(addedEntities['"+e1+"'],addedEntities['"+e2+"'],"+callback+",null, this);"
        return str;
    }

    var translateNotOverlapAssertion = function(a){
        var str="";
        var e1 = a['l'][0];
        var e2 = a['r'][0];
        var callback = a['goal_keyword'] + "NotOverlapHandler";

        str+="if (!game.physics.arcade.overlap(addedEntities['"+e1+"'],addedEntities['"+e2+"'],null,null, this)){"+callback+"();}"
        return str;
    }

    var translatePressedAssertion = function(a){
        var str = "";
        var callback = a['goal_keyword'] + "PressedHandler";
        str += "game.input.onDown.add("+callback+", this);"
        return str;
    }

    var translateTimer_elapsedAssertion = function(b,a){
        var str = "";
        // Get timer id.
        var timerID = a["l"][0];
        // Find timer logic assertion ID.
        var timerLogicID = b.getAssertionsWith({"l":[timerID],"relation":"has_timer_logic"})
        //console.log(b);
        //console.log(a);
        //console.log(timerID);
        if (timerLogicID !== undefined && timerLogicID !== []){
            // Get the timer logic assertion.
            var timerLogicAssert = b.getAssertionByID(timerLogicID);

            //console.log(timerLogicID)
            if (timerLogicAssert.hasOwnProperty("duration")){
                var goal_keyword = a["goal_keyword"];
                var callback = goal_keyword + "_" + timerID + "Listener";
                var duration = timerLogicAssert["duration"];
                var logicType = timerLogicAssert["r"][0];

                // Add code based on timer logic assertion data.
                if (logicType=="single"){
                    str+="game.time.events.add(Phaser.Timer.SECOND*"+duration+", "+callback+", this);";
                }
                else if (logicType=="loop"){
                    str+="game.time.events.loop(Phaser.Timer.SECOND*"+duration+", "+callback+", this);";
                }
            }
        }
        else{
            throw "Couldn't find timerLogidID...it's " + timerLogicID;
        }
        if(addWhitespace){str+="\n"};
        return str;
    }

    var translateStaticAssertion = function(a){
        return "addedEntities['"+a["l"][0]+"'].forEach(function(item){item.body.immovable=true;}, this);";
    }

    var translateSetColorAssertion = function(b,a,nesting_entity){
        str = "";
        var entityName = a["l"][0];
        var colorName = a["r"][0];

        var nesting = entityName === nesting_entity;
        if (!nesting){
            str+= "addedEntities['"+entityName+"'].forEach(function(item){";
            entityName = "item";
        }
        // Find the hex code for the color.
        var colorID = b.getAssertionsWith({"l":[colorName],"relation":"instance_of","r":["color"]})[0];
        if (colorID!=undefined){
            var hexcode = b.getAssertionByID(colorID)["value"];
            str += entityName + ".tint="+hexcode+";"
        }

        if (!nesting){

            str += "}, this);";
        }
        return str;
    }

    var translateRotatesAssertion = function(a,nesting_entity){
        str = "";
        var entityName = a["l"][0];
        var amount = a["r"][0];
        if(a.handler !== undefined && a.handler.indexOf("ClickListener") >= 0){
            str+= "clickedOnObject.desired_angle += "+amount+";";
        }
        else{

            var nesting = entityName === nesting_entity;

            if (!nesting){
                str+= "addedEntities['"+entityName+"'].forEach(function(item){";
                entityName = "item";
            }

            str+=entityName + ".desired_angle += "+amount+";";
            if (!nesting){
                str += "}, this);";
            }
        }
        return str;
    }

    var translateRotateToAssertion = function(a, nesting_entity){
        str = "";
        var entityName = a["l"][0];
        var range = a["r"];
        var nesting = entityName === nesting_entity;

        if (!nesting) {
            str+="addedEntities['"+entityName+"'].forEach(function(item){";
            entityName = "item";
        }

        str += entityName + ".desired_angle = Math.random() * ("+range[1]+"-" + range[0] +") + "+range[0]+";";
        if (!nesting) {
            str += "}, this)";
        }
        return str;
    }

    var translateRestitutionAssertion = function(a){
        str = "";
        var e1 = a["l"][0];
        var e2 = a["r"][0];
        str+="game.physics.arcade.collide("+e1+","+e2+",null,null,this);"
        return str;
    }

    var translateDenotesAssertion = function(a){
        str = "";
        var e1 = a["l"][0];
        var e2 = a["r"][0];
        str+="setVariable('"+e2+"', "+e1+");";
        return str;
    }

    var translateLabelAssertion = function(a){
        //console.log("I'm translating this label assertion: " , JSON.stringify(a, null, 4));
        str = ""
        var e1 = a["l"][0];
        var e2 = a["r"][0];
        var readWrite = a["readWrite"];
        str += "labels['" + e1 + "'] = {};";
        str += "labels['" + e1 + "'].name = '" + e2 + "';";
        str += "labels['" + e1 + "'].variable = '" + e1 + "';";
        str += "labels['" + e1 + "'].readWrite = '" + readWrite + "';";
        str += "labels['" + e1 + "'].value = " + e1 + ";";
        return str;
    }
    var translateAddSound = function(a){
        str = "";
        str += "game.load.audio('" + a["l"][0] + "', '" + a["r"][0] + "');";
        return str;
    }
    var translateLookAtAssertion = function(a, nesting_entity){
        str = "";
        var e1 = a["l"][0];
        var e2 = a["r"][0];
        var nesting = e1 === nesting_entity;
        var choice = a["choice"]; // can be "furthest", "closest", or "random"
        //str += "//Let's do it again in the function: " , JSON.stringify(a, null, 4);
        //str += "//AM I EVEN BEING ADDED TO WHERE I HOPE I AM MAYBE? I want " + e1 + " to look at " + e2;
        //str += "//don't forget this equation: O.desired_angle = Math.atan2(Other.y- E.y, Other.x - E.x);"
        str += "\t//Make all instances of "+e1+"look at an instance of " + e2 + " using choice parameter: " + choice;
        //str += "//\n\tvar newAngle = Math.atan2(addedEntities['e_1_XX_'].y - addedEntities['e_2_XX_'], addedEntities['e_1_XX_'].x - addedEntities['e_2_XX_'].x);"
        if(e2 === "cursor"){
            //str += "\n\t\tSPECIAL CODE TO GET CURSOR COORDINATES.";
            str += "\n\t\tvar targetItem = {};";
            str += "\n\t\ttargetItem.x = game.input.mousePointer.x;";
            str += "\n\t\ttargetItem.y = game.input.mousePointer.y;";
        }

        if (!nesting) {
            str += "\n\t\taddedEntities['"+e1+"'].forEach(function(lookerItem) {";
            e1 = "lookerItem";
        }


        if(e2 === "cursor"){
            //str += "\n\t\t\tSET TARGET TO CURSOR COORDINATES";
        }
        else{
            str += "\n\t\t\tvar curBestDistance = undefined;";
            str += "\n\t\t\tvar curBestIndex = -1;";
            str += "\n\t\t\tvar curIndex = 0;";
            if(choice === "furthest" || choice === "closest" || choice === "nearest"){
                str += "\n\t\t\taddedEntities['"+e2+"'].forEach(function(lookedAtItem){";
                str += "\n\t\t\t\tvar distance = Phaser.Math.distance(" + e1 + ".x, " + e1 + ".y, lookedAtItem.x, lookedAtItem.y);";
                str += "\n\t\t\t\tvar index;";
                if(choice === "furthest"){
                    str += "\n\t\t\t\tif(curBestDistance === undefined || curBestDistance < distance){"
                }
                else if(choice === "closest" || choice === "nearest"){
                    str += "\n\t\t\t\tif(curBestDistance === undefined || curBestDistance > distance){"
                }
                str += "\n\t\t\t\t\tcurBestIndex = curIndex;";
                str += "\n\t\t\t\t\tcurBestDistance = distance;";
                str += "\n\t\t\t\t}"
                str += "\n\t\t\t\tcurIndex += 1;";
                str += "\n\t\t\t},this);"
            }
            else if(choice ==="random"){
                str += "\n\t\t\tcurBestIndex = Math.floor(Math.random() * (addedEntities['"+e2+"'].length));";
            }
            else{
                console.error("ERROR: UNRECOGNIZED VALUE FOR CHOICE IN look_at COMMAND");
            }

            //we care about
            //str += "\n\tconsole.log('BEST INDEX IS:',curBestIndex,'with a distance of: ', curBestDistance);";
            str += "\n\t\t\tvar targetItem = addedEntities['"+e2+"'].children[curBestIndex];";
        }
        //str += "\n\tvar newAngle = Math.atan2(game.input.mousePointer.y - item.y, game.input.mousePointer.x - item.x);"
        str += "\n\t\t\tif(targetItem !== undefined){";
        str += "\n\t\t\t\tvar newAngle = Math.atan2(targetItem.y - " + e1 + ".y, targetItem.x - " + e1 + ".x);"
        str += "\n\t\t\t\tnewAngle = newAngle * (180/Math.PI); //convert from radians to degrees.";
        str += "\n\t\t\t\t" + e1 + ".desired_angle = newAngle;";
        str += "\n\t\t\t}";
        if (!nesting){
            str += "\n\t\t},this);";
        }


        return str;
    }

    var establishRoundedPlayArea = function(){
        str = ""

        str += "\n\tbackground_graphics = game.add.graphics( 0,0);\n";
        str += "\tbackground_graphics.beginFill(0x000000);\n";
        str += "\tbackground_graphics.drawRoundedRect(xOffset,yOffset, 400, 300, 10);\n";
        str += "\tbackground_graphics.endFill();\n";
        str += "\tbackground_graphics.alpha = 0.2;\n";

        return str;
    }

    return {
        writePhaserProgram : writePhaserProgram
    }

});
