//INFO: encriptar con la libreria scjl  desde el servidor (en el navegador funciona ok)

load('crypto-sjcl.js');

//XXX: copiado de librt.web en viz_mapa, mover a lib
btoa= GLOBAL.btoa || LibRt.enc_base64;
atob= GLOBAL.atob || LibRt.enc_base64_r;

CfgDbKey = GLOBAL.CfgDbKey || '3sUns3Cr3t0!';
encriptar= function (data,key) { try {
	var dataB64= toJs(btoa(encodeURIComponent(ser_planoOjson(data))));
 	var datae= toJs(sjcl.encrypt(key || CfgDbKey, dataB64));
	logm("DBG",1,"ENCRIPTAR",{data: data, dataB64: dataB64, datae: datae});
	return datae;
} catch(ex) { logmex("ERR",1,"ENCRIPTAR",{data: data, dataB64: dataB64},ex); throw(ex) } }

encriptar_r= function (datae,key) { try {
	var dataB64= sjcl.decrypt(key || CfgDbKey,datae);
	var datar= atob(dataB64);
 	var data= ser_planoOjson_r(decodeURIComponent(toJs(datar)));
	return data;
} catch(ex) { logmex("ERR",1,"ENCRIPTAR R",{datae: datae, data: data, datar: datar},ex); throw(ex) } }


//S: test
src="esto es una prueba"
x= encriptar(src);
src2= encriptar_r(x);
isOk= src==src2;
logm(isOk ? "NFO": "ERR",1,"TEST ENCRIPTAR",{ isOk: isOk, x: x, src: src, src2: src2});
