/*
  This file contains a small, personalized chunk of "Rensa" - a library that helps you store and reason over concepts and relationships.
*/

define([], function() {

    // A Brain contains assertions about the world.
    function Brain(){
        this.assertions = {};
    }

    // Makes a brain given a list of concepts.
    var makeBrain = function(facts){
        var brain = new Brain();
        for (var i in facts){
            brain.addAssertion(facts[i]);
        }
        return brain;
    };

    // Returns the intersection between two brains.
    Brain.prototype.intersect = function(other){
        myAsserts = this.getAssertions();
        otherAsserts = other.getAssertions();
        intersect = [];
        for (var i in myAsserts){
            for (var j in otherAsserts){
                if (myAsserts[i].equals(otherAsserts[j])){
                    intersect.push(myAsserts[i]);
                }
            }
        }
        return intersect;
    };

    // True if two brains are equivalent.
    Brain.prototype.equals = function(other){
        return (this.getAssertions().length == other.getAssertions().length) && (this.intersect(other).length == this.getAssertions().length);
    };

    // Add a new assertion to the assertions list.
    Brain.prototype.addAssertion = function(a){
        if (~this.hasAssertion(a)){
            this.assertions[Object.keys(this.assertions).length] = new Assertion(a);
            return true;
        }
        return false;
    };

    // Check if an assertion is already part of this Brain object's assertions list.
    Brain.prototype.hasAssertion = function(a){
        var assert = new Assertion(a);
        for (var i in this.assertions){
            if (this.assertions[i].equals(assert)){return true;}
        }
        return false;
    };

    // Returns an array containing all assertions.
    Brain.prototype.getAssertions = function(){
        return $.map(this.assertions, function(value, key) { return value });
    };

    // Remove an assertion from the assertions list.
    Brain.prototype.removeAssertion = function(a) {
        var assert = new Assertion(a);
        var removeKeys = [];
        for (var i in this.assertions){
            if (this.assertions[i].equals(assert)){
                removeKeys.push(i);
            }
        }
        for(var r=0;r<removeKeys.length;r++){
            delete this.assertions[r];
        }
    };

    // Remove an assertion by ID.
    Brain.prototype.removeAssertionWithID = function(idn) {
        delete this.assertions[idn];
    };

    // Returns an assertion's ID.
    Brain.prototype.getAssertionID = function(a){
        var assert = new Assertion(a);
        for (var i in this.assertions){
            if (JSON.stringify(this.assertions[i])===JSON.stringify(assert)){return i;}
        }
        return false;
    };

    // Remove an assertion by ID.
    Brain.prototype.getAssertionByID = function(idn) {
        return this.assertions[idn];
    };

    // Edit any attribute of an assertion to have a new value.
    Brain.prototype.editAssertion = function(idn,attr,value) {
        this.assertions[idn][attr] = value;
    };

    // Remove an assertion's property.
    Brain.prototype.removeAssertionProperty = function(idn,propertyName) {
        delete this.assertions[idn][propertyName];
    };

    // Returns list of all assertions IDs with the specified values for attributes.
    Brain.prototype.getAssertionsWith = function(d){
        var l = [];
        var flag;
        for (var i in this.assertions){
            flag = true;
            for (var key in d){
                for(var j=0; j<d[key].length;j++){
                    if (this.assertions[i].hasOwnProperty(key)){
                        // Not viable for old versions of IE.
                        if ((this.assertions[i][key]).indexOf(d[key][j]) == -1){
                            flag = false;
                        }
                    }
                    else{
                        flag=false;
                    }
                }
            }
            if (flag){
                l.push(i);
            }
        }
        return l;
    };

    // Takes in a string concept, and returns a list of all
    // assertions that involve that concept, and how they are related.

    // Example:
    // If concept is "prince" and prince instance_of actor, returns
    // [ [{"l":["prince"], "relation":"instance_of", "r":["actor"]}, "l"] ]
    Brain.prototype.getAssertionsRelatedTo = function(concept){
        var l = [];
        for (var i in this.assertions){
            // For each property in the current assertion,
            for (var property in this.assertions[i]) {
                if (this.assertions[i].hasOwnProperty(property) && this.assertions[i][property]) {
                    // If the value of that property is an array with at least one element
                    if (this.assertions[i][property] instanceof Array && this.assertions[i][property].length > 0){
                        // If the value of the current assertion's property
                        // contains concept,
                        if (this.assertions[i][property].indexOf(concept) != -1){
                            // Add this assertion and the property to the list.
                            l.push([this.assertions[i], property]);
                        }
                    }
                    // If the value of that property is a string,
                    else if(typeof this.assertions[i][property] === 'string' || this.assertions[i][property] instanceof String){
                        // If the value of the current assertion's property
                        // is concept,
                        if (this.assertions[i][property] == concept){
                            // Add this assertion and the property to the list.
                            l.push([this.assertions[i], property]);
                        }
                    }
                    else{
                        if (isNaN(parseFloat(this.assertions[i][property]))){
                            console.log("Warning: type of " + this.assertions[i][property] + " is not string, array, or number.");
                        }
                    }
                }
            }
        }
        return l;
    }

    // Returns list of all assertion ids that have the specified tag.
    Brain.prototype.getAssertionsWithTag = function(t){
        var l = [];
        for (var i in this.assertions){
            if ("tag" in this.assertions[i]){
                if (this.assertions[i]["tag"] != null){
                    // Not viable for old versions of IE.
                    var idx = this.assertions[i]["tag"].indexOf(t);
                    if (idx != null){
                        if (idx > -1) {
                            l.push(i);
                        }
                    }
                }
            }
        }
        return l;
    };

    // For every id in ids, find the list of strings for
    // a given concept.  Return an array with all elements of
    // those lists.
    Brain.prototype.getConceptList = function(ids, concept){
        var result = [];
        for(var i in ids){
            for (var x in this.getAssertionByID(ids[i])[concept]){
                result.push(this.getAssertionByID(ids[i])[concept][x]);
            }
        }
        return result;
    }

    // Given an array of strings that represent groups,
    // return a list of the individuals that make up those groups.

    // Example: getIndivs(["woman"]) for Beauty and the Beast returns
    // ["Belle", "Mrs. Potts", "Babette", "The Wardrobe", "Claudette",
    // "Laurette", "Paulette", "Enchantress"] if they are all categorized as a woman.
    Brain.prototype.getIndivs = function(group){
        var indivs = [];
        var flag = true;
        var g;
        if (group.constructor === Array){
            while(flag){
                flag = false;
                tempGroup = [];
                for(g in group){
                    var ids = this.getAssertionsWith({"relation":"type_of","r":[group[g]]});
                    if (ids.length > 0){
                        tempGroup.push.apply(tempGroup, this.getConceptList(ids,"l"));
                        flag = true;
                    }
                    else{
                        indivs.push(group[g]);
                    }
                }
                group = tempGroup;
            }
            return indivs;
        }
        else{
            console.log("Error: you should be passing in an array of strings to getIndivs().")
            return false;
        }
    };

    // Print all known assertions.
    Brain.prototype.print = function(){
        for (var i in this.assertions){
            //  console.log(JSON.stringify(this.assertions[i]));
        }
    };

    // Print all known assertions, prettily.
    Brain.prototype.prettyprint = function(){
        for (var i in this.assertions){
            _prettyprint(this.assertions[i], true);
        }
    };


    var _prettyprint = function(a, printAllProperties){
        var flag=false;
        //  console.log(JSON.stringify(a["l"]) +" "+ a["relation"] +" "+ JSON.stringify(a["r"]));
        if (printAllProperties){
            for (var p in a) {
                if (a.hasOwnProperty(p) && p!="l" && p!="relation" && p!="r" && typeof a[p]!=="function") {
                    flag=true;
                    //   console.log("\t"+p+": " + JSON.stringify(a[p]));
                }
            }
        }
        //if (flag){console.log("");}
        return JSON.stringify(a["l"]) +" "+ a["relation"] +" "+ JSON.stringify(a["r"]);
    }

    // Return a clone of a brain.
    Brain.prototype.clone = function(){
        return makeBrain(this.assertions);
    }

    // Assertions are links between two concepts.
    function Assertion(attributes){
        this.l = this.addRequiredProperty("l", attributes);
        this.relation = this.addRequiredProperty("relation", attributes);
        this.r = this.addRequiredProperty("r", attributes);

        // Add all remaining optional properties.
        for (var property in attributes){
            if (attributes.hasOwnProperty(property)) {
                this[property] = this.addOptionalProperty(property,attributes,undefined);
            }
        }
    }

    // Check if another array is equivalent to this one.
    Assertion.prototype.equals = function(other){
        if (other instanceof Assertion){
            for (var property in this) {
                if (this.hasOwnProperty(property)) {
                    if (other.hasOwnProperty(property)) {
                        if (!(JSON.stringify(other[property]) === JSON.stringify(this[property]))) {
                            if (!(arraysEqual(other[property],this[property]))){
                                return false;
                            }
                        }
                    }
                    else{
                        return false;
                    }
                }
            }
        }
        return true;
    };

    Assertion.prototype.stringify = function(){
        return JSON.stringify(this);
    };

    Assertion.prototype.clone = function(){
        return JSON.parse(JSON.stringify(this));
    };

    // Helper for Assertion.prototype.equals.
    // Determines if two arrays are equal.
    var arraysEqual=function(a, b) {
        if (a.constructor === Array && b.constructor === Array){
            if (a === b) return true;
            if (a == null || b == null) return false;
            if (a.length != b.length) return false;

            a = a.sort();
            b = b.sort();
            for (var i = 0; i < a.length; ++i) {
                if (a[i] !== b[i]) return false;
            }
            return true;
        }
        return false;
    };

    // Helper function for assigning mandatory attributes.
    Assertion.prototype.addRequiredProperty = function(propertyName,attributesList){
        // Check if assertion has the property.
        if (propertyName in attributesList){
            return attributesList[propertyName];
        }
        // console.log("Warning: no " + propertyName + " property in assertion: \n" + JSON.stringify(attributesList) + "\n");
        return null;
    };

    // Helper function for assigning optional attributes.
    Assertion.prototype.addOptionalProperty = function(propertyName,attributesList,defaultValue){
        // Check if assertion has the property.
        if (propertyName in attributesList){
            return attributesList[propertyName];
        }
        return defaultValue;
    };

    // Checks if an array contains an object.
    var containsObj=function(obj, list) {
        var i;
        for (i = 0; i < list.length; i++) {
            if (JSON.stringify(obj) === JSON.stringify(list[i])) {
                return true;
            }
        }
        return false;
    }

    // Finds the intersection of two arrays.
    // Note: this will not work with objects.
    function intersect(a, b) {
        var t;
        if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
        return a
            .filter(function (e) {
                if (b.indexOf(e) !== -1) return true;
            })
            .filter(function (e, i, c) { // extra step to remove duplicates
                return c.indexOf(e) === i;
            });
    };

    return {
        makeBrain : makeBrain,
        arraysEqual : arraysEqual,
        prettyprint : _prettyprint,
        containsObj : containsObj
    }
});
