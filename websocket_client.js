const socket = new WebSocket('ws://127.0.0.1:3000');
socket.onopen = function(ev) {
  console.log(ev);
  const req = {
    batchID: 'batch' + Date.now(),
    intent: generateASPForIntent(currentIntent)
  };
  socket.send(JSON.stringify(req));
};
socket.onmessage = function(ev) {
  console.log('event:', ev);
  console.log('data:', JSON.parse(ev.data));
};
