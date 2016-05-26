//INFO: un cache que guarda los n mas usados recientemente

load('lodash.min.js');

CNTMAX=5;
KMAX=6;
KUSOMAX=5;
c1= nuevo_cache_recienUsados(CNTMAX);
//c1= nuevo_cache_archivos("x_cache");

valorDePrueba= function (i,modelo) {
	var xi= modelo ? 
		(typeof(modelo)=="string") ? 
			ser_json_r(modelo.substr("COMO STRING ".length))["i"] : 
			modelo.i 
		: i;	
	var r= {k: "k"+(i%KMAX), v: "v"+(i%KMAX), i: xi};
	return ((i%2) ? "COMO STRING "+ser_json(r,true) : r);
}

for (var i= 0; i<100; i++) {
	for (var j= 0; j<KUSOMAX && j<i; j++) { 
		var v= c1.de(c1,"k"+j) 
		var ve= valorDePrueba(j,v);
		if (v && !_.isEqual(v,ve)) { 
			logm("ERR",1,"TEST CACHE VALOR RECUPERADO NO COINCIDE",{ recuperado: v, esperado: ve, j: j, i: i }); 
		}
	}
	c1.sea(c1,"k"+(i%KMAX),valorDePrueba(i));	
	logm("DBG",1,"CACHE",c1);
}


