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
