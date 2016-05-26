//INFO: una aplicacion web, multithread (un solo interprete js con estado compartido, la app DEBE ocuparse de que los threads no se "pisen"

var cntShared= 0; //U: esta variable 

onWebRequestImpl= function () { //U: atiende un webrequest a nivel aplicacion
	wpath = webRequestPath(webRequest); //U: la url que vino del navegador
	hdr = webRequestHeaders(webRequest); //U: los headers (cookies, etc.)
	session = webRequest.getSession(true); //U: sesion si tenia, sino la crea
	logm("DBG", 5, "WEB JS DISPATCH", { from: webRequestAddr(webRequest), session: session.getId() + "", webMethod: webMethod, path: wpath, hdr: hdr });

	load("t_webServerMod.js");
	if (webMethod=="GET" || webMethod=="POST") { //A: la vista
		webResponseWrite(webResponse,"HOLA "+(new Date())+" CNT="+(cntShared++)+" CNT2="+(CNT2)+" "+ser_json({ from: webRequestAddr(webRequest), session: session.getId() + "", webMethod: webMethod, path: wpath, hdr: hdr }));
	}
}

onWebRequest= onWebRequestImpl; //U: la CONVENCION es que el servlet llama la funcion onWebRequest si existe

print("SI APARECE MAS DE UNA VEZ, ES UN ERROR");
