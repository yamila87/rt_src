//INFO: tenemos que poder convertir a string javascript las excepciones javascript O java, en epsecial para rpc en libcx

throwJavaEx= function () {
	javaEx= new java.sql.SQLException("excepcion java fallo");
	throw(javaEx);	
}

try {
	throw("excepcion js fallo");	
}
catch (ex) {
	var s= exceptionToString(ex);
	print(s);
}

try {
	throwJavaEx();
}
catch (ex) {
	var s= exceptionToString(ex);
	print(s);
}

load('libcx.js');
cxRunPipe([throwJavaEx,protoWebJsonOut,print]);
