let currentTabIdx = 0;
let tabs = [whatsItAbout, whatPlayerWants, whatsItLike, summary];



function nextTab(){
  if ((currentTabIdx + 1) >= tabs.length) {
    return;
  }
  let currentTab = tabs[currentTabIdx];
  let nextTab = tabs[currentTabIdx + 1];
  currentTab.style.display = 'none';
  nextTab.style.display = 'block';
  currentTabIdx += 1;
}

function prevTab(){
  if ((currentTabIdx - 1) < 0) {
    return;
  }
  let currentTab = tabs[currentTabIdx];
  let prevTab = tabs[currentTabIdx - 1];
  currentTab.style.display = 'none';
  prevTab.style.display = 'block';
  currentTabIdx -= 1;
}

/// whatsItAbout

let mainGameTopic = 'happiness';

function pickTopic(topic) {
  console.log('pickTopic: ' + topic);
  mainGameTopic = topic;
  whatPlayerWantsSelect.onchange();
  nextTab();
}

for (let button of document.querySelectorAll('.pick-topic')) {
  button.onclick = function() {
    pickTopic(this.innerText);
  }
}

whatsItAboutText.onkeydown = function(ev) {
  if (ev.keyCode === 13) {
    pickTopic(whatsItAboutText.value);
  }
}

whatsItAboutContinue.onclick = function() {
  pickTopic(whatsItAboutText.value);
}

/// whatPlayerWants

whatPlayerWantsSelect.onchange = function(ev) {
  let option = whatPlayerWantsSelect.options[whatPlayerWantsSelect.selectedIndex];
  let value = option.value;
  let innerHtml = value.replace('$X', '<input id="whatPlayerWantsText" type="text" value="' + mainGameTopic + '"/>');
  whatPlayerWantsTextWrapper.innerHTML = innerHtml;
}

whatPlayerWantsContinue.onclick = function() {
  console.log('goal: ' + whatPlayerWantsSelect.options[whatPlayerWantsSelect.selectedIndex].value);
  console.log('target: ' + whatPlayerWantsText.value);
  nextTab();
}

/// whatsItLike

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

whatsItLikeContinue.onclick = function() {
  whatsItLike.style.display = 'none';
  summary.style.display = 'block';
  let topic = capitalizeFirstLetter(mainGameTopic);
  gametitle.innerText = gametitle.innerText.replace('$TOPIC', topic);
}

/// summary

let games = [ ["games/depression-A-game_1.lp", // first game loaded in compiler/main.js
               "games/depression-A-game_2.lp",
               "games/depression-A-game_3.lp",
               "games/depression-A-game_4.lp",
               "games/depression-A-game_5.lp"],
              ["games/depression-B-game_1.lp",
               "games/depression-B-game_2.lp"],
              ["games/depression-C-game_1.lp"],
              ["games/depression-D-game_1.lp",
               "games/depression-D-game_2.lp",
               "games/depression-D-game_3.lp",
               "games/depression-D-game_4.lp",
               "games/depression-D-game_5.lp"],
              ["games/depression-E-game_1.lp",
               "games/depression-E-game_2.lp",
               "games/depression-E-game_3.lp",
               "games/depression-E-game_4.lp",
               "games/depression-E-game_5.lp"]
            ];
let currentPoolIndex = 0;
let currentGameIndex = 0;

// Load next game in the current pool (for the current intent)
nextGame.onclick = function() {
  currentGameIndex++;
  loadNextGame();
  
  if (previousGame.disabled == true) {
    previousGame.disabled=false;
  }
}

previousGame.onclick = function() {
  currentGameIndex--;
  loadNextGame();

  if (nextGame.disabled == true) {
    nextGame.disabled=false;
  }
}

function loadNextGame () {
  console.log("currentGameIndex:",currentGameIndex);

  if ((currentGameIndex + 1) >= games[currentPoolIndex].length) {
    nextGame.disabled=true;
  } else {
    nextGame.disabled=false;
  }

  if (currentGameIndex == 0) {
    previousGame.disabled=true;
  } else {
    previousGame.disabled=false;
  }

  let xhttp = new XMLHttpRequest();

  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {

      // Destroy the current game
      if ( game != "undefined") {
        game.destroy();
      }
      loadGame(this.responseText);
    }
  };

  console.log("loading game file:", games[currentPoolIndex][currentGameIndex])

  xhttp.open("GET", games[currentPoolIndex][currentGameIndex], true);
  xhttp.send();
}

// Load first game in the next pool of games
nextPool.onclick = function() {
  currentPoolIndex++;
  currentGameIndex = 0;
  loadNextGame();
}
