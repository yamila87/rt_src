//INFO: OCULTAR los detalles del runtime en una API estandard, igual en movil, java, C#, etc.

//*****************************************************************************
//S: basicos
GLOBAL= this; //D: referencia al ambiente global, ej para que sea accesible a closures
GLOBAL.LibRt= GLOBAL.LibRt || (GLOBAL.Packages ? Packages.LibRt : this) ;
GLOBAL.rtType= "java";

//*****************************************************************************
//S: ambiente
get_dir_cur= function () { 
	return java.lang.System.getProperty("$user.dir",".")+""; 
}

get_dir_home= function () { 
	return java.lang.System.getProperty("user.home",".")+""; 
}

get_env= function (name,dflt) {
	var x= java.lang.System.getenv(name);
	return x ? x+"" : dflt;
}


//*****************************************************************************
//S: compatibilidad rhino/jdk
print= this.print || function (m) { java.lang.System.out.println(m); }
exit= this.exit || function(statusCodeAsInt) { java.lang.Runtime.getRuntime().exit(statusCodeAsInt||0); }

//*****************************************************************************
//S: compatibilidad con el browser
console= {};
console.log= function (m) { logm("DBG",1,m); }
window= this;
showMsg= function (m) { logm("DBG",1,m); }
setTimeout= function (cb) { logm("ERR",1,"setTimeout SOLO FUNCIONA dentro de runWithTimer"); }
setInterval= function (cb) { logm("ERR",1,"setTimeout SOLO FUNCIONA dentro de runWithTimer"); }

runWithTimer= function (f) { //U: agrega setTimeout y setInterval SOLO DENTRO de la funcion f
	load('libBrowserTimer.js');
	var timerLoop = makeWindowTimer(this, java.lang.Thread.sleep);
	//A: tenemos emulacion para setTimeout en el servidor
	f();
	timerLoop();
}

cxAjaxCall= function(rpcOpts, params, cb,cbError) {
	var r= null;
	try { var f= GLOBAL[rpcOpts.funName]; r= f(params); }
	catch (ex) {
		logmex("ERR",1,"CX AJAX CALL",{rpcOpts: rpcOpts, params: params},ex);	
		r= {LibCxException: exceptionToString(ex)};
	}
	setTimeout(function () { cb(r); },0); //XXX: emular para tests
}
//A: emulamos ajax desde cliente




//*****************************************************************************
//S: serializacion
ser_json= function (o,wantsPretty) {
	var s;
	if (o!=null) {
		try { s= JSON.stringify(o,null,wantsPretty ? 2 : null); }
		catch (ex) { s=String(o); }
	}
	else {
		s="null";
	}
	return s;
}

enc_base64= function (val) {
	return javax.xml.bind.DatatypeConverter.printBase64Binary(new java.lang.String(val).getBytes("ISO-8859-1"));
}

enc_base64_r= function (base64str) {
	var bytes= javax.xml.bind.DatatypeConverter.parseBase64Binary(base64str);
	var dec= new java.lang.String(bytes,"ISO-8859-1")+"";
	return dec;
}

//*****************************************************************************
//S: log
LibRt.logInit(false); //A: asegurarse que el log este inicializado
LogLvlMax= LibRt.LogLvlMax;
set_logLvlMax= function (lvl) {
	var r= LibRt.LogLvlMax;
	LogLvlMax= LibRt.LogLvlMax= lvl;
	return r;
}

logm= function(t,lvl,msg,o) { //D: usar SOLO esta funcion de log (t es DBG, NFO o ERR ; lvl es 0 para importantisimo y 9 para irrelevante, o es un objeto que se serializa (ej. diccionario)
	if (lvl<=LogLvlMax) {
		LibRt.logm(t,lvl,msg+":"+(o ? ser_json(o) : ""),null);
	}
}

logmAndThrow= function (t,lvl,msg,o) {
	logm(t,lvl,msg,o);
	throw({message: msg, data: o});
}

exceptionToString= function (ex) {
	var es= (typeof(ex)=="string" && ex) || (ex.message && (ex.message + (ex.data ? (" "+ser_json(ex.data)) : "")) || ex.getMessage()|| "").replace(/\r?\n/g," ");
	if (ex.stack) { es+= " "+ex.stack.replace(/\r?\n/g," > ");}
	else {
		if (ex.fileName) { es+= " "+ex.fileName;}
		if (ex.lineNumber) { es+= ":"+ex.lineNuber;}
	}
	return es;
}

logmex= function(t,lvl,msg,o,ex) {
	var es= (typeof(ex)=="string" && ex) || (ex.message && (ex.message + (ex.data ? (" "+ser_json(ex.data)) : "")) || ex.getMessage()|| "").replace(/\r?\n/g," ");
	if (ex.stack) { es+= " "+ex.stack.replace(/\r?\n/g," > ");}
	else {
		if (ex.fileName) { es+= " "+ex.fileName;}
		if (ex.lineNumber) { es+= ":"+ex.lineNuber;}
	}
	if ("getScriptStackTrace" in ex) { es+=" "+ex.getScriptStackTrace(); }
	if ("details" in ex) { es+=" "+ex.details(); }
	if ("javaException" in ex) { es+=" "+ex.javaException; }
	logm(t,lvl,msg+" EXCEPTION "+es,o);
}

//*****************************************************************************
//S: encriptar, UNIR con el de librt.web.js que ES IGUAL
encriptarSAFE_simple= function (data,key,esPlano) { try {
	var k= (new Date()).getTime(); GLOBAL.cxEsperando && cxEsperando("db",k);
	var datae= sjcl.encrypt(key || CfgDbKey,esPlano ? data : ser_planoOjson(data));
	GLOBAL.cxListo && cxListo("db",k);
	return datae;
} catch(ex) { logmex("ERR",1,"ENCRIPTAR",{dataLen: (data+"").length, data: data},ex); GLOBAL.cxListo && cxListo("db",k); throw(ex) } }

encriptar_rSAFE_simple= function (data,key) { try {
	var k= (new Date()).getTime(); GLOBAL.cxEsperando && cxEsperando("db",k);
  var r= ser_planoOjson_r(sjcl.decrypt(key || CfgDbKey,data));
	GLOBAL.cxListo && cxListo("db",k);
	return r;
} catch(ex) { logmex("ERR",1,"ENCRIPTAR R",data,ex); GLOBAL.cxListo && cxListo("db",k); throw(ex) } }

encriptarSAFE_javacomp= function (data,key,esPlano,iv) {try{ //U: compatible con encriptar en java
	//VER: fuentes de doEncript y doDecript en https://bitwiseshiftleft.github.io/sjcl/demo/
	var k= (new Date()).getTime(); GLOBAL.cxEsperando && cxEsperando("db",k);

	key= key || CfgDbKey;
	var plaintext= esPlano ? data : ser_planoOjson(data);
	var p= { adata:"", mode:"ccm", ts:64, ks:128, iv: iv || sjcl.random.randomWords(4,0) };
	var json= sjcl.encrypt(key, plaintext, p, {});
	var ciphertext= json.match(/"ct":"([^"]*)"/)[1];
	var ivtext= json.match(/"iv":"([^"]*)"/)[1];
	var datae= ivtext+"_"+ciphertext;
	GLOBAL.cxListo && cxListo("db",k);
	return datae;
} catch(ex) { logmex("ERR",1,"ENCRIPTAR",{dataLen: (data+"").length, data: data},ex); GLOBAL.cxListo && cxListo("db",k); throw(ex) } }

encriptar_rSAFE_javacomp= function (data,key) {try{ //U: compatible con encriptar en java
	//VER: fuentes de doEncript y doDecript en https://bitwiseshiftleft.github.io/sjcl/demo/
	var k= (new Date()).getTime(); GLOBAL.cxEsperando && cxEsperando("db",k);

	key= key || CfgDbKey;
	var sepIdx= data.indexOf("_"); //A: data debe ser ivBase64_ciphertext, y sino, pinchamos sin decir nada porque son datos truchos :)
	var plaintext= data.substr(sepIdx+1);
	var	iv= sjcl.codec.base64.toBits(data.substr(0,sepIdx));
	var ciphertext = sjcl.codec.base64.toBits(plaintext);
	var aes= new sjcl.cipher.aes(key);
	var plaintext= sjcl.codec.utf8String.fromBits(sjcl.mode.ccm.decrypt(aes, ciphertext, iv, "", 64));
  var r= ser_planoOjson_r(plaintext);

	GLOBAL.cxListo && cxListo("db",k);
	return r;
} catch(ex) { logmex("ERR",1,"ENCRIPTAR R",{iv: iv, data: data, plaintext: plaintext},ex); GLOBAL.cxListo && cxListo("db",k); throw(ex) } }

encriptarParseKey_hex_javacomp= function (keyHexStr) { return sjcl.codec.hex.toBits(keyHexStr); }

encriptarParseKey_hex= encriptarParseKey_hex_javacomp;
encriptarSAFE= encriptarSAFE_javacomp;
encriptar_rSAFE= encriptar_rSAFE_javacomp;


if (GLOBAL.rtType=="java") {//A: solo rt_java 

LibRtCrypto= Packages.LibRtCrypto;
encriptarSAFE_javaimpl= function (data,key,esPlano) {
	return LibRtCrypto.encriptarSAFE_plano(esPlano ? data : ser_planoOjson(data),key);
}
encriptarParseKey_hex_javaimpl= function (keyHexStr) { return LibRtCrypto.hexToBytes(keyHexStr); }

encriptarParseKey_hex= encriptarParseKey_hex_javaimpl;
encriptarSAFE= encriptarSAFE_javaimpl;

}

encriptarUNSAFE= function (data,key) { try {
  var datae= ser_planoOjson(data);
  return datae;
} catch(ex) { logmex("ERR",1,"ENCRIPTAR (UNSAFE)",data,ex); throw(ex) } }

encriptar_rUNSAFE= function (data,key) { try {
     return ser_planoOjson_r(data);
} catch(ex) { logmex("ERR",1,"ENCRIPTAR R (UNSAFE)",data,ex); throw(ex) } }

encriptar= this.encriptar || encriptarSAFE;
encriptar_r= this.encriptar_r || encriptar_rSAFE;


//*****************************************************************************
//S: cargar archivos javascript
runtimePath= function () { return LibRt.runtimePath() }
RTLIB=JSLIB=[LibRt.runtimePath()+"/../lib/js",LibRt.runtimePath()+"/lib/js","lib/js","."]; //U: directorios donde buscar XXX:MANTENER EL ALIAS ENTRE RTLIB y JSLIB

var JSLIB_ADD= get_env("RTLIB","");//U: se puede agregar dirs para buscar js con la variable de ambiente JSLIB
if (JSLIB_ADD!="") { JSLIB_ADD.split(":").map(function (e) { JSLIB.push(e); }) }; 
logm("DBG",1,"RT LIB SE BUSCARAN SCRIPTS EN",JSLIB);

load= function(path) { //D: lee un archivo y lo evalua
	var isLoaded= false;
	var evalException= null; //U: si dio una excepcion por error de syntaxis, reportarla
	var tryPath= path;
	try {
		logm("DBG",7,"RT JS LOAD TRYING PATH",{requiredFile: path, path: tryPath, LibRtMyEnv: String(GLOBAL.LibRtMyEnv)});
		isLoaded= (null!= LibRt.jsLoad(path,GLOBAL.LibRtMyEnv||null,ARGV));
	}
	catch (ex) {
		evalException= ex;
		logmex("DBG",7,"RT JS LOAD TRYING PATH",{requiredFile: path, path: path},ex);
		if (ex.javaException instanceof java.io.FileNotFoundException) { //A: no encontro, probar otro path
			if (path.charAt(0)!="/" && path.charAt(0)!=".") { //A: es relativo a rt o lib
				for (var i=0; !isLoaded && i< JSLIB.length; i++) {
					var tryPath= JSLIB[i]+"/"+path;
					logm("DBG",7,"RT JS LOAD TRYING PATH IN JSLIB",{requiredFile: path, path: tryPath, LibRtMyEnv: String(GLOBAL.LibRtMyEnv)});
					try {
						isLoaded= (null!= LibRt.jsLoad(tryPath,GLOBAL.LibRtMyEnv||null,ARGV));
					}
					catch (ex) {
						evalException= ex;
						logmex("DBG",7,"RT JS LOAD TRYING PATH IN JSLIB",{requiredFile: path, path: tryPath},ex);
						if (ex.javaException instanceof java.io.FileNotFoundException) { //A: no encontro, probar otro path
						}
						else { break; } //A: es error de sintaxis o evaluacion, paramos aca
					}
				}
			}
		}
	}

	if (!isLoaded) {
		if (evalException && ! (evalException.javaException instanceof java.io.FileNotFoundException)) {
			logmex("ERR",1,"RT JS LOAD SCRIPT EVAL ERROR",{requiredFile: String(path), JSLIB: JSLIB}, evalException);
			throw(evalException);
		}
		else {
			logmAndThrow("ERR",1,"RT JS LOAD SCRIPT NOT FOUND",{requiredFile: String(path), JSLIB: JSLIB});
		}
	}
	else {
		logm("DBG",7,"RT JS LOAD OK",{requiredFile: path, path: tryPath});
	}
}

require= load;

loadDir= function(path) {
	logm("NFO",2,"RT JS LOADDIR START",{path:path});
	var l;
	for (var i=0; l==null && i<JSLIB.length;i++) {	
		try { l= get_filelist(JSLIB[i]+"/"+path).sort(); }
		catch (ex) {};
	}
	if (l==null) { logmAndThrow("ERR",1,"RT JS LOADDIR NO ENCONTRADO",{path: path, RTLIB: JSLIB}); }
	//A: encontramos el dir
	logm("DBG",2,"RT JS LOADDIR LIST",{path:path, files: l});
	l.map(function (e) { load(path+"/"+e); });
	logm("NFO",2,"RT JS LOADDIR END",{path:path, files: l});
}

//*****************************************************************************
//S: comun para todos
load("lib.js");

//*****************************************************************************
//S: marshalling
toJs = function (o) { //U: aplicar a los valores que vienen de java y pueden ser "boxes"
	if (o != null && o.getClass != null) {
		var c = String(o.getClass().getName());
		
		if (c == "java.lang.Integer" || c == "java.lang.Long" ) {
			return o.longValue() + 0;
		} else if (c == "java.lang.Double" || c == "java.lang.Float" || c == "java.math.BigDecimal") {
			return o.doubleValue() + 0;
		} else if (c == "java.lang.String" || c == "org.mozilla.javascript.ConsString") {
			return String(o);
		} else if (c == "[B") {
			return String(java.lang.String(o));
		} else if (c.indexOf("Set") > -1) {
			return o.toArray();
		} else if (o.hasMoreElements) {
			var r = [];
			while (o.hasMoreElements()) {
				r.push(toJs(o.nextElement()));
			}
			return r;
		}
	} else if (typeof (o) == "string") {
		return String(o);
	} //XXX:rhino17 llama "string" a cosas que no tienen metodo replace :P
	//logm("DBG",9,"TOJS java DFLT",typeof(o))
	return o;
}

//*****************************************************************************
//S: archivos
nameOnly_file= function (path) { return path.match(/[^\/]+$/); }

get_resource= function(path,dflt) { //D: lee una archivo en un string
	return (String(LibRt.get_resource(path))); 
}

get_file= function(path,dflt) { //D: lee una archivo en un string
	return (String(LibRt.get_file(path,false,null,null))); 
}

getBin_file= function(path,dflt) { //D: lee una archivo en un string
	return (LibRt.get_file(path,false,null,null)); 
}

set_file= function(path,str,gzip,digestCalc,encoding) {
	return LibRt.set_file(path,str,gzip!=null,digestCalc || null,encoding||null );
}

get_filelist= function (path,nodirs,nofiles) {
	return LibRt.get_filelist(path,nodirs || false ,nofiles || false).map(function (x) { return String(x);}); //XXX:mejorar tipos de datos
}
keys_file= get_filelist;

get_filelist_newer_int= function (dir,after,regex) {
	var l= parseint_map(get_filelist(dir),regex).sort(function (a,b) { return a[1]-b[1]; });
	var i=0;
	while (i<l.length && l[i][1]<=after){ i++; };	
	return {files: l, newerIdx: i, after: after};
}

//*****************************************************************************
//S: archivos/operaciones
move_file= function(src,dst,wantsOverwrite) {
	if (wantsOverwrite && exists_file(dst)) { delete_file(dst); }
	return java.nio.file.Files.move(java.nio.file.Paths.get(src),java.nio.file.Paths.get(dst));	
}

copy_file= function(src,dst) {
	return java.nio.file.Files.copy(java.nio.file.Paths.get(src),java.nio.file.Paths.get(dst));	
}

exists_file= function(path) {
	var f= new java.io.File(path);
	return f && f.exists() && (f.isDirectory() ? "dir" : "file");
}

ensure_dir= function(path) {
	var parts= path.split(/[\/\\]/);
	logm("DBG",9,"FS DIR PARTES",{parts: parts, de: path});
	for (var i=0; i<parts.length; i++) {
		var partPath= parts.slice(0,i+1).join("/");
		if (exists_file(partPath)!="dir") {
			logm("NFO",5,"FS DIR CREAR PARTE",{parte: partPath, de: path, i: i});
			var f= new java.io.File(partPath);
	 		f.mkdir()
		}
		else {
			logm("DBG",9,"FS DIR EXISTE PARTE",{parte: partPath, de: path, i: i});
		}
	}
	logm("NFO",5,"FS DIR CREAR OK",{parte: partPath, de: path, i: i});
}

delete_file= function(path) {
	return java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(path));	
}

deleteAll_dir= function(path) { //U: borra un directorio recursivamente
	Packages.org.apache.commons.io.FileUtils.deleteDirectory(new java.io.File(path));
}
//*****************************************************************************
//S: archivos/CSV
fold_file_csv=function (file,cb,acc,digestCalc,isGzip) {
	isGzip= isGzip || /\gz(ip)?$/.exec(file) || false;
	var r= LibRt.fileReader(file,isGzip==true,digestCalc||null); //XXX:checksum
	var l= r.readLine();
	while (l) {
		var cols= (String(l)).split("\t");
		logm("DBG",9,"CSV READ ROW COLS",cols);
		var x= cb(cols,acc)
		l= r.readLine();
	}
	r.close();
	return acc;
}
csvEach_file= fold_file_csv; //XXX:deprecate

foldkv_file_csv= function (path,cb,acc,digestCalc,isGzip) {
	var names= null; var row= 0;
	return fold_file_csv(path,function (cols) {
		if (!names) { names= cols.map(function (k) { return k.toLowerCase() }); }
		else { 
			var val = zipkv(names,cols); 
			logm("DBG",9,"CSV ROW VAL",{row: row, val: val});
			acc= cb(val,acc);
			row++;
		}
		return acc;
	},acc,digestCalc,isGzip);
}

//*****************************************************************************
//S: threads y sync
fSync= sync= function (fun) { //A: envuelve fun para que solo entre UN thread simultaneo
	//VER: https://mozilla.github.io/rhino/javadoc/org/mozilla/javascript/Synchronizer.html
	return new Packages.org.mozilla.javascript.Synchronizer(fun); 
}

fRunThread= function (fun) {
	var runnable= new java.lang.Runnable({run: fun});
	var t= new java.lang.Thread(runnable);
	t.start();
	return t;
}

//*****************************************************************************
//S: controlar procesos externos
systemRun= function(cmdArray,nowait) { //D: ejecuta un comando en el shell del sistema
	//XXX:SEC parametros, expansion, etc.
	logm("DBG",1,"SYS EXECUTE",{cmd: cmdArray});
	var p= java.lang.Runtime.getRuntime().exec(cmdArray);
	var r= p; //DFLT devolvemos el process
	if (!nowait) { r= p.waitFor(); } //A: pidio esperar, devolvemos el exit code
	return r;
}

systemRunWithOutput = function(cmdArray) { //D: ejecuta un comando en el shell del sistema
	//XXX:SEC parametros, expansion, etc.
	var p= systemRun(cmdArray,true); //A: pedi el proceso y que NO espere
	r= {};
	r.output= LibRt.get_stream(p.getInputStream());
	r.result= p.waitFor();
	return r;
};

//*****************************************************************************
//S: bases de datos

function dbCxJdbc(cxInfo,forceReconnect) { //D: crea o recupera una conexion a la base de datos
	var props= new java.util.Properties()
	props.put("user",cxInfo.user);
	props.put("password",cxInfo.pass);

	var cx;
	try {
		if (cxInfo.url.match(/:oracle:/)) {
			var x= Packages.oracle.jdbc.driver.OracleDriver;
			props.put("oracle.jdbc.ReadTimeout",60000);
			props.put("oracle.jdbc.READ_TIMEOUT",60000);
			props.put("oracle.net.CONNECT_TIMEOUT",60000);
		} else if (cxInfo.url.match(/:h2:/)) {
			var x= Packages.org.h2.Driver;
		} else if (cxInfo.url.match(/:sqlite:/)) {
			var x= Packages.org.sqlite.JDBC;
		} else if (cxInfo.url.match(/:postgresql:/)) {
			var x= Packages.org.postgresql.Driver;
		}
		//A: cargamos la clase del driver segun al url //XXX:solo las que conocemos

		cx= java.sql.DriverManager.getConnection(cxInfo.url, props);

		if (cxInfo.url.match(/:oracle:/)) {
  		dbExec(cx,"alter session set nls_numeric_characters ='.,'",{});
		}
	}

	catch (ex) {
		logmex("ERR",1,"DB CONECTANDO",cxInfo,ex);
		throw(ex);
	}
	return cx;
}

dbCxPoolDataSource= sync(function (cxInfo,forceReconnect) { //A:sync, solo un thread por vez!
	var ds;
	try {
		ds= LibRt.state.get("DbCxPoolDataSource"); //XXX:MAURICIO:encapsular para que no se vea LibRt y poder cambiar la implementacion cuando queramos
		if (!ds || forceReconnect) { 
			var config = new Packages.com.zaxxer.hikari.HikariConfig();
			config.addDataSourceProperty("cachePrepStmts", "true"); //XXX:hace configurable desde cxInfo, cantidad de cx, etc.
			config.addDataSourceProperty("prepStmtCacheSize", "250");
			config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");

			config.setUsername(cxInfo.user);
			config.setPassword(cxInfo.pass);

			if (cxInfo.url.match(/:oracle:/)) { //XXX:generalizar con el de dbCx
				var x= Packages.oracle.jdbc.driver.OracleDriver;
				//props.put("oracle.jdbc.ReadTimeout",60000);
				//props.put("oracle.jdbc.READ_TIMEOUT",60000);
				//props.put("oracle.net.CONNECT_TIMEOUT",60000);
			} else if (cxInfo.url.match(/:h2:/)) {
				var x= Packages.org.h2.Driver;
			} else if (cxInfo.url.match(/:sqlite:/)) {
				var x= Packages.org.sqlite.JDBC;
			} else if (cxInfo.url.match(/:postgresql:/)) {
				var x= Packages.org.postgresql.Driver;
			}
			//A: cargamos la clase del driver segun al url //XXX:solo las que conocemos
			config.setJdbcUrl(cxInfo.url);
			ds= new Packages.com.zaxxer.hikari.HikariDataSource(config);
			LibRt.state.put("DbCxPoolDataSource",ds);
		}
	}
	catch (ex) {
		logmex("ERR",1,"DB DATASOURCE",cxInfo,ex);
		throw(ex);
	}
	logm("DBG",7,"DB DATASOURCE",{cxInfo: cxInfo, ds: ds!=null});
	return ds;
});

dbCxPool= function (cxInfo,forceReconnect) { //D: crea o recupera una conexion a la base de datos
	//VER: https://github.com/brettwooldridge/HikariCP
	var cx= null; //A: DFLT, no conseguimos
	try {
		cx= dbCxPoolDataSource(cxInfo,forceReconnect).getConnection();
	}
	catch (ex) {
		logmex("ERR",1,"DB CONECTANDO",cxInfo,ex);
		throw(ex);
	}
	logm("DBG",7,"DB dbCxPool",{cxInfo: cxInfo, cx: cx!=null});
	return cx;
}

dbCx= dbCxPool;

function dbParse(sql) { //D: parsea WHERE ?miparam1:String='pepe' AND ?miparam2>5 para dbExec
	var re=/\$([a-zA-Z0-9_]*)(?::([a-zA-Z]*))?/g
	var names=[]; var types={};
	//logm("DBG",1,"XXX",typeof(sql));
	var sqlSinComments= delete_marked_str(sql,"/*","*/"); //A: borramos los comentarios
	var sqlclean= sqlSinComments.replace(/;\s*$/,"").replace(/\r?\n/g," "); //XXX:manejar para distintos drivers
	
	var sqlstd= sqlclean.replace(re,function (exprParametro,nx,t) { 
		var reemplazo= "?"; //DFLT
		var n= nx.toLowerCase(); 
		var tipo= types[n] || { nombre: t, loPuedeManejarElDriver: true};  //DFLT //U: el tipo del parametro
		//XXX:HERNAN podriamos agregar un caso para los dates
		if (t=="SqlListaDeNumeros") { //A: caso especial, hay que GENERAR sql
			reemplazo= exprParametro;
			tipo.loPuedeManejarElDriver= false;
		}
		else if (t=="SqlListaDeStrings") {//A: caso especial, hay que GENERAR sql
			reemplazo= exprParametro;
			tipo.loPuedeManejarElDriver= false;
		} 
		else if (t=="blob") {
			tipo.nombre = "blob";
			tipo.loPuedeManejarElDriver = true;
		} else if (t == "likeString") { //A: like "'%MIVALOR%'"
			reemplazo= exprParametro;
			tipo.loPuedeManejarElDriver= false;	
		}
		else { //A: caso estandard, la funcion de parametros del driver nos sirve
		}
		names.push(n); 
		types[n]= tipo; 
		return reemplazo;
	});	
	return { sql: sql, sqlstd: sqlstd, names: names, types: types};
}

dbExecSqlParaDriver= function(cx,dbs,paramsKvNorm) { //U: devuelve el sql que el driver entiende despues de aplicar nuestras mejoras, ej. generar lista de numeros para un where xxx in ...
	//U: recibe CX para poder averiguar el tipo de conexion (Oracle, Postgress, etc.) y generar el sql correspondiente
	var sqlParaDriver= dbs.sqlstd; //DFLT
	for (var i=0; i<dbs.names.length; i++) { 
		var esteNombre= dbs.names[i];
		var esteTipo= dbs.types[esteNombre];
		logm("DBG",9,"dbExecSqlParaDriver",{dbs: dbs, idx: i, esteNombre: esteNombre, esteTipo: esteTipo});
		if (esteTipo.nombre=="SqlListaDeNumeros") { //A: requiere modificar el sql
			var valor= paramsKvNorm[esteNombre]; //XXX: considerar que sea nulo, poner un cartelito de log lindo para no debugguear mil horas si nos pasa
			var sqlDeReemplazo= valor.join(",");
			sqlParaDriver= sqlParaDriver.replace(new RegExp("\\$"+esteNombre+":"+esteTipo.nombre,"gi"),sqlDeReemplazo);
		} else if (esteTipo.nombre=="likeString") {
			var valor= paramsKvNorm[esteNombre];
			var sqlDeReemplazo= ("'%VALOR%'").replace('VALOR',valor);
			sqlParaDriver = sqlParaDriver.replace(new RegExp("\\$"+esteNombre+":"+esteTipo.nombre,"gi"),sqlDeReemplazo);
		}
	}
	logm("DBG",8,"dbExecSqlParaDriver FIN",{dbs: dbs, idx: i, esteNombre: esteNombre, esteTipo: esteTipo, sqlParaDriver: sqlParaDriver});
	return sqlParaDriver;
}

function dbExecImpl(cx,sql,paramsKv) { //D: NO USAR, comun a las publicas
	var dbs= dbParse(sql);
	logm("DBG",7,"DB EXEC 0",{dbs: dbs, params: paramsKv});
	try {

		var paramsKvNorm= fold(paramsKv,function (v,k,acc) { acc[k.toLowerCase()]= v; return acc; },{}); //A: todos los parametros tienen nombre en minuscula
		var sqlParaDriver= dbExecSqlParaDriver(cx,dbs,paramsKvNorm);
		//A: el sql que tengo se lo puedo enviar al driver

		var DANGER_SQL_SOLO_PARA_DEBUG= sqlParaDriver;
		//A: voy a armar uno con parametros instanciados para LOGUEAR (NUNCA PARA EJECUTAR!)

		var stmt= cx.prepareStatement(sqlParaDriver);
		var paramIdx=1; //A: los que efectivamente pasamos con "set*", no contamos las expresiones que generaron sql. JDBC empieza de 1
		for (var i=0; i<dbs.names.length; i++) {try{ 
			var esteNombre= dbs.names[i];
			var esteTipo= dbs.types[esteNombre];
			if (esteTipo.nombre == "blob") {
				logm("DBG", 9, "DB TIPO BLOB", { nombre : esteNombre, tipo: esteTipo});
				var str = paramsKvNorm[esteNombre];
				var src = enc_base64_r(str);
				stmt.setBytes(paramIdx, src); paramIdx++;
			} else if (esteTipo.loPuedeManejarElDriver) {
				var v= paramsKvNorm[esteNombre]; //DFLT
				if (v) { //A: no es null
					var x= parseFloat(v); //A: si podemos lo concertimos a numero, despues setObject se ocupa
					if (!isNaN(x) && (x+"")==v) { v= x; } //A: lo pudimos convertir y NO cambio (sino se rompe ej. 002 como prefijo, que se convierte incorrectamente en 2)
				}
				if (v!=null && esteTipo.nombre && esteTipo.nombre!=typeof(v)) { //A: pidieron un tipo y no es el de v
					logm("WRN", 5, "DB TIPO INCORRECTO", { nombre : esteNombre, tipoDeseado: esteTipo, tipoRecibido: typeof(v), valor: v});
				}
				stmt.setObject(paramIdx,v); paramIdx++; //XXX:asegurarse que llega el tipo correcto a JDBC
				DANGER_SQL_SOLO_PARA_DEBUG= DANGER_SQL_SOLO_PARA_DEBUG.replace('?',"'"+v+"'");
			}
		}catch(ex1){logmex("ERR",1,"DB EXEC 1 ARG",{nombre: esteNombre, tipo: esteTipo, valor: v, idx: i+1, sql: sqlParaDriver, sqlDbg: DANGER_SQL_SOLO_PARA_DEBUG },ex1);throw(ex1)}}
		stmt.execute();
		logm("DBG",7,"DB EXEC 1",{executed: "OK", sqlDbg: DANGER_SQL_SOLO_PARA_DEBUG, sqlParaDriver: sqlParaDriver, dbs: dbs, params:paramsKv});
	}
	catch(ex2){logmex("ERR",2,"DB EXEC 1",{executed: "FAIL", sqlParaDriver: sqlParaDriver, dbs: dbs, params: paramsKv},ex2); throw(ex2); }
	return stmt;
}	

function dbExec(cx,sql,paramsKv) { //D: ejecuta actuliazacion, devuelve nro filas actualizadas o -1
	var r= -1;
	var stmt= dbExecImpl(cx,sql,paramsKv);
	if (stmt) {
		r= stmt.getUpdateCount();
		stmt.close();	
	}
	return r;
}

dbQuery= function (cx,sql,paramsKv) { //D: ejecuta una consulta, devuelve el resulset o null
	var r;
	var stmt= dbExecImpl(cx,sql,paramsKv);
	if (stmt) {
		r= stmt.getResultSet();
	}
	return r;
}

dbColumnNames= function (rs) {
	return LibRt.dbRsColumnNames(rs);
}

dbNextRowArray= function (rs,cols) {
	var d;
	cols= cols || LibRt.dbRsColumnNames(rs);
	if (rs.next()) {
		d= [];
		for (var i=0; i<cols.length; i++) { d[i]= toJs(rs.getObject(i+1)); }
		logm("DBG",9,"DB RS ROW dbNextRowArray",{d:d, cols: cols});
	}
	else {
		logm("DBG",9,"DB RS ROW EMPTY dbNextRowArray",{d:d, cols: cols});
	}
	return d;
}


dbNextRowKv= function (rs,cols) {
	var d;
	cols= cols || LibRt.dbRsColumnNames(rs);
	if (rs.next()) {
		d= {};
		for (var i=0; i<cols.length; i++) { d[cols[i]]= toJs(rs.getObject(i+1)); }
		logm("DBG",9,"DB RS ROW dbNextRowKv",{d:d, cols: cols});
	}
	else {
		logm("DBG",9,"DB RS ROW EMPTY dbNextRowKv",{d:d, cols: cols});
	}
	return d;
}

function dbQueryOne(cx,sql,paramsKv,dflt) {
	var r= dflt;
	var rs= dbQuery(cx,sql,paramsKv);
	if (rs.next()) { r= toJs(rs.getObject(1)); }
	rs.close();
	return r;
}

function dbQueryFirstKv(cx,sql,paramsKv,dflt) {
	var rs= dbQuery(cx,sql,paramsKv);
	var r= (rs && dbNextRowKv(rs)) || dflt;
	rs.close();
	return r;
}

dbRowsForSql= function (sql,params) { //U: devuelve un array de arrays, uno para cada fila
	var rs= dbQuery(cx(),sql,params); var acc= [];
	while (d= dbNextRowArray(rs)) { acc.push(d); }
	return acc;
}

dbRowsForQuery= function (query,params,cfgReprDb) { //U: devuelve un array de arrays, uno para cada fila
	var sql= reprDbSqlFor(query,cfgReprDb);
	return dbRowsForSql(sql,params);
}

dbKvOfKvForQuery= function (q,keyCol,params) {
  var sql = reprDbSqlFor(q, CfgReprDbMap);
  var rs = dbQuery(cx(), sql,params);
  var acc = {};
  while (d = dbNextRowKv(rs)) { acc[d[keyCol]] = d; } //XXX:GEN:dict->ID->kv fila
  return acc;
}

dbKvOfValForQuery= function (q,keyCol,valCol,params) {
  var sql = reprDbSqlFor(q, CfgReprDbMap);
  var rs = dbQuery(cx(), sql,params);
  var acc = {};
  while (d = dbNextRowKv(rs)) { acc[d[keyCol]] = d[valCol]; } //XXX:GEN:dict->ID->valor
  return acc;
}

dbKvOfArrForQuery= function (q,keyCol,params) { 
	//XXX:GENERALIZAR:en todas se trata de averiguar las cols al principio, leer arrays, elegir algunos elementos Y seria suficiente que este coordinado entre cliente y servidor (generado) para usar cualquiera
  var sql = reprDbSqlFor(q, CfgReprDbMap);
  var rs = dbQuery(cx(), sql,params);
  var acc = {};
	var d;
  while (d = dbNextRowArray(rs)) { acc[d[keyCol]] = d.slice(0,keyCol).concat(d.slice(keyCol+1)); } //XXX:GEN:dict->ID->Array
  return acc;
}

dbKvOfGroupForQuery= function (q,keyCol,params) { 
  var sql = reprDbSqlFor(q, CfgReprDbMap);
  var rs = dbQuery(cx(), sql,params);
	var r= {};
	var d;
	while (d = dbNextRowKv(rs)) {
		var key= d[keyCol];
		if(!r[key]) { r[key] = []; }
		r[key].push(d);
	}

	return r;
};

dbKvOfGroupArrForQuery= function (q,keyCol,params) { 
  var sql = reprDbSqlFor(q, CfgReprDbMap);
  var rs = dbQuery(cx(), sql,params);
	var r= {};
	var d;
	while (d = dbNextRowArray(rs)) {
		var key= d[keyCol];
		if(!r[key]) { r[key] = []; }
		r[key].push(d.slice(0,keyCol).concat(d.slice(keyCol+1)));
	}

	return r;
};

dbKvOfGroupPushForQuery= function (q,keyCol,params) { 
  var sql = reprDbSqlFor(q, CfgReprDbMap);
  var rs = dbQuery(cx(), sql,params);
	var r= {};
	var d;
	while (d = dbNextRowArray(rs)) {
		var key= d[keyCol];
		if(!r[key]) { r[key] = []; }
		fold(d,function (e,i) { i!=keyCol && r[key].push(e) });
	}
	return r;
};



//SEE: http://www.tutorialspoint.com/jdbc/jdbc-transactions.htm
function dbTxAutoCommit(cx,wantsActive) {
	cx.setAutoCommit(wantsActive);
}

function dbTxRollback(cx,savepoint) {
	cx.rollback();
}

function dbTxCommit(cx) {
	cx.commit();
}

dbSampleTables= function (cx,pfx,tableNames) { //U: conseguir una muestra de tablas con su nombre
	cx= cx || dbCx(CfgCx);
	for (var i=0; i<tableNames.length; i++) { try { var tableName= tableNames[i];
		var rs= dbQuery(cx,"SELECT * from "+tableName+" WHERE ROWNUM<10");
		cnt= LibRt.serRsCsvToFile(rs,null,pfx+tableName+".dat",-1,"\t");

		cnt= dbQueryOne(cx,"SELECT count(*) cnt from "+tableName);
		set_file(pfx+tableName+".cnt",cnt);	
	} catch (ex) { set_file(pfx+tableName+".err",ex.message);	
		logmex("ERR",1,"DB SAMPLE TABLES",{ tableName: tableName, idx: i},ex);
	} }
}

//*****************************************************************************
//S: http / servlet
webRequestPath= function (webRequest) {
	return toJs(webRequest.getRequestURI())
}

webRequestParam= function (webRequest,k) {
	var p= toJs(webRequest.getParameter(k));
	return p;
}

webRequestParams= function (webRequest) {
	var cmdSrc= webRequest.getParameterMap();
	var cmd= kvfirstMap(cmdSrc);
	logm("NFO",1,"WEB REQUEST PARAMS",{ cmdSrc: cmdSrc, cmd: cmd});
	return cmd;
}

webRequestData= function (webRequest) {
	var s= toJs(LibRt.get_stream(new java.io.BufferedReader( new java.io.InputStreamReader( webRequest.getInputStream()))));
	logm("DBG",9,"WEB REQUEST DATA",s);
	return s;
}

webRequestHeaders= function (webRequest) {
	var n= webRequest.getHeaderNames();
	var hdr= fold(toJs(n),function (n,i,acc) { acc[n]= toJs(webRequest.getHeader(n)); return acc; },{});
	return hdr;
}

webRequestAddr= function (webRequest) {
	return String(webRequest.getRemoteAddr());
}

webResponseWrite= function (webResponse,str) {
	webResponse.getWriter().write(str);
}

//*****************************************************************************
//S: scripts
contador_file= function (path,value,wantsSet) { //D: contador persistene en un archivo
	var cnt= parseInt(get_file(path)||0);
	logm("DBG",1,"COUNTER",{cnt: cnt, path: path,wantsSet: wantsSet,valueOrDelta: value});
	if (value!=0 || wantsSet) {
		set_file(path,wantsSet ? (value||0) : (cnt+value));
	}
	return cnt;
}


//*****************************************************************************
//S: desktop
open_browser_desktop= function (url) { //U: intenta abrir un browser en la url recibida como param
  if(java.awt.Desktop.isDesktopSupported()) {
    java.awt.Desktop.getDesktop().browse(new java.net.URI(url));
    return true;
  }
  return false;
}

