CfgCacheDir= "x_cache";
InvalidarPorTile= [];

funcionDePrueba= function (par1, par2) {
	return [par1,par2,ahora()].join("_")
}

var cache= nuevo_cache_archivos("todo", CfgCacheDir);

fold("funcionDePrueba".split(" "),
  function(name) {
    var keyf = function() { var a= Array.prototype.slice.call(arguments); return ser_json(a); };
    var f = GLOBAL[name + "NoCache"] = GLOBAL[name];
    var fConCache= GLOBAL[name] = funcionConCache(f, cache, keyf);
    logm("DBG",1,"CACHE MAPA",{name:name, invalidar: fConCache.cache_invalidar+""});
    InvalidarPorTile.push(fConCache); //A: tengo una lista con todos los caches que hay que invalidar cuando me avisan que cambio un tile
  }
);

var t= "ABCDE".split("");
for (var i=0; i<t.length; i++) {
	for (var j=0; j<t.length; j++) {
		funcionDePrueba(t[i],t[j]);
	}
}

for (var i=0; i<t.length; i++) {
	for (var j=0; j<t.length; j++) {
		funcionDePrueba(t[i],t[j]);
	}
}



