logm("NFO",1,"START",{steps: 2});

try { z= v; }
catch (ex) {
	logmex("ERR",1,"TEST logmex javascript",null,ex);
	for (k in ex) {
		print(k+" "+ex[k]+"\n");
	}
}

try { z= Packages.LibRt.fileWriter("/esto/no/existe/seguro/y/lanza/excepcion/java"); }
catch (ex) {
	logmex("ERR",1,"TEST logmex java",null,ex);
}

for (i=0; i<100; i++) {
logm("NFO",1,"STEP",{steps: 100, step:i});
}

logm("NFO",1,"END");

