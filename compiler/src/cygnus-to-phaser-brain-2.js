/*
  This file translates Cygnus abstract syntax into Phaser abstract syntax.
*/
//define(["rensa"], function(rensa) {
define(["./brain"], function(rensa) {
    //var rensa = require('./brain');

    /*
      Input:  initial Phaser abstract syntax content (brain),
      Cygnus abstract syntax (brain).

      Output: Cygnus input translated into Phaser abstract syntax,
      merged with initial Phaser content (brain).
    */
    var cygnusToPhaser = function(initialBrain,cygnusBrain){
        // Make a clone of the initial brain.
        var finalBrain = initialBrain.clone();

        // Find the ID of the assertion containing the initial program data.
        // We assume only one program assertion exists, and that this ID is 0.
        // The contents of this assertion are mostly empty (because it's from the initial brain).
        var pID = finalBrain.getAssertionsWith({"relation":"instance_of","r":["program"]})[0];

        // Use the information from the cygnusBrain to edit the final brain.
        finalBrain = mergeInitialWithCygnus(pID, finalBrain, cygnusBrain);

        /* Add sprites in the create method.  (Note: this assumes that sprites will be
           specified for all entities and resources that require one.  The original
           repository did not make this assumption, but the new game generator should
           fulfill this requirement.) */
        finalBrain = addSprites(pID, finalBrain);

        // Add preload information
        finalBrain =  updatePreload(pID, finalBrain)
        return finalBrain;
    };

    /*
      Input: ID of the assertion containing the JS program organization data,
      the (eventual) Phaser brain.

      Output: the (eventual) Phaser brain with sprite information added.
    */
    var addSprites=function(pID, brain){
        // Make a clone of the brain.
        var newBrain = brain.clone();

        // newProgram will contain any existing assertions, plus any we modify.
        var newProgram = JSON.parse(JSON.stringify(brain.assertions[pID]));

        // For each assertion in the brain,
        for (var i in brain.assertions){
            // If there is an "add_to_location" assertion,
            if (isRelationType(brain.assertions[i],"add_to_location")){
                // Add the brain's assertion to the newProgram.
                newProgram["create"]["sprites"].push(brain.assertions[i]);
            }
        }
        // Update the brain's program assertion.
        newBrain.assertions[pID] = newProgram;

        // Return the reorganized brain.
        return newBrain;
    };

    // Add preload information based on any "has_sprite" assertions.
    // e.g. player has_sprite sprite should be an assertion in preload.
    var updatePreload=function(pID, brain){
        var newBrain = brain.clone();

        // newProgram will contain any existing assertions, plus any we modify.
        var newProgram = JSON.parse(JSON.stringify(brain.assertions[pID]));

        for (var i in brain.assertions){

            // If it's a has_sprite assertion,
            if (isRelationType(brain.assertions[i],"has_sprite")){
                var inPreload = false;
                // Check if is this sprite is already in ["preload"]["images"].
                for (var e=0; e<newProgram["preload"]["images"].length;e++){
                    if (rensa.arraysEqual(newProgram["preload"]["images"][e]["r"],brain.assertions[i]["r"])&& rensa.arraysEqual(newProgram["preload"]["images"][e]["l"],brain.assertions[i]["l"])){
                        inPreload=true;
                    }
                }
                // Add assertion to ["preload"]["images"] if it's not already in there.
                if (!inPreload){
                    newProgram["preload"]["images"].push(brain.assertions[i]);
                }
                // Remove this assertion from the brain.
                delete newBrain.assertions[i];
            }
        }
        newProgram["preload"]
        // Update the program assertion.
        newBrain.assertions[pID] = newProgram;

        return newBrain;
    };

    /*
      This function modifies the contents of the create function inside the program data assertion.
      For now, we assume all variable setting happens in create.
      We're also assuming that any old assertions won't be repeated.

      Input: ID of the program assertion, initial Phaser brain, cygnus brain.
      Output: the updated brain.
    */
    var mergeInitialWithCygnus = function(pID, initialBrain, cygnusBrain) {

        // Make a clone of the initial brain.
        var newBrain = initialBrain.clone();

        // newProgram will contain any existing assertions, plus any we gain from cygnusBrain.
        var newProgram = initialBrain.assertions[pID].clone();

        // These objects temporarily store known variables from cygnusBrain.
        // {varName1:type1, varName2:type2...}
        var tempVarTypes = {};
        // {varName1:value1, varName2:value2...}
        var tempVarValues = {};

        // For each assertion in the cygnus brain,
        for (var i in cygnusBrain.assertions){

            // Variable declaration assertion (like "e1 instance_of entity"), store it in our temp var types array to deal with later.
            if (isVariableTypeAssertion(cygnusBrain.assertions[i])){
                tempVarTypes[cygnusBrain.assertions[i]["l"]] = cygnusBrain.assertions[i]["r"];
            }

            // If we are setting the value of a variable...
            else if (isSetValueAssertion(cygnusBrain.assertions[i])){

                // Deal with any properties (e.g. e1.angle set_value e2.angle)
                if (cygnusBrain.assertions[i].tags == undefined){
                    if (cygnusBrain.assertions[i]["l"][0].indexOf(".")>0 || (cygnusBrain.assertions[i]["r"][0].indexOf(".")>0)){
                        newProgram["create"]["vars"].push(cygnusBrain.assertions[i]);
                    }
                    else { // ...add to our temp var values array to deal with later.
                        tempVarValues[cygnusBrain.assertions[i]["l"]] = cygnusBrain.assertions[i]["r"];
                    }
                }
                else {
                    if (cygnusBrain.assertions[i].hasOwnProperty("tags")){
                        newProgram["update"]["misc"].push(cygnusBrain.assertions[i]);
                    }
                }
            }

            // Label assertion
            else if (isLabelAssertion(cygnusBrain.assertions[i])){
                newProgram["create"]["vars"].push(cygnusBrain.assertions[i]);
                //console.log("label assertion:");
                //console.log(cygnusBrain.assertions[i]);
                //console.log(newProgram);
            }

            else if (cygnusBrain.assertions[i].tags != undefined && cygnusBrain.assertions[i]["tags"].indexOf("initialize") > -1){
                newProgram["create"]["misc"].push(cygnusBrain.assertions[i]);

            }

            else if ( isStaticAssertion(cygnusBrain.assertions[i]) || 
                      isRotatesAssertion(cygnusBrain.assertions[i]) ||
                      isRotateToAssertion(cygnusBrain.assertions[i]) ){
                // Move to create.
                newProgram["create"]["misc"].push(cygnusBrain.assertions[i]);
            }

            else if ( isSetColorAssertion(cygnusBrain.assertions[i]) ||
                      isRestitutionAssertion(cygnusBrain.assertions[i]) ||
                      isDenotesAssertion(cygnusBrain.assertions[i]) ){
                // Move to update.
                newProgram["update"]["misc"].push(cygnusBrain.assertions[i]);
            }

            // If it's a conditional assertion, different things might happen based on
            // whether it is a click, overlap, mouse pressed, or timer logic conditional.
            // All of this is handled in the updateProgramConditional() function.
            else if (isConditionalAssertion(cygnusBrain.assertions[i])) {
                var updatedProgram = updateProgramConditional(newBrain,cygnusBrain,newProgram,i);
                newBrain = updatedProgram[0];
                newProgram = updatedProgram[1]
            }

            // If something is moving, we need to tell both the update and create functions in Phaser.
            else if (isMotionAssertion(cygnusBrain.assertions[i])) {
                if (cygnusBrain.assertions[i].hasOwnProperty("tags")) {
                    if (cygnusBrain.assertions[i]["tags"].indexOf("update")>=0) {
                        newProgram["update"]["motion"].push(cygnusBrain.assertions[i]);
                    }
                    else {
                        newProgram["create"]["motion"].push(cygnusBrain.assertions[i]);
                    }
                }
                else {
                    newProgram["create"]["motion"].push(cygnusBrain.assertions[i]);
                }
            }

            // If something is draggable, we need to tell Phaser's update function.
            else if (isDraggableAssertion(cygnusBrain.assertions[i])){
                newProgram["update"]["vars"].push(cygnusBrain.assertions[i]);
            }

            // If the assertion has been tagged with "update",
            else if (cygnusBrain.assertions[i].hasOwnProperty("tags")){
                //console.log("********************************************* PHASER BRAIN STUFF");
                //console.log(cygnusBrain.assertions[i])
                if (cygnusBrain.assertions[i]["tags"].indexOf("update")>=0){
                    //console.log("********************************************* UPDATE");
                    // If the value of a variable is changing (increase/decrease/over_time), we need to tell Phaser's update function (specifically the "vars" slot).
                    if (isUpdateValueAssertion(cygnusBrain.assertions[i])){
                        //console.log("********************************************* VARS");
                        newProgram["update"]["vars"].push(changeToSetValue(cygnusBrain.assertions[i]));
                    }
                    // Otherwise, we should still add to the update function (but in the "misc" category).
                    else {
                        newProgram["update"]["misc"].push(cygnusBrain.assertions[i]);
                    }
                }
                else{ // if the assertion is tagged with anything else, make sure it is added to the newBrain.
                    newBrain.addAssertion(cygnusBrain.assertions[i]);
                }
            }
            else{ // if the assertion doesn't have tags, make sure it is added to the newBrain.
                newBrain.addAssertion(cygnusBrain.assertions[i]);
            }
        }

        // Push all known variables (with/without values) into into newBrain's assertions.
        for (var k in tempVarTypes) {
            if (tempVarTypes.hasOwnProperty(k)) {
                // If we know what the value of the variable is,
                if (tempVarValues.hasOwnProperty(k)){
                    newBrain.addAssertion({"l":[k], "relation":"instance_of", "r":["variable"],"variableType":tempVarTypes[k],"value":tempVarValues[k]});
                }
                else{
                    newBrain.addAssertion({"l":[k], "relation":"instance_of", "r":["variable"],"variableType":tempVarTypes[k]});
                }
            }
        }

        // Update the program assertion in newBrain.
        newBrain.assertions[pID] = newProgram;

        // Return our modified newBrain.
        return newBrain;
    };


    /*
      Helper function for mergeInitialWithCygnus.

      Inputs: newBrain (the brain being modified to be the final Phaser one),
      cygnusBrain (the brain containing assertions translated directly from ASP,
      newProgram (the program assertion)
      i (the current assertion we're on)

      Output: [newBrain (updated Phaser brain),
      newProgram (updated program assertion)]
    */
    var updateProgramConditional = function(newBrain, cygnusBrain, newProgram,i){

        // We are going to add a new assertion based on the current "old" assertion in the cygnus brain (cygnusBrain.assertions[i]).
        var newAssertion = cygnusBrain.assertions[i].clone();
        var newLeft = [];
        var newRight = [];
        var goal_keyword = newAssertion["goal_keyword"];

        // Check if one of the preconditions (elements in the left array) is a click listener.
        var isClickConditional=false;
        var clickAssertion = null;

        // Check if one of the preconditions (elements in the left array) calls for an overlaps listener.
        var isOverlapConditional=false;
        var overlapAssertion = null;
        var isNotOverlapConditional=false;
        var notOverlapAssertion = null;

        // Check if one of the preconditions (elements in the left array) calls for a mouse_button pressed listener.
        var isPressedConditional=false;
        var pressedAssertion = null;

        // Check if one of the preconditions (elements in the left array) calls for a timer elapsed listener.
        var isTimerLogicConditional = false;
        var timerLogicAssertion = null;

        for (var q in cygnusBrain.assertions[i]["l"]){
            var oldHypRight = cygnusBrain.assertions[i]["l"][q]["r"];

            var oldHypRelation = cygnusBrain.assertions[i]["l"][q]["relation"];

            if (oldHypRight != undefined && oldHypRelation !=undefined){
                // Get the click listener assertion, if any.
                if (rensa.arraysEqual(oldHypRight,["click_listener"])){
                    isClickConditional=true;
                    clickAssertion = cygnusBrain.assertions[i]["l"][q];
                }

                // Get the overlaps assertion, if any.
                if (oldHypRelation=="overlaps"){
                    isOverlapConditional=true;
                    overlapAssertion = cygnusBrain.assertions[i]["l"][q];
                }
                if (oldHypRelation=="not_overlaps"){
                    isNotOverlapConditional=true;
                    notOverlapAssertion = cygnusBrain.assertions[i]["l"][q];
                }

                // Get the pressed assertion, if any.
                if (rensa.arraysEqual(oldHypRight,["pressed"])){
                    isPressedConditional=true;
                    pressedAssertion = cygnusBrain.assertions[i]["l"][q];
                }

                // Get the timerElapsed assertion, if any.
                if (rensa.arraysEqual(oldHypRight,["timer_elapsed"])){
                    isTimerLogicConditional=true;
                    timerLogicAssertion = cygnusBrain.assertions[i]["l"][q];
                }
            }
        }

        // If click and overlaps...
        if (isClickConditional && clickAssertion!=null && isOverlapConditional && overlapAssertion!=null)
        {
            /* Add isCallbackAssertion to create. */
            // Get the name of the click listener function.
            var clickListenFn = clickAssertion["l"][0];
            // Get the entity/resource/etc. that is to be clicked.
            var clicked = clickAssertion["for"][0];
            // Add listener to create method.
            // i.e., in create: e1.events.onInputDown.add(e1ClickListener, this);
            var newAssert = {
                "l": [clicked],
                "relation":"triggers",
                "r": [clickListenFn]
            };
            if (goal_keyword != undefined){
                newAssert["goal_keyword"]=goal_keyword;
            }
            newProgram["update"]["listeners"].push(newAssert);

            /* Add click handler function with "params" of entity and "lines": call to overlap handler.
               Example:
               function o1ClickHandler(entity) {
               game.physics.arcade.overlap(entity, e2, o1OverlapHandler, null, this))
               }*/

            // Overlaps assertion is e.g. e1 overlaps e2
            // We need to get e2
            var rightSide = overlapAssertion["r"][0];

            // We also need the name of the overlap handler.
            var functionName = goal_keyword + "OverlapHandler";

            var clickHandlerAssert = {
                "l": [clickListenFn],
                "relation": "instance_of",
                "r": ["function"],
                "params": ["entity"],
                "lines": ["game.physics.arcade.overlap(entity, addedEntities['" + rightSide+"'], "+ functionName + ", null, this);"]
            };
            newBrain.addAssertion(clickHandlerAssert);

            /* Add overlap handler with remaining results.
               Example: function o1OverlapHandler(E1,E2){r1 += low;}
            */
            // Add a new function to the brain called [goalKeyword]OverlapHandler, with e1 and e2 as params.  Inside that function go all of the remaining preconditions and conclusions.
            var assertList = cygnusBrain.assertions[i]["l"];
            // Remove overlapAssertion from assertList.
            var overlapIdx = assertList.indexOf(overlapAssertion);
            assertList.splice(overlapIdx,1);
            // Remove clickAssertion from assertList.
            var clickIdx = assertList.indexOf(clickAssertion);
            assertList.splice(clickIdx,1);

            newLeft = getNewHypotheses(newLeft, assertList);
            newRight = getNewConclusions(newRight,cygnusBrain.assertions[i]["r"]);

            var functionName = goal_keyword + "OverlapHandler"
            newProgram[functionName] = {};
            newProgram[functionName]["params"] = ["e1","e2"];
            newProgram[functionName]["outcomes"] = [];

            var newAssert2 = {
                "l": newLeft,
                "relation":"causes",
                "r": newRight
            };
            if (goal_keyword != undefined){
                newAssert2["goal_keyword"]=goal_keyword;
            }
            newProgram[functionName]["outcomes"].push(newAssert2);
        }
        // If click and not overlaps...
        else if (isClickConditional && clickAssertion!=null && isNotOverlapConditional && notOverlapAssertion!=null)
        {
            /* Add isCallbackAssertion to create. */
            // Get the name of the click listener function.
            var clickListenFn = clickAssertion["l"][0];
            // Get the entity/resource/etc. that is to be clicked.
            var clicked = clickAssertion["for"][0];
            // Add listener to create method.
            // i.e., in create: e1.events.onInputDown.add(e1ClickListener, this);
            var newAssert = {
                "l": [clicked],
                "relation":"triggers",
                "r": [clickListenFn]
            };
            if (goal_keyword != undefined){
                newAssert["goal_keyword"]=goal_keyword;
            }
            newProgram["update"]["listeners"].push(newAssert);

            // We need a name for the overlapHandler.
            var overlapFunc = goal_keyword + "NotOverlapHandler";
            var leftSide = notOverlapAssertion["l"][0];
            var rightSide = notOverlapAssertion["r"][0];

            /* Add click listener function. */
            var clickHandlerAssert = {
                "l": [clickListenFn],
                "relation": "instance_of",
                "r": ["function"],
                "params": ["entity"],
                "lines": ["if(!game.physics.arcade.overlap(addedEntities['" + leftSide+"'], addedEntities['" + rightSide+"'], null, null, this)){",overlapFunc + "();","}"]
            };
            newBrain.addAssertion(clickHandlerAssert);

            // Remove click and overlap assertions before using preconditions to find hypotheses.
            var assertList = cygnusBrain.assertions[i]["l"];
            // Remove overlapAssertion from assertList.
            var overlapIdx = assertList.indexOf(notOverlapAssertion);
            assertList.splice(overlapIdx,1);
            // Remove clickAssertion from assertList.
            var clickIdx = assertList.indexOf(clickAssertion);
            assertList.splice(clickIdx,1);

            // Add remaining hypotheses and conclusions to lines parameter.
            newLeft = getNewHypotheses(newLeft, assertList);
            newRight = getNewConclusions(newRight,cygnusBrain.assertions[i]["r"]);

            var newAssert2 = {
                "l": newLeft,
                "relation":"causes",
                "r": newRight
            };
            if (goal_keyword != undefined){
                newAssert2["goal_keyword"]=goal_keyword;
            }

            /* Add not_overlap handler function. */
            newProgram[overlapFunc] = {};
            newProgram[overlapFunc]["params"] = [];
            newProgram[overlapFunc]["outcomes"] = [];
            newProgram[overlapFunc]["outcomes"].push(newAssert2);
        }

        // If pressed and overlaps...
        else if (isPressedConditional && pressedAssertion!=null && isOverlapConditional && overlapAssertion!=null)
        {
            // Move the pressed assertion to create.
            if (goal_keyword != undefined){
                pressedAssertion["goal_keyword"]=goal_keyword;
            }
            newProgram["create"]["listeners"].push(pressedAssertion);

            // We need a name for the pressedHandler.
            var pressfunc = goal_keyword + "PressedHandler";

            // Overlaps assertion is e.g. e1 overlaps e2
            // We need to get e1 and e2
            var leftSide = overlapAssertion["l"][0];
            var rightSide = overlapAssertion["r"][0];
            // We also need the name of the overlap handler.
            var overlapfunc = goal_keyword + "OverlapHandler";

            // Add pressedhandler function directly.
            var pressHandlerAssert = {
                "l": [pressfunc],
                "relation": "instance_of",
                "r": ["function"],
                "params": [],
                "lines": ["game.physics.arcade.overlap(addedEntities['" + leftSide+"'], addedEntities['" + rightSide+"'], "+ overlapfunc + ", null, this);"]
            };
            newBrain.addAssertion(pressHandlerAssert);

            /* Add overlap handler with remaining results.
               Example: function o1OverlapHandler(E1,E2){r1 += low;}
            */
            // Add a new function to the brain called [goalKeyword]OverlapHandler, with e1 and e2 as params.  Inside that function go all of the remaining preconditions and conclusions.
            var assertList = cygnusBrain.assertions[i]["l"];
            // Remove overlapAssertion from assertList.
            var overlapIdx = assertList.indexOf(overlapAssertion);
            assertList.splice(overlapIdx,1);
            // Remove pressedAssertion from assertList.
            var pressIdx = assertList.indexOf(pressedAssertion);
            assertList.splice(pressIdx,1);

            newLeft = getNewHypotheses(newLeft, assertList);
            newRight = getNewConclusions(newRight,cygnusBrain.assertions[i]["r"]);

            var functionName = goal_keyword + "OverlapHandler"
            newProgram[functionName] = {};
            newProgram[functionName]["params"] = ["e1","e2"];
            newProgram[functionName]["outcomes"] = [];

            var newAssert2 = {
                "l": newLeft,
                "relation":"causes",
                "r": newRight
            };
            if (goal_keyword != undefined){
                newAssert2["goal_keyword"]=goal_keyword;
            }
            newProgram[functionName]["outcomes"].push(newAssert2);
        }

        // If pressed and not overlaps...
        else if (isPressedConditional && pressedAssertion!=null && isNotOverlapConditional && notOverlapAssertion!=null)
        {
            // Move the pressed assertion to create.
            if (goal_keyword != undefined){
                pressedAssertion["goal_keyword"]=goal_keyword;
            }
            newProgram["create"]["listeners"].push(pressedAssertion);

            // We need a name for the pressedHandler.
            var pressFunc = goal_keyword + "PressedHandler";

            // We need a name for the overlapHandler.
            var overlapFunc = goal_keyword + "NotOverlapHandler";
            var leftSide = notOverlapAssertion["l"][0];
            var rightSide = notOverlapAssertion["r"][0];

            /* Add click listener function. */
            var pressHandlerAssert = {
                "l": [pressFunc],
                "relation": "instance_of",
                "r": ["function"],
                "params": [],
                "lines": ["if(!game.physics.arcade.overlap(addedEntities['" + leftSide+"'], addedEntities['" + rightSide+"'], null, null, this)){",overlapFunc + "();","}"]
            };
            newBrain.addAssertion(pressHandlerAssert);

            /* Add not_overlap handler function. */
            newProgram[overlapFunc] = {};
            newProgram[overlapFunc]["params"] = [];
            newProgram[overlapFunc]["outcomes"] = [];

            // Remove click and overlap assertions before using preconditions to find hypotheses.
            var assertList = cygnusBrain.assertions[i]["l"];
            // Remove notOverlapAssertion from assertList.
            var overlapIdx = assertList.indexOf(notOverlapAssertion);
            assertList.splice(overlapIdx,1);
            // Remove pressedAssertion from assertList.
            var pressIdx = assertList.indexOf(pressedAssertion);
            assertList.splice(pressIdx,1);

            // Add remaining hypotheses and conclusions to lines parameter.
            newLeft = getNewHypotheses(newLeft, assertList);
            newRight = getNewConclusions(newRight,cygnusBrain.assertions[i]["r"]);

            var newAssert2 = {
                "l": newLeft,
                "relation":"causes",
                "r": newRight,
                "handler" : pressedAssertion
            };
            if (goal_keyword != undefined){
                newAssert2["goal_keyword"]=goal_keyword;
            }
            newProgram[overlapFunc]["outcomes"].push(newAssert2);
        }

        // e.g. e1ClickListener instance_of click_listener
        else if (isClickConditional && clickAssertion!=null){
            // Get the name of the click listener function.
            var clickListenFn = clickAssertion["l"][0];
            // Get the entity/resource/etc. that is to be clicked.
            var clicked = clickAssertion["for"][0];
            // Add listener to create method.
            // i.e., in create: e1.events.onInputDown.add(e1ClickListener, this);
            var newAssert = {
                "l": [clicked],
                "relation":"triggers",
                "r": [clickListenFn]
            };
            if (goal_keyword != undefined){
                newAssert["goal_keyword"]=goal_keyword;
            }
            newProgram["update"]["listeners"].push(newAssert);
            /*
              Add new function to the brain that contains all other preconditions (besides the click listener) and the results.
              i.e.,
              function e1ClickListener() {
              if (precond_1 && precond_2 &&...precond_n){
              result_1;...result_n;
              }
              }
            */
            newLeft = getNewHypotheses(newLeft, cygnusBrain.assertions[i]["l"]);
            newRight = getNewConclusions(newRight,cygnusBrain.assertions[i]["r"]);

            for(var k = 0; k < newRight.length; k++){
                newRight[k].handler = clickListenFn; // we're gonna store this in 'right' even though it feels wrong.
            }

            newProgram[clickListenFn] = {};
            newProgram[clickListenFn]["params"] = [];
            newProgram[clickListenFn]["outcomes"] = [];

            var newAssert2 = {
                "l": newLeft,
                "relation":"causes",
                "r": newRight
            };
            if (goal_keyword != undefined){
                newAssert2["goal_keyword"]=goal_keyword;
            }

            newProgram[clickListenFn]["outcomes"].push(newAssert2);
            newProgram[clickListenFn]["params"].push(["clickedOnObject"]); //the object that was clicked on.
            newProgram[clickListenFn]["params"].push(["pointer"]); //the pointer that clicked the object
            // Push the old assertion into the brain anyway.  This lets us update coordinates.
            newBrain.addAssertion(cygnusBrain.assertions[i]);

        }
        // e.g. e1 overlaps e2 or e1 not_overlaps e2
        else if ((isOverlapConditional && overlapAssertion!=null) || (isNotOverlapConditional && notOverlapAssertion!=null)){
            var fName = "OverlapHandler";
            // Use overlapAssertion to refer to the assertion at hand.
            if (notOverlapAssertion!=null){
                overlapAssertion = notOverlapAssertion;
                fName = "NotOverlapHandler"
            }

            // Move the overlap assertion to update.
            if (goal_keyword != undefined){
                overlapAssertion["goal_keyword"]=goal_keyword;
            }
            newProgram["update"]["listeners"].push(overlapAssertion);

            // Add a new function to the brain called [goalKeyword]OverlapHandler, with e1 and e2 as params.  Inside that function go all of the remaining preconditions and conclusions.
            var assertList = cygnusBrain.assertions[i]["l"];

            // Remove overlapAssertion from assertList.
            var overlapIdx = assertList.indexOf(overlapAssertion);
            assertList.splice(overlapIdx,1);

            newLeft = getNewHypotheses(newLeft, assertList);

            newRight = getNewConclusions(newRight,cygnusBrain.assertions[i]["r"]);



            var functionName = goal_keyword + fName;
            newProgram[functionName] = {};

            for(var k = 0; k < newRight.length; k++){
                newRight[k].handler = functionName; // we're gonna store this in 'right' even though it feels wrong.
            }

            if (isNotOverlapConditional){
                newProgram[functionName]["params"] = [];
            }
            else{
                newProgram[functionName]["params"] = ["e1","e2"];
            }
            newProgram[functionName]["outcomes"] = [];

            var newAssert2 = {
                "l": newLeft,
                "relation":"causes",
                "r": newRight
            };
            if (goal_keyword != undefined){
                newAssert2["goal_keyword"]=goal_keyword;
            }
            newProgram[functionName]["outcomes"].push(newAssert2);
        }
        // e.g. mouse_button control_event pressed
        else if (isPressedConditional && pressedAssertion!=null){
            // Move the pressed assertion to create.
            if (goal_keyword != undefined){
                pressedAssertion["goal_keyword"]=goal_keyword;
            }
            newProgram["create"]["listeners"].push(pressedAssertion);

            // Add a new function to the brain called [goalKeyword]PressedHandler.  Inside that function go all of the remaining preconditions and conclusions.
            var assertList = cygnusBrain.assertions[i]["l"];
            // Remove pressedAssertion from assertList.
            var pressIdx = assertList.indexOf(pressedAssertion);
            assertList.splice(pressIdx,1);

            newLeft = getNewHypotheses(newLeft, assertList);
            newRight = getNewConclusions(newRight,cygnusBrain.assertions[i]["r"]);

            var functionName = goal_keyword + "PressedHandler";
            newProgram[functionName] = {};
            newProgram[functionName]["outcomes"] = [];

            newRight[0].handler = functionName;

            var newAssert2 = {
                "l": newLeft,
                "relation":"causes",
                "r": newRight
            };

            if (goal_keyword != undefined){
                newAssert2["goal_keyword"]=goal_keyword;
            }
            newProgram[functionName]["outcomes"].push(newAssert2);
        }
        // Timer elapsed conditional.
        // e.g. t1 has_state timerElapsed
        else if (isTimerLogicConditional && timerLogicAssertion!=null){
            // Get the name of the time elapsed listener function.
            var timerListenFn = goal_keyword + "_" + timerLogicAssertion["l"][0] + "Listener";

            // Move assertion to create.
            var newAssert =  timerLogicAssertion;

            if (goal_keyword != undefined){
                newAssert["goal_keyword"]=goal_keyword;
            }
            newProgram["create"]["listeners"].push(newAssert);

            // Add a new function to the brain called [goalKeyword]_[timerID]Listener.  Inside that function go all of the remaining preconditions and conclusions.
            var assertList = cygnusBrain.assertions[i]["l"];
            // Remove overlapAssertion from assertList.
            var timerIdx = assertList.indexOf(timerLogicAssertion);
            assertList.splice(timerIdx,1);

            newLeft = getNewHypotheses(newLeft, assertList);
            newRight = getNewConclusions(newRight,cygnusBrain.assertions[i]["r"]);

            newProgram[timerListenFn] = {};
            newProgram[timerListenFn]["params"] = [];
            newProgram[timerListenFn]["outcomes"] = [];

            var newAssert2 = {
                "l": newLeft,
                "relation":"causes",
                "r": newRight
            };
            if (goal_keyword != undefined){
                newAssert2["goal_keyword"]=goal_keyword;
            }
            newProgram[timerListenFn]["outcomes"].push(newAssert2);
        }
        else{
            newLeft = getNewHypotheses(newLeft, cygnusBrain.assertions[i]["l"]);
            newRight = getNewConclusions(newRight,cygnusBrain.assertions[i]["r"]);

            var newAssert3 = {
                "l": newLeft,
                "relation":"causes",
                "r": newRight
            };
            if (goal_keyword != undefined){
                newAssert3["goal_keyword"]=goal_keyword;
            }
            // Push the new assertion into the outcomes list.
            newProgram["update"]["outcomes"].push(newAssert3);
        }
        return [newBrain, newProgram];
    }

    /* Helper function for updateProgramConditional and mergeInitialWithCygnus.

       Input:  newLeft = hypotheses to update.
       assert = cygnusBrain.assertions[i]["l"]

       Output: updated newLeft
    */
    var getNewHypotheses = function(newLeft, assert){
        // Update each element in left array.
        // > add logicalOp &&.
        for (var m in assert){
            // TODO add each property of cygnusBrain.assertions[i]["l"][m], (not just l, relation, r)

            // Here are the "old" values from the cygnus brain corresponding to the left attribute.
            var oldLeft = assert[m]["l"];
            var oldRelation = assert[m]["relation"];
            var oldRight = assert[m]["r"];
            if (oldRight != undefined){
                if (!rensa.arraysEqual(oldRight,["click_listener"])){
                    var newLeftA =  {"l":oldLeft,"relation":oldRelation,"r":oldRight,"logicalOp":"&&"};
                    newLeft.push(newLeftA);
                }
                else{
                    //I believe it is intentional that this block is empty, as we want click_listeners (and maybe others too?)
                    //to have an empty hypothesis. (i.e. we don't want to generate if statements for them)
                }
            }
        }
        return newLeft;
    };

    /* Helper function for updateProgramConditional and mergeInitialWithCygnus.

       Input:  newRight = conclusions to update.
       asserts = cygnusBrain.assertions[i]["r"];

       Output: updated newRight
    */
    var getNewConclusions = function(newRight, asserts){
        // Update each element in right array.
        // > increase, decrease --> set_value.
        for (var n in asserts){
            var newRightA = changeToSetValue(asserts[n]);
            newRight.push(newRightA);
        }
        return newRight;
    };

    /*
      This function changes an assertion that changes a value (i.e., one with a
      relation of "increase","decrease","increase_over_time", or "decrease_over_time")
      and rewrites that assertion so that it is framed as a "set_value" relation.

      Input:  assert (the assertion to change).
      Output: newRightA (the updated assertion).
    */
    var changeToSetValue = function(assert){
        var newRightA ={};
        newRightA["l"]=assert["l"];
        newRightA["r"]=assert["r"];

        //if we are updating a property, handle that here.
        if(assert["property"] !== undefined){
            var property = assert["property"];

            newRightA["l"]=[assert["l"] +"."+property];
        }
        else if (assert["resourceL"] !== undefined) {

            newRightA["l"]=[assert["l"] +"/10"];
        }

        if(assert["propertyR"] !== undefined){
            var property = assert["propertyR"];

            newRightA["r"]=[assert["r"] +"."+property];
        }
        else if (assert["resourceR"] !== undefined) {

            newRightA["r"]=[assert["r"] +"/10"];
        }
        else{

            newRightA["r"]=[assert["r"] ];
        }


        // Here are the "old" values from the cygnus brain corresponding to the right attribute.
        var oldRelation = assert["relation"];
        var oldRight = assert["r"];
        if (oldRelation=="increase"){
            newRightA["relation"]="set_value";
            // TODO fix so not assuming newRightA["l"] consists of one element (if needed)
            newRightA["r"]=[newRightA["l"][0]+"+"+ newRightA["r"][0]];
        }
        else if (oldRelation=="decrease"){
            newRightA["relation"]="set_value";
            newRightA["r"]=[newRightA["l"][0]+"-"+newRightA["r"][0]];
        }
        else if (oldRelation=="increase_over_time"){
            newRightA["relation"]="set_value";
            //newRightA["r"]=[newRightA["l"][0]+"+"+oldRight+"*this.game.time.elapsed/3840.0"];
            newRightA["r"]=[newRightA["l"][0]+"+"+newRightA["r"][0]+"/160"];
        }
        else if (oldRelation=="decrease_over_time"){
            newRightA["relation"]="set_value";
            //newRightA["r"]=[newRightA["l"][0]+"-"+oldRight+"*this.game.time.elapsed/3840.0"];
            newRightA["r"]=[newRightA["l"][0]+"-"+newRightA["r"][0]+"/160"];
        }
        else {
            newRightA["relation"]=oldRelation;
            newRightA["r"]=oldRight;
        }

        // Add all other properties.
        for (var prop in assert) {
            if (assert.hasOwnProperty(prop)){
                if (prop!="l" && prop!="r" && prop != "relation"){
                    newRightA[prop]=assert[prop];
                }
            }
        }

        return newRightA;
    }

    // Check if an assertion is a variable declaration in Phaser Abstract Syntax.
    var isVariableAssertion=function(a){
        return a["relation"]=="instance_of" && (a["r"].indexOf("variable")>=0);
    };

    var isRelationType=function(a,relationType){
        return a["relation"]==relationType;
    };

    // Check if an assertion is setting the value of one or more concepts.
    var isSetValueAssertion=function(a){
        return isRelationType(a,"set_value");
    };

    // Check if an assertion is a conditional.
    var isConditionalAssertion = function(a){
        return isRelationType(a,"causes");
    }

    var isCallbackAssertion = function(a){
        return isRelationType(a,"triggers");
    }

    var isTimerCallbackAssertion = function(a){
        return isRelationType(a,"has_state") && (a["r"].indexOf("timer_elapsed")>=0);
    }

    var isDraggableAssertion = function(a){
        return isRelationType(a,"instance_of") && (a["r"].indexOf("draggable")>=0);
    }

    var isFunctionAssertion = function(a){
        return a["relation"]=="instance_of" && (a["r"].indexOf("function")>=0);
    }

    var isGoalAssertion = function(a){
        return isRelationType(a,"instance_of") && (a["r"].indexOf("goal")>=0);
    }

    var isOverlapAssertion = function(a){
        return isRelationType(a,"overlaps");
    }

    var isNotOverlapAssertion = function(a){
        return isRelationType(a,"not_overlaps");
    }

    var isMousePressedAssertion = function(a){
        return isRelationType(a,"control_event") && (a["r"].indexOf("pressed")>=0);
    }

    var isStaticAssertion = function(a){
        return isRelationType(a,"instance_of") && (a["r"].indexOf("static")>=0);
    }

    var isSetColorAssertion = function(a){
        return isRelationType(a,"set_color");
    }

    var isRestitutionAssertion = function(a){
        return isRelationType(a,"apply_restitution")
    }

    var isRotatesAssertion = function(a){
        return isRelationType(a,"rotates");
    }

    var isRotateToAssertion = function(a){
        return isRelationType(a,"rotate_to");
    }

    var isDenotesAssertion = function(a){
        return isRelationType(a,"denotes")
    }

    var isLookAtAssertion = function(a){
        return isRelationType(a, "look_at");
    }

    var isMotionAssertion = function(a){
        return (
            isRelationType(a,"move_towards") ||
                isRelationType(a,"move_away")    ||
                isRelationType(a,"moves")
        )
    }

    var isUpdateValueAssertion = function(a){
        return (
            isRelationType(a,"increase") ||
                isRelationType(a,"decrease") ||
                isRelationType(a,"increase_over_time") || isRelationType(a,"decrease_over_time")
        )
    }

    var isLabelAssertion = function(a){
        return isRelationType(a,"has_label");
    }

    // Checks if an assertion is a variable declaration in Cygnus Abstract Syntax.
    var isVariableTypeAssertion=function(a){
        return a["relation"]=="instance_of" && (a["r"].indexOf("resource")>=0 || a["r"].indexOf("entity")>=0);
    };

    return {
        cygnusToPhaser : cygnusToPhaser,
        isVariableAssertion : isVariableAssertion,
        isRelationType : isRelationType,
        isSetValueAssertion : isSetValueAssertion,
        isConditionalAssertion : isConditionalAssertion,
        isCallbackAssertion : isCallbackAssertion,
        isTimerCallbackAssertion : isTimerCallbackAssertion,
        isDraggableAssertion : isDraggableAssertion,
        isFunctionAssertion : isFunctionAssertion,
        isGoalAssertion : isGoalAssertion,
        isOverlapAssertion : isOverlapAssertion,
        isNotOverlapAssertion : isNotOverlapAssertion,
        isMousePressedAssertion : isMousePressedAssertion,
        isStaticAssertion : isStaticAssertion,
        isSetColorAssertion : isSetColorAssertion,
        isRestitutionAssertion : isRestitutionAssertion,
        isRotatesAssertion : isRotatesAssertion,
        isRotateToAssertion : isRotateToAssertion,
        isDenotesAssertion : isDenotesAssertion,
        isMotionAssertion : isMotionAssertion,
        isUpdateValueAssertion : isUpdateValueAssertion,
        isVariableTypeAssertion : isVariableTypeAssertion,
        isLabelAssertion : isLabelAssertion,
        isLookAtAssertion : isLookAtAssertion
    }
});
