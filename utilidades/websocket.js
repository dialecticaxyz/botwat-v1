let clients = new Array;
function handleWs(ws, request) {
  console.log("New Connection ws"); 
  clients.push(ws);
  
  function close(){
    var position = clients.indexOf(ws);
    clients.splice(position, 1);
    console.log("connection closed ws");
  } 

  function message(d){
    let data = JSON.parse(d); console.log(data);
  }

  ws.on('message', message);
  ws.on('close', close);
}

function brocastBoot(qr){
  for (let c in clients) {// brocast
    clients[c].send(JSON.stringify(qr)) 
  }
}

module.exports = {
  handleWs,
  brocastBoot
}