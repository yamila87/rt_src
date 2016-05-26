LibRt.LogLvlMax= 9;

var wpath= webRequestPath(webRequest);
logm("DBG",1,"WEB JS LOADED",{webMethod: webMethod, path: wpath});

if (wpath=="/app/cx" && (webMethod=="GET" || webMethod=="POST")) { //A: la libreria que atiende servicios rest, etc.
	load('libcx.js');
 	cxRunPipe();
}
else if (wpath=="/app/ctl") { //A: como tengo eval, podria conectarme al proceso y ejecutar CUALQUIER cosa sin reiniciarlo (XXX:SEC OJO! no tiene sentido hacer "eval" pero si usar un dispatcher
	var js= webRequestParam(webRequest,"js")||"";
	var r='';
	//eval("try { "+js+" } catch (ex) { r=ex }");
	webResponseWrite(webResponse,"CONSEGUI "+r+" cuando EVALUE "+js);
}
else { //A: un default :)
	webResponseWrite(webResponse,"Como estas? Me pediste "+wpath+", esto es una prueba y aca no tengo nada :(");
}

