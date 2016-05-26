transporteWebDataIn= function () {
	var s= webRequestData(webRequest);
	logm("DBG",7,"TRANSPORTE DATA IN",{s: toJs(s), method: toJs(webMethod)});
	return s;
}

//S: transporte
transporteWebParamsIn= function () { return webRequestParams(webRequest); }

transporteWebParamsOut= function (s) { 
	webResponseWrite(webResponse,typeof(s)=="string" ? s : ser_json(s));
	//A: escribimos s como bytes, si es string enviamos EXACTAMENTE lo que nos pasaron, ej. para binarios
}
transporteWebParamsOutStr= transporteWebParamsOut; //A: ahora es la misma implementacion, pero conservamos nombres separados por si cambiamos de idea

transporteWebUrlIn= function () { } //XXX: implementar estandar

//S: protocolo
protoWebJsonIn= function (cmdSrc) {
	logm("DBG",7,"JSON",cmdSrc.json);
	var cmd= JSON.parse(cmdSrc.json);
	return cmd;
}

protoWebJsonOut= function (r) {
	return ser_planoOjson(r); //A: transporteWebParamsOut lo pasa como string sin modificarlo, como pide el protocolo;
}

protoWebHtmlOut= function (r) {
    webResponse.setHeader('Content-Type','text/html; charset=utf-8');
    return r;
}

//S: protocolo
protoNamedArgs= function (cmd) {
	cmd.args=[parseInt(cmd.nodo)];
	return cmd;
}

//A: cmd es un comando ESTANDAR, no importa por donde vino ni el protocolo
//S: dispatch
appDispatch= function (cmd) {
	var cmdok= cmd.cmd; //XXX:SEC no ejecutar cualquier cosa!
	var argsok= cmd.args || [cmd]; //XXX:SEC no ejecutar cualquier cosa!
	logm("NFO",1,"DISPATCH",{cmd: cmd, func: cmdok, args: argsok});
	var r= GLOBAL[cmdok].apply(this,argsok);
	return r;
}

//S: transporte
CfgPipeDef= {};
CfgPipeDef.Json= [transporteWebParamsIn,protoWebJsonIn,appDispatch,protoWebJsonOut,transporteWebParamsOut];

CfgPipeDef.Json2Str= [transporteWebParamsIn,protoWebJsonIn,appDispatch,transporteWebParamsOutStr];

CfgPipeDef.JsonNamed= [transporteWebParamsIn,protoWebJsonIn,protoNamedArgs,appDispatch,protoWebJsonOut, transporteWebParamsOut];

CfgPipeDef.FormParams= [transporteWebParamsIn,appDispatch,protoWebJsonOut,transporteWebParamsOut];
CfgPipeDef.FormParamsPage= [transporteWebParamsIn,appDispatch,protoWebHtmlOut,transporteWebParamsOut];

//U: si tuviera un soap generado en eclipse desde el wisdel simplemente en cada metodo, llamaria con el pipe que necesite
CfgPipe= CfgPipeDef.Json; //A: dflt

cxRunPipe= function (aPipe,r0) { //U: llama cada una de las funciones del pipe con el resultado de la anterior como parametro
	aPipe= aPipe || CfgPipe;
	var r= r0;
	for (var i=0; i<aPipe.length; i++) {
		logm("DBG",9,"CX PIPE CALL",{step: i, r: r});
		try {
			r= aPipe[i](r);
			logm("DBG",9,"CX PIPE RESULT",{step: i, r: r});
		}
		catch (ex) {
			logmex("DBG",9,"CX PIPE RESULT EXCEPTION",{step: i, r: r},ex);
			r= {LibCxException: exceptionToString(ex)};
		}
	}
}

//S: protocolo
//X: aca lo podria formatear, etc

//S: transporte
