str= "abcdefghi"
lnames= str.split("");
lvalues= str.toUpperCase().split("");

r= zipkv(lnames, lvalues);
//prueba test, agregar elemento: r["q"]="Z";
//prueba test, valor erroneo: r["b"]="Z";
//prueba test, falta elemento: delete(r["b"])

logm("DBG",1,"ZIPKV",{names: lnames, values: lvalues, r: r});
var cnt= Object.keys(r).length;
var errores= [];
for (var i=0; i<lnames.length; i++) {
	if (r[lnames[i]]!=lnames[i].toUpperCase()) {
		errores.push("'"+lnames[i]+"' es '"+r[lnames[i]]+"' en "+i);	
	}
}

estaOk= (cnt==lnames.length) && errores.length==0;
logm(estaOk ? "NFO": "ERR",1,"TEST RESULT",{cnt: cnt, cntDeseado: lnames.length, errores: errores});
