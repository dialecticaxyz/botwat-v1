const { default: makeWASocket,DisconnectReason,useMultiFileAuthState } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const log = (pino = require("pino"));
const express = require("express");
const cors = require("cors");
const app = require("express")();
const qrcode = require("qrcode");
const server = require("http").createServer(app);
const fsExtra = require('fs-extra')

const { session } = { session: "session_auth_info" };
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

app.get("/scan", (req, res) => {
  res.sendFile("./client/index.html", {root: __dirname});
});
app.get("/", (req, res) => { res.send("server working") });

let sock;
let qrDinamic;

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("session_auth_info");
  sock = makeWASocket( {printQRInTerminal:true,auth:state,logger:log({level:"silent"})} );
  sock.ev.on("connection.update", async (update)=>{
    const { connection, lastDisconnect, qr } = update;
    qrDinamic = qr;
    if(connection==="close"){
      let reason = new Boom(lastDisconnect.error).output.statusCode;
      if(reason === DisconnectReason.badSession){
        console.log(`Bad Session File, Please Delete ${session} and Scan Again`);
      }
      if(reason === DisconnectReason.connectionClosed){
        console.log("Conexión cerrada, reconectando....");
        connectToWhatsApp();
      }
      if(reason === DisconnectReason.connectionLost){
        console.log("Conexión perdida del servidor, reconectando...");
        connectToWhatsApp();}
      if(reason === DisconnectReason.connectionReplaced){
        console.log("Conexión reemplazada, otra nueva sesión abierta, cierre la sesión actual primero");
      }
      if(reason === DisconnectReason.loggedOut){
        console.log(`Dispositivo cerrado, elimínelo ${session} y escanear de nuevo.`);
        fsExtra.remove('session_auth_info').then(()=>{ connectToWhatsApp(); }).catch(err=>{ console.error(err) })
      }
      if(reason === DisconnectReason.restartRequired){
        console.log("Se requiere reinicio, reiniciando...");
        connectToWhatsApp();
      }
      if(reason === DisconnectReason.timedOut){
        console.log("Se agotó el tiempo de conexión, conectando...");
        connectToWhatsApp();
      }
    }
    if(connection==="open"){ console.log("conexión abierta"); return; }
  });
  sock.ev.on("creds.update", saveCreds);
}

const isConnected = () => { return sock?.user ? true:false;};

app.post("/send-message", async (req,res) => {
  const tempMessage = req.body.message;
  const number = req.body.number;
  let numberWA;
  try {
    if(!number){
      res.status(500).json({status:false,response:"El numero no existe"});
    }else{
      numberWA = "591"+number+"@s.whatsapp.net";
      if(isConnected()){
        const exist = await sock.onWhatsApp(numberWA);
        if (exist?.jid || (exist && exist[0]?.jid)) {
          sock.sendMessage(exist.jid||exist[0].jid,{text:tempMessage}).then((result)=>{res.status(200).send({status:true,response:result}) }).catch((err)=>{ res.status(500).send({status:false,response:err})});
        }
      }else{ res.status(500).send({status: false,response: "Aun no estas conectado"}) }
    }
  }catch(err){ res.status(500).send(err) }
});

app.get("/scan-qr", async (req,res) => {
  if(isConnected()){ 
    res.status(200).send({"qr":false}) 
  }else if(qrDinamic){ 
    qrcode.toDataURL(qrDinamic, (err,url)=>{ 
      res.status(200).send({"qr":url}) 
    })
  }
});

connectToWhatsApp().catch((err) => console.log("unexpected error: " + err)); // catch any errors
server.listen(port, () => {
  console.log("Server Run Port : " + port);
});
