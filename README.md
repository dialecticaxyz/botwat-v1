# tools
-node version 16.16.0
https://whiskeysockets.github.io/docs/intro

# install project
npm install || npm install --force

# run project
npm start

# port default 8000

## api  visualizacion de codigo  qr
http://localhost:8000/scan

# para enviar mensaje
## get
http://localhost:8000//scan-qr

## get
http://localhost:8000/send-message?number=76538333&message=ok

## post
http://localhost:8000/send-message
{
"message":"hola como estas",
"number":"76538333"
}


##
Nota: la imagenBase64 se esta procesando internamente
# si tiene la carpeta crear por defecto eliminelo(solo la primera vez) session_auth_info (guarda la informacion del usario localmente)

let url = "http://localhost:8000/send-message"
let dat = {"message":"hola como estas","number":"76538333"  }
function sendMsg(dat){
  return new Promise(function(resolve,reject){
    fetch(url,{method:'post',headers:{'Accept':'application/json,text/plain','Content-Type':'application/json'},body:JSON.stringify(dat)}).then(rsp=>{ if(rsp.ok){ rsp.json().then(d=>{ resolve(d) })}});
  })
}
sendMsg(dat)