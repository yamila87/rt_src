//INFO: guardar un contador/secuencia en un archivo y actualizarlo de ahi...

mipath= "xprueba.cnt"
counter(mipath,7,true);
for (var i=0; i<5; i++) {
	var c= counter(mipath,i);
	logm("DBG",1,"CNT",{cnt: c, step: i});
}
c= counter(mipath,0,true);
if (c==17) {
	logm("NFO",1,"TEST COUNTER OK",{cnt: c});
}
else {
	logm("ERR",1,"TEST COUNTER valor incorrecto",{cnt: c, esperado: 17});
}
