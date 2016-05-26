var r= systemRun(["false"]);
logm(r==1 ? "NFO": "ERR",1,"TEST RUN",{obtenido: r, deseado: 1});

var r= systemRun(["true"]);
logm(r==0 ? "NFO": "ERR",1,"TEST RUN",{obtenido: r, deseado: 0});


try {
	var r= systemRun(["CoManDoQueNoExiste"]);
	logm("ERR",1,"TEST RUN",{obtenido: r, deseado: "excepcion!"});
} catch (ex) {
	logmex("NFO",1,"TEST RUN OK",{deseado: "excepcion"},ex);
}
