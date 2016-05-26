function ensure_var(k,v,scope) { //D: ensure k exists in scope initializing with "v" if it didn't
	scope= scope || GLOBAL;
	if (!(k in scope)) { scope[k]= v; } return scope[k];
}
ensureInit= ensure_var; //D: deprecamos el nombre VIEJO, dejamos este alias hasta que lo eliminemos

//*****************************************************************************
//S: comunes
ahora= function () { return new Date(); }
timestamp= function (aDate) { aDate= aDate || ahora(); return aDate.toJSON().replace(/[^a-z0-9]*/gi,"").substr(0,15); }

//*****************************************************************************
//S: log
logmAndThrow= function (t,lvl,msg,o) {
	logm(t,lvl,msg,o);
	throw(ser({message: msg, data: o}));
}

logmex= function(t,lvl,msg,o,ex) {
	var es= (typeof(ex)=="string" && ex) || (ex.message && (ex.message + (ex.data ? (" "+ser_json(ex.data)) : "")) || ex.getMessage()|| "").replace(/\r?\n/g," ");
	if (ex.stack) { es+= " "+ex.stack.replace(/\r?\n/g," > ");}
	else {
		if (ex.fileName) { es+= " "+ex.fileName;}
		if (ex.lineNumber) { es+= ":"+ex.lineNuber;}
	}
	logm(t,lvl,msg+" EXCEPTION "+es,o);
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

fArgsCopy= function(a,idxMin,dst) { //U: copiar "arguments" a un array, USAR esta separada en una linea asi la podemos reemplazar por una macro porque v8 NO optimiza las funciones que hacen cosas raras con arguments :P
	var r= Array.prototype.slice.call(a,idxMin||0);
	return dst ? dst.concat(r) : r;
}

//******************************************************************************
//S: algoritmos/kv
set_kPathV= function (kv,kPath,v,idx_) { //U: [a,b,c] -> { a: { b: { c: v } } }, crea lo que sea necesario
	kv= kv || {}; idx_= idx_||0;
	var k0= kPath[idx_]; //A: el proximo elemento del path	
	kv[k0]= kPath.length>(idx_+1) ? set_kPathV(kv[k0],kPath,v,idx_+1) : v;
	return kv;
}

ensure_kPath= function (kv,kPath,idx_) { //U: [a,b,c] -> { a: { b: { c: {} } } }, crea lo que sea necesario pero no pisa lo que existe
	kv= kv || {}; idx_= idx_||0;
	var k0= kPath[idx_]; //A: el proximo elemento del path
	kv[k0]= kv[k0]||{};
	return kPath.length>(idx_+1) ? ensure_kPath(kv[k0],kPath,idx_+1) : kv[k0] ;
}

//XXX:YAMI mover a lib.js desde aca
isEmpty_kv= function (obj) { //U: verdadero si un KV es nulo o esta vacio
    if(obj!=null){ return Object.keys(obj).length === 0; }
		else{ return true;}
}


get_kv= function (kv,k,dflt) { return (kv!=null && typeof(kv)=="object" && (k in kv)) ? kv[k] : dflt; } //U: como o[k] PERO no devuelve dflt si o es null, o no tiene k, o no es un objeto o...

//******************************************************************************
//S: algoritmos/componer funciones
fVarArgs= function (idx,f) { return function () { var args= fArgsCopy(arguments); args[idx]= args.splice(idx); return f.apply(this,args); } }; //U: devuelve una funcion que llama a f con los idx primeros argumentos y el resto en un array

fRunDelayO= fVarArgs(3,function (dt,that,f,args) { return setTimeout(function() { f.apply(that,args); },dt); }); //U: una forma mas copada de decir que una funcion se pude ejecutar en unos milisegundos
fRunDelay= fVarArgs(2,function (dt,f,args) { return setTimeout(function() { f.apply(this,args); },dt); }); //U: una forma mas copada de decir que una funcion se pude ejecutar en unos milisegundos

for (var i=0;i<10;i++) { GLOBAL["fArg_"+i]={"fArg_":i} };
fArg_here= {"fArg_": "here"}
fArg_array= {"fArg_": "argsArray"}
//U: hay variables para poder escribir fArg_1 o fArg_array en funciones que manipulan argumentos

fBind= fVarArgs(1,function (f,idxAndVals) {  //U: devuelve una funcion que puede tener fijos algunos argumentos y cambiar de orden otros, ej. si definis miFunB= fBind(miFunX,"constante",fArg_2,unaVarLocal,fArg_array,fArg_1,fArg_here) y llamas miFunB("a","b","c","d") es lo mismo que miFunX("constante","c",unaVarLocal,["a","b","c","d"],"b","a","b","c","d"); Las variables que pasas a fBind quedan capturadas en la funcion definida.
		return function () { 
			var args= []; 
			for (var i=0; i<idxAndVals.length;i++) { var x= idxAndVals[i];
				var idx= get_kv(x,"fArg_");
				if (idx=="here") { args= fArgsCopy(arguments,0,args); }
				else { args.push(idx=="argsArray" ? fArgsCopy(arguments) : idx!=null ? arguments[idx] : x); }
			}; 
			return f.apply(null,args);
		};
});

//*****************************************************************************
//S: serializacion
ser_json= function (o,wantsPretty) {
	var s;
	if (o!=null) {
		try { s= JSON.stringify(o,null,wantsPretty ? 2 : null); }
		catch (ex) { s=new String(o); }
	}
	else {
		s="null";
	}
	return s;
}

ser_json_r= function (s) {
	try { return JSON.parse(s); }
	catch (ex) { logmex("ERR",5,"SER PARSE JSON",s,ex); throw(ex); }
}

ser= ser_json; //DFLT

ser_planoOproto= function (ox,serFun,wantsPretty) { //U: para NO encodear strings, usa el primer caracter para distinguir
	var o= toJs(ox)
	return ((typeof(o)=="string") ? ("\t"+o) : (" "+serFun(o,wantsPretty)));
}

ser_planoOproto_r= function (s,serFun_r) {
	return (s && s.length>0) ? 
		s.charAt(0)=="\t" ? s.substr(1) : serFun_r(s.substr(1)) :
		null;
}

ser_planoOjson= function (o, wantsPretty) { return ser_planoOproto(o,ser_json,wantsPretty); }
ser_planoOjson_r= function (s) { return ser_planoOproto_r(s,ser_json_r); }

escape_html= function (str) { //U: encodea todos los carateres peligrosos en html para que no se rompa lo que se ve
  return str!=null ? str.replace(/[^A-Za-z0-9-_]/g,function (char) { return "&#"+char.charCodeAt(0)+";" }) : "";
}


//*****************************************************************************
//S: algoritmos / funciones utiles
truncate= function (num,decs) { var x= Math.pow(10,decs); return Math.floor(num*x)/x; }
promedio= function (v0,v1) { return v0+(v1-v0)/2; }
clonar= function (o,ext) { var r= {}; for (var k in o) { r[k]= o[k] }; for (var k in ext) { r[k]= ext[k] }; return r; }

cbMostrarResultado= function() { //U: callback generico que muestra el resultado y lo guarda en la variable global x
	var r= fArgsCopy(arguments);
  if (console && console.log) { console.log(ser_json(r,true)); }
	else if (print) { print(ser_json(r,true));}
	else { logm("DBG",1,"RESULTADO",r); }
  x = r;
}

//*****************************************************************************
//S: algoritmos / hashes
hash_string= function (s) { //U: devuelve un hash "bastante" UNICO para un string
	var bitArray = sjcl.hash.sha256.hash(s);  
	var digest_sha256 = sjcl.codec.hex.fromBits(bitArray); 
	return digest_sha256;
}

hash= function (o) { //U: devuelve un hash "bastante" UNICO para cualquier objeto
	return hash_string(ser_json(o));
}

//*****************************************************************************
//S: algoritmos / strings
splitForCapitalLetters= function (string) {
  if (string.length) { string = string.split(/(?=[A-Z])/); }
  return string;
}

String.prototype.splitForCapitalLetters= function () { return splitForCapitalLetters[this]; }

length_str_bytes= function (str) {//U: returns the byte length of an utf8 string
  var s = str.length;
  for (var i=str.length-1; i>=0; i--) {
    var code = str.charCodeAt(i);
    if (code > 0x7f && code <= 0x7ff) s++;
    else if (code > 0x7ff && code <= 0xffff) s+=2;
    if (code >= 0xDC00 && code <= 0xDFFF) i--; //trail surrogate
  }
  return s;
}
 
//*****************************************************************************
//S: algoritmos / numeros y azar
random_int= function (max) { return Math.floor(Math.random()*(max||10)); } //U: un entero al azar entre 0 y max

//*****************************************************************************
//S: algoritmos / ordenar listas y claves
ordenadaPorPropiedadNumerica= function (lista,propiedad) {
	return lista.sort(function (a,b) { return a[propiedad]-b[propiedad]; })
}

clavesOrdenadasPorPropiedadNumerica= function (kv,propiedad) {
	return Object.keys(kv).sort(function (a,b) { return kv[a][propiedad]-kv[b][propiedad]; })
}


//*****************************************************************************
//S: algoritmos / comparar
cmp= function (a,b) { return (a||" ")==(b||" ") ? 0 : (a||" ") > (b||" ") ? 1 : -1 }; //U: se puede pasar como parametro a sort para ordenar numeros o strings


diff= function(v1, v2, quiereCompararMetodos, clavesParaIgnorar,pfx, err) { //U: compara dos valores cuales quiera y devuelve null si son iguales o un array de diferencias
    pfx= pfx || "";
    err= err || [];
    var t1= typeof(v1);
    var t2= typeof(v2);
    if (t1!=t2) {
        if ((v1!=null && t1!="undefined" && v2!=null && t2!="undefined") && ((t1!="function" && t2!="function") || quiereCompararMetodos)) { //A: ninguno es metodo O hay al menos un valor O quiere comprar metodos
            err.push([pfx,"los tipos difieren",t1,t2,v1,v2])
        }
    }
    else if (typeof(v1)=="object" && v1 && v2) {
        for (var k in v1) {
						if (k && (!clavesParaIgnorar || clavesParaIgnorar.indexOf(k)==-1)) {
	            diff(v1[k],v2[k],quiereCompararMetodos,clavesParaIgnorar,pfx+"/"+k,err)
						}
        }
        for (var k in v2) {
					if (k && (!clavesParaIgnorar || clavesParaIgnorar.indexOf(k)==-1)) {
            if(!v1[k] && v2[k]){ err.push([pfx, "la clave no existe en el primer objeto",k]); }
					}
        }
    }
    else {
        if (v1+""!=v2+"") {
            if ((t1!="function" && t2!="function") || (v1!=null && v2!=null) || quiereCompararMetodos) { //A: ninguno es metodo O quiere comprar metodos
                err.push([pfx,"los valores difieren",v1,v2]);
            }
        }
    }
    return err.length ? err : null;
}


//*****************************************************************************
//S: algoritmos / lista de strings -> a lista de partes o ints
regex_map= function (l,regex) { //U: aplicar una regex a todos los elementos de una lista
	return l.map(function (e) {
		var m= e.match(regex);
		return [e].concat(m);
	});
}

parseint_map= function (l,regex) { //U: aplicar parseint a la captura de una regex sobre todos los elementos de una lista
	regex= regex || /(\d+)/;
	var r= [];
	for (var i=0; i<l.length; i++) {
		var e= l[i];
		var m= e.match(regex);
		if (m) {
			var n= parseInt(m[1]);
			r.push([e,n]);
		}
	}	
	return r;
}

//*****************************************************************************
//S: algoritmos / aplicar una funcion a todos los elementos de un conjunto
fold= function (o,f,acc) {
	if (o!=null) {
		if (o.getClass) {
			var c= new String(o.getClass());
			if (c.indexOf("Map")>-1) {
				var ks= toJs(o.keySet());
				for (var i in ks) { acc= f(o.get(ks[i]),ks[i],acc); }
			}
		}
		else if (Array.isArray(o)) {
			for (var i=0; i<o.length; i++) { acc= f(o[i],i,acc); }
		}
		else if (typeof(o)=="object") { 
			for (var k in o) { acc= f(o[k],k,acc); }
		}
	}
	return acc;
}

foldIfKeyMatch= function (col, regex, cb, acc) {
	return fold(col,function (v,k,acc) { return k.match(regex) ? cb(v,k,acc) : acc });
}

kvfirst= function (v,k,acc) { logm("DBG",9,"KV FIRST",{k: k, v: v}); acc[k]= v && v[0] ; return acc; };
kvfirstMap= function (o,acc) { return fold(o,kvfirst,acc ||{}); }

//*****************************************************************************
//S: construir claveXvalor a partir de listas
zipkv= function (lOfK,lOfV,acc) {
	return fold(lOfK,function (v,k,acc) { acc[v]= lOfV[k]; return acc; },acc ||{});
}

arrayToKv= function (a,pfx) {
	pfx= pfx || "col";
	var r= {};
	for (var j=0; j<a.length; j++) { r[pfx+(j+1)]= a[j]; };
	return r;
}


//*****************************************************************************
//S: algoritmos / nombres de archivos
seguro_str= function (s,caracterEscapeAntes,caracterEscapeDespues,caracteresPermitidos) {
	caracterEscapeAntes= caracterEscapeAntes || "_"; //A: seguro en nombres de archivo widows y linux
	caracterEscapeDespues= caracterEscapeDespues || caracterEscapeAntes;
	caracteresPermitidos= caracteresPermitidos || "a-zA-Z0-9"; //A: seguro en nombres de archivo widows y linux
	return (s+"").replace(new RegExp("[^"+caracteresPermitidos+"]","g"),function (m) { return caracterEscapeAntes+m.charCodeAt(0).toString(16)+caracterEscapeDespues; })
}

seguro_str_r= function (s,caracterEscapeAntes,caracterEscapeDespues) {
	caracterEscapeAntes= caracterEscapeAntes || "_";
	caracterEscapeDespues= caracterEscapeDespues || caracterEscapeAntes;
	return s.replace(new RegExp(caracterEscapeAntes+"([0-9a-fA-F]+)"+caracterEscapeDespues,"g"),function (m,h) { return String.fromCharCode(parseInt(h,16)); });
}

seguro_fname= seguro_str;
seguro_fname_r= seguro_str_r;

seguro_fpath= function (s) { return seguro_str(s,null,null,"a-zA-Z0-9/").replace(/^\//,""); }
seguro_fpath_r= seguro_str_r;

//*****************************************************************************
//S: algoritmos / strings y plantillas
escape_regexp_str= function (str) { //U: devuelve la RegExp equivalente al literal str, ej. para construir expresiones regulares mezclando literales recibidos como parametro
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"); //VER: http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
}

delete_marked_str= function (s,markStart,markEnd) {
	return s.replace(new RegExp(escape_regexp_str(markStart)+"[^]*?"+escape_regexp_str(markEnd),"g"),"");
}

//*****************************************************************************
//S: wrappers
funcionComoA= function(funcionQueDevuelveResultado,noQuiereCopiaArgs) { //D: envuelve una funcion sincrona en una asincrona, ej. para hacerla compatible con una api asincrona
	return function () { try {
			var args= fArgsCopy(arguments);
			var cb= args.pop(); //D: CONVENCION! el callback va al final
			var r= funcionQueDevuelveResultado.apply(this,args);
			noQuiereCopiaArgs ? cb(r) : cb(r,null,args);
		} catch (ex) { cb(null,ex,args); }
	}
}
fAsAsync= funcionComoA;

//*****************************************************************************
//S: algoritmos / cache / ultimoUso
limpiar_cache_recienUsados= function (cache) {
	var claves= Object.keys(cache.elementoYuso)
	var elementosAntesCnt= claves.length;
	var cuantosHayQueBorrar= elementosAntesCnt - cache.cntMax;
	if (cuantosHayQueBorrar>0 || (cache.szMax && cache.szUsada>cache.szMax)) {
		claves= clavesOrdenadasPorPropiedadNumerica(cache.elementoYuso,"cuandoUso");
		for (var i=0; (i<cuantosHayQueBorrar || (cache.szMax && cache.szUsada>cache.szMax)) && i<claves.length; i++) {
			var k= claves[i]
			var e= cache.elementoYuso[k];
			if (e) { cache.szUsada-= e.sz; }
			delete(cache.elementoYuso[k]);
		}
	}
	logm("DBG",8,"CACHE LIMPIAR",{ cnt: claves.length, cntMax: cache.cntMax, borrados: i>0 ? claves.slice(0,i) : "NINGUNO" });
}

sea_cache_recienUsados= function (cache,k,v,sz,quiereLimpiarDespues) {
	var sz= typeof(v)=="string" ? v.length : sz || 0; //A: OJO! solo podemos contar el tamaño de strings
	var r= { cuandoUso: ahora(), valor: v, sz: sz};
	borrar_cache_recienUsados(cache,k); //A: descontamos el que vamos a reemplazar si estaba
	cache.szUsada+= sz; //A: YA cuento el tamaño, por si tengo que borrar para no pasarme de tamaño total
	if (!quiereLimpiarDespues) { limpiar_cache_recienUsados(cache); } //A: hice lugar si necesitaba
	cache.elementoYuso[k]= r;	//A: ahora agrego el elemento
	return v;
}

de_cache_recienUsados= function (cache,k) {
	var r= cache.elementoYuso[k];
	if (r) { 
		r.cuandoUso= ahora(); 
		return r.valor;
	}
}

borrar_cache_recienUsados= function (cache,k) {
	try { 
			var e= cache.elementoYuso[k];
			if (e) {
				cache.szUsada-= e.sz;
				delete(cache.elementoYuso[k]);
			}
	}
	catch (ex) {}; //A: si no estaba, no pasa nada	
}

borrarTodo_cache_recienUsados= function (cache) {
	cache.elementoYuso= {};
	cache.szUsada= 0;
}

nuevo_cache_recienUsados= function (nombre,cntMax,szMax) {
	var r= { nombre: nombre, cntMax: cntMax, szMax: szMax, szUsada: 0, elementoYuso: {}};
	for (var k in CacheApi_recienUsados) { r[k]= CacheApi_recienUsados[k] }
	return r;
}

CacheApi_recienUsados= {
	nuevo: nuevo_cache_recienUsados,
	de: de_cache_recienUsados,
	de_a: funcionComoA(de_cache_recienUsados,true),
 	sea: sea_cache_recienUsados,
	limpiar: limpiar_cache_recienUsados,
	borrar: borrar_cache_recienUsados,
	borrarTodo: borrarTodo_cache_recienUsados,
};

//*****************************************************************************
//S: algoritmos / cache / archivos 
nuevo_cache_archivos= function (nombre, path) {
	ensure_dir(path);
	r= { nombre: nombre, path: path, dirsOk: {} }
	for (var k in CacheApi_archivos) { r[k]= CacheApi_archivos[k] }
	return r;
}

limpiar_cache_archivos= function (cache) {
	//XXX:TODO

}

sea_cache_archivos= function (cache,k,v,sz,quiereLimpiarDespues) {
	var ps= seguro_fpath(k);
	var p= ps.replace(/[^\/]*$/,"");
	if (!cache.dirsOk[p]) { ensure_dir(cache.path+"/"+p); cache.dirsOk[p]= 1; }
	set_file(cache.path+"/"+ps,ser_planoOjson(v));
	return v;
}

//XXX:GASTON: CREAR INVALIDAR FILE CON *
borrar_cache_archivos= function(cache,k) {
	var fname= cache.path+"/"+seguro_fpath(k);
	logm("NFO", 5, "CACHE ARCHIVOS BORRAR", {k: k, fname: fname});
  delete_file(fname);
};

de_cache_archivos= function (cache,k) {
	return ser_planoOjson_r(get_file(cache.path+"/"+seguro_fpath(k)));
}

borrarTodo_cache_archivos= function (cache) { //XXX: TODO
}

CacheApi_archivos= {
	nuevo: nuevo_cache_archivos,
	de: de_cache_archivos,
	de_a: funcionComoA(de_cache_archivos),
 	sea: sea_cache_archivos,
	limpiar: limpiar_cache_archivos,
	borrar: borrar_cache_archivos,
	borrarTodo: borrarTodo_cache_archivos,
};

//*****************************************************************************
//S: algoritmos / cache / archivos  en phonegap
nuevo_cache_archivosMovil= function (nombre, pfx) {
	r= { nombre: nombre, pfx: pfx }
	for (var k in CacheApi_archivosMovil) { r[k]= CacheApi_archivosMovil[k] }
	var path= CFGLIB.pathToLib+"cache/"+pfx;
	ensure_dir(path,nullf,onFail);
	return r;
}

limpiar_cache_archivosMovil= function (cache) {
	//XXX:TODO
}

sea_cache_archivosMovil= function (cache,k,v,sz,quiereLimpiarDespues,quiereDirecto) {
	if (cache.soloLectura) { return ; }
	var path= CFGLIB.pathToLib+"cache/"+cache.pfx+seguro_fpath(k);
	var f1= function () { try {
		logm("DBG",7,"sea_cache_archivosMovil ",{k:k,path:path});
		
		set_file_bin_a(path,quiereDirecto ? v : ser_planoOjson(v),function () { 
			logm("DBG",1,"sea_cache_archivosMovil OK ",{k:k,path:path}); 
		}, function(err) {
			logm("DBG",7,"sea_cache_archivosMovil ERR ",{k:k,path:path,err:err});
		});
	} catch (ex) { 
		logm("ERR",3,"sea_cache_archivosMovil ",{k:k,message:ex.message});
	} };
	var pathDir= path.replace(/[^\/]*$/,"");
	pathDir.length>1 ? ensure_dir(pathDir,f1,f1) : f1();
}

borrar_cache_archivosMovil= function (cache,k) {
	var path= CFGLIB.pathToLib+"cache/"+cache.pfx+seguro_fpath(k);
		logm("DBG",7,"borrar_cache_archivosMovil ",{k:k,path:path});
		
	delete_file(path,function () { 
			logm("DBG",1,"borrar_cache_archivosMovil OK ",{k:k,path:path});
		}, function(err) { 
			logm("DBG",7,"borrar_cache_archivosMovil ERR ",{k:k,path:path,err:err});
		});
}

borrarTodo_cache_archivosMovil= function (cache,quiereSinPedirConfirmacion,cb) {
	var path= CFGLIB.pathToLib+"cache/"+cache.pfx;
	deleteAll_dir(path,quiereSinPedirConfirmacion,cb);
}

de_a_cache_archivosMovil= function (cache,k,cbok,cbf) {
	get_file_a(CFGLIB.pathToLib+"cache/"+cache.pfx+"/"+seguro_fpath(k),"bin",
		function (d) { 
			var v= ser_planoOjson_r(d); 
			cbok(v,(d||"").length);
		},
		cbf||function (err) { cbok(null,-1,err); });
}

CacheApi_archivosMovil= {
	nuevo: nuevo_cache_archivosMovil,
	de_a: de_a_cache_archivosMovil,
 	sea: sea_cache_archivosMovil,
	limpiar: limpiar_cache_archivosMovil,
	borrar: borrar_cache_archivosMovil,
	borrarTodo: borrarTodo_cache_archivosMovil,
};

//*****************************************************************************
//S: errores, coordinar con libcx!!!  
esCxError= function(data) {
	var r= (data==null) || (typeof(data)=="string" && data.indexOf("LibCxException")!=-1) || data.LibCxException!=null;
	if (r) { logm("DBG",5,"esCxError?",{esError:r, data: ser_planoOjson(data).substr(0,100),}); }
	return r;
};

setCxError= function(msg,data) { //U: para generar una respuesta que de verdadero a esCxError
	return {"LibCxException": msg, data: data};
};


//*****************************************************************************
//S: wrappers
//XXX: generalizar para que tambien sirva para cache en db
//XXX: generalizar, agregar localStorage
envolver_contador= function (f) { //D: envuelve la funcion en otra que cuenta las veces que la llamaste, ej. para saber cuantos tiles borraste dentro de un poligono 
    var fConContador;
    fConContador= function () {
        fConContador.cuenta++;
        return f.apply(this,arguments);
    }
    fConContador.cuenta=0;
    return fConContador;
}

nuevo_cache_envuelto= function (cache,fun,fun_r) {
	var sea_x= cache.sea_ori= cache.sea;
	var de_a_x= cache.de_a_ori= cache.de_a;
	cache.sea= function (cache,k,v,sz,quiereLimpiarDespues) {
		cache.soloLectura || sea_x(cache,k,fun(v),sz,quiereLimpiarDespues);
	};
	cache.de_a= function (cache,k,cbok,cbf) {
		de_a_x(cache,k,function (data,err) { try {
				var args= fArgsCopy(arguments);
				if (data!=null) { args[0]= fun_r(data); } //A: SOLO cambio data por aplicar la funcion a data, lo demas sigue el mismo protocolo
				cbok.apply(this,args);
		} catch (ex) { logmex("ERR",1,"CACHE ENVUELTO DE CB ERR",{ cache: cache.nombre, k: k},ex) }}, cbf);
	};
	return cache;
}

funcionConCacheDefault_a= function (cbQueActualiza,cacheDondeGuardo,keyF,cbIdx,quierePasarSizeACb) { //U: intenta llamar a la funcion, si va bien guarda los datos, si falla y tiene datos guardados los usa
	logm("DBG",5,"funcionConCacheDefault_a MK ",cacheDondeGuardo);
	var r= (function () {try{
		logm("DBG",8,"funcionConCacheDefault_a",{args:args,clave:clave});
		var args= fArgsCopy(arguments);
		var cb= args[cbIdx]; //U: indice de la que hay que llamar con los datos
		var clave= keyF.apply(this,args);

		args[cbIdx]= function (data,sz) {try{
			var argsParaCb= quierePasarSizeACb ? fArgsCopy(arguments) : fArgsCopy(arguments,2,[data]);
			if (!esCxError(data)) {try{ //A: consegui datos nuevos, actualizo el cache
				cacheDondeGuardo.sea(cacheDondeGuardo,clave,data,sz);
				logm("DBG",8,"CACHE OK GUARDO",{cache: cacheDondeGuardo.nombre,clave: clave, args: args, data_sz: sz, data_ej: data && (data+"").substr(0,100)});
				cb.apply(this,argsParaCb); //A: llamo a la funcion que esperaba el resultado con los datos nuevos	
			}catch(ex){ logmex("ERR",1,"CACHE INVOCANDO CB",{cache: cacheDondeGuardo.nombre,clave: clave, args: args, data: data},ex); }}
			else {try{//A: no consegui los datos, me vino error
				logm("DBG",8,"CACHE NO CONSEGUI DATOS NUEVOS, INTENTO CACHE",{cache: cacheDondeGuardo.nombre,clave: clave, args: args, data_ej: data && (data+"").substr(0,100)});

				cacheDondeGuardo.de_a(cacheDondeGuardo,clave, function (data,sz,err) {try{
					if (data!=null && !err) { logm("DBG",8,"CACHE ESTABA",{cache: cacheDondeGuardo.nombre, clave: clave, args: args, data_ej: data && (data+"").substr(0,100)}); //XXX:MAU agregar que puede haber NULL para esa clave
						argsParaCb[0]= data;
						cb.apply(this,argsParaCb);
					}
					else { 
						logm("DBG",8,"CACHE FALTA",{cache: cacheDondeGuardo.nombre,clave: clave, args: args, data_ej: data && (data+"").substr(0,100)});
						cb.apply(this,argsParaCb);
					}
				}catch(ex){ logmex("ERR",1,"CACHE INVOCANDO CB",{cache: cacheDondeGuardo.nombre,clave: clave, args: args, data: data},ex); } });
			}catch(ex){ logmex("ERR",1,"CACHE BUSCANDO",{cache: cacheDondeGuardo.nombre,clave: clave, args: args, data: data},ex); }}
		}catch(ex){ logmex("ERR",1,"CACHE RECIBIENDO",{cache: cacheDondeGuardo.nombre,clave: clave, args: args, data: data},ex); }} ; 
		//A: reemplace el callback que recibe el resultado por mi funcion que si llego bien lo guarda y se lo pasa y sino, le pasa uno del cache
		cbQueActualiza.apply(this, args);	
	}catch(ex){ logmex("ERR",1,"CACHE PIDIENDO",{cache: cacheDondeGuardo.nombre,clave: clave, args: args},ex); }}); 
	//A: r es una funcion que de afuera se ve igual que la original, pero si la original falla usa datos de la ultima vez que funciono
	r.cbQueActualiza= cbQueActualiza;
	r.cache= cacheDondeGuardo;
	r.keyF= keyF;
	r.funcionEnvuelta= cbQueActualiza;
	return r;
};

funcionConCache_a= function (cbSiNoEsta,cacheDondeGuardo,keyF,cbIdx,quierePasarSizeACb) {
	logm("DBG",5,"funcionConCache MK ",cacheDondeGuardo);
	var r= (function () { try {
		var args= fArgsCopy(arguments); //A: los args de la LLAMADA ORIGINAL a la funcion
		var clave= keyF.apply(this,args);
		logm("DBG",8,"funcionConCache_a",{args:args,clave:clave});
		var cb= args[cbIdx]; //U: indice de la que hay que llamar con los datos
	 	cacheDondeGuardo.de_a(cacheDondeGuardo,clave, function (data,sz,err) { try {
			if (data!=null && !err) { logm("DBG",8,"CACHE ESTABA",{cache: cacheDondeGuardo.nombre, clave: clave, sz: sz, args: args, data_ej: data && (data+"").substr(0,100)}); //XXX:MAU agregar que puede haber NULL para esa clave en el cache
				if (quierePasarSizeACb)  { args.unshift(sz); }
				args.unshift(data);
				cb.apply(this,args);
			}
			else { logm("DBG",8,"CACHE FALTA",{cache: cacheDondeGuardo.nombre,clave: clave, args: args, data_ej: data && (data+"").substr(0,100)});
					args[cbIdx]= function (data,sz,err) { try {
						var argsCb= quierePasarSizeACb ? fArgsCopy(arguments) : fArgsCopy(arguments,2,[data]);
						if (!esCxError(data)) {
							cacheDondeGuardo.sea(cacheDondeGuardo,clave,data,sz);
							logm("DBG",8,"CACHE GUARDO",{cache: cacheDondeGuardo.nombre,clave: clave, sz: sz, args: args, data_ej: data && (data+"").substr(0,100)});
						}
						else {
							logm("DBG",8,"CACHE ES ERROR CX NO GUARDO",{cache: cacheDondeGuardo.nombre,clave: clave, args: args, data_ej: data && (data+"").substr(0,100)});
						}
						cb.apply(this,argsCb);	
					}catch(ex){logmex("ERR",1,"CACHE INVOCANDO CON DATOS",{cache: cacheDondeGuardo.nombre,clave: clave, args: args, data: data},ex);}};
				cbSiNoEsta.apply(this, args);	
			}
		} catch (ex) { logmex("ERR",1,"CACHE INVOCANDO",{cache: cacheDondeGuardo.nombre,clave: clave, args: args, data: data},ex); } });
	} catch (ex) { logmex("ERR",1,"CACHE BUSCANDO",{cache: cacheDondeGuardo.nombre,clave: clave, args: args, data: data},ex); } });
	r.cbQueActualiza= cbSiNoEsta;
	r.cache= cacheDondeGuardo;
	r.keyF= keyF;
	r.funcionEnvuelta= cbSiNoEsta;
	return r;
};

//XXX:MAURICIO:agregar que si ya hay un thread calculando el valor, los demas esperen en vez de TAMBIEN calcularlo
funcionConCache= function (cbSiNoEsta,cacheDondeGuardo,keyF,quiereLlamarSiempre) {
	logm("DBG",1,"funcionConCache MK",cacheDondeGuardo);
	var r= function () {
		try {
			logm("DBG",9,"funcionConCache",cacheDondeGuardo);
			var args= fArgsCopy(arguments);
			var clave= keyF.apply(this,args);
			var data= quiereLlamarSiempre ? null : cacheDondeGuardo.de(cacheDondeGuardo,clave);
			if (data!=null) { logm("DBG",8,"CACHE ESTABA",{cache: cacheDondeGuardo.nombre,clave: clave, args: args, data_ej: data && (data+"").substr(0,100)});
			}
			else { logm("DBG",8,"CACHE FALTA",{cache: cacheDondeGuardo.nombre,clave: clave, args: args, data_ej: data && (data+"").substr(0,100)});
				try {
					data= cbSiNoEsta.apply(this,args);
					cacheDondeGuardo.sea(cacheDondeGuardo,clave,data);
				} catch (ex) { 
					logmex("ERR",1,"CACHE INVOCANDO CON DATOS",{cache: cacheDondeGuardo.nombre,clave: clave, args: args, data: data},ex); 
					throw(ex); //A: vuelvo a lanzar la excepcion porque otros la precisan, ej. libcx para avisarle al cliente
				};
			}
			return data;
		} catch (ex) { 
			logmex("ERR",1,"CACHE INVOCANDO",{cache: cacheDondeGuardo.nombre,clave: clave, args: args, data: data},ex); throw(ex); 
			throw(ex); //A: vuelvo a lanzar la excepcion porque otros la precisan, ej. libcx para avisarle al cliente
		}
	};
	r.keyF= keyF;
	r.cacheDondeGuardo= cacheDondeGuardo;
	r.cache_borrar= function () {
		var args= fArgsCopy(arguments);
		var clave= keyF.apply(this,args);
		logm("DBG",8,"funcionConCache CACHE_BORRAR",{args:args,clave:clave});
		cacheDondeGuardo.borrar(cacheDondeGuardo,clave);
	};
	r.cache_sea= function () { //U: establece DIRECTAMENTE el valor para unos parametros
		var args= fArgsCopy(arguments);
		var v= args.pop();
		var clave= keyF.apply(this,args);
		logm("DBG",8,"funcionConCache CACHE_SEA",{args:args,clave:clave});
		cacheDondeGuardo.sea(cacheDondeGuardo,clave,v);
	};
	r.cache_de= function () { //U: establece DIRECTAMENTE el valor para unos parametros
		var args= fArgsCopy(arguments);
		var clave= keyF.apply(this,args);
		logm("DBG",8,"funcionConCache CACHE_DE",{args:args,clave:clave});
		return cacheDondeGuardo.de(cacheDondeGuardo,clave);
	};	
	return r;
}

//XXX: descomponer y hacer mas configurable y componible!
funcionConCache_a_archivos= function(nombre, funcion, cbIdx, funcionClavePara, prefijoNombreArchivo, cache, quierePasarSizeACb) { //D: envuelve una funcion con cache, si esta en movil usa archivos encriptados para cuando este offline
	prefijoNombreArchivo = prefijoNombreArchivo || "";

	var cache = cache || nuevo_cache_recienUsados(nombre, 1); //A:DFLT

	var funcionConCacheArchivos = funcion; //A: DFLT, ej. cxAjaxCall que trae los datos

	if (GLOBAL.enAppMovil || GLOBAL.CACHE_LOCALSTORAGE) {
		var cacheArchivos = nuevo_cache_envuelto(nuevo_cache_archivosMovil(nombre + "_archivos", prefijoNombreArchivo), encriptar, encriptar_r);
		funcionConCacheArchivos = funcionConCache_a(funcion, cacheArchivos, funcionClavePara, cbIdx, true); //A: si tiene los datos en el cache, que nos pase el size para el cache recienUsados
	}
	else if (GLOBAL.rtType=="java") {
		var cacheArchivos = nuevo_cache_archivos("x_cache_fun/"+nombre, "x_cache_fun/"+nombre);
		funcionConCacheArchivos = funcionConCache_a(funcion, cacheArchivos, funcionClavePara, cbIdx,true);
	}

	var funcionr = funcionConCache_a(funcionConCacheArchivos, cache, funcionClavePara, cbIdx, quierePasarSizeACb); //A: aca, como quiera la funcion
	funcionr.cache = cache;
	funcionr.cacheArchivos = cacheArchivos;
	funcionr.cacheBorrar= function () {
		if (funcionr.cacheArchivos) { funcionr.cacheArchivos.borrarTodo(funcionr.cacheArchivos,true); }
		if (funcionr.cache) { funcionr.cache.borrarTodo(funcionr.cache); }
	}
	return funcionr;
}

funcionConCacheDefault_a_archivos= function(nombre, funcion, cbIdx, funcionClavePara, prefijoNombreArchivo, cache) { //D: envuelve una funcion con cache, si esta en movil usa archivos encriptados para cuando este offline
	prefijoNombreArchivo = prefijoNombreArchivo || "";
	var cache = cache || nuevo_cache_recienUsados(nombre, 1);

	var funcionConCacheArchivos = funcion; //A: DFLT

	if (GLOBAL.enAppMovil || GLOBAL.CACHE_LOCALSTORAGE) { //XXX:MAU cambiar por tiene filesystem!
		var cacheArchivos = nuevo_cache_envuelto(nuevo_cache_archivosMovil(nombre + "_archivos", prefijoNombreArchivo), encriptar, encriptar_r);
		funcionConCacheArchivos = funcionConCacheDefault_a(funcion, cacheArchivos, funcionClavePara, cbIdx,true);
	}
	else if (GLOBAL.rtType=="java") {
		var cacheArchivos = nuevo_cache_archivos("x_cache_"+nombre, "x_cache_"+nombre);
		funcionConCacheArchivos = funcionConCacheDefault_a(funcion, cacheArchivos, funcionClavePara, cbIdx);
	}

	var funcionr = funcionConCacheDefault_a(funcionConCacheArchivos, cache, funcionClavePara, cbIdx);
	funcionr.cache = cache;
	funcionr.cacheArchivos = cacheArchivos;
	funcionr.cacheBorrar= function () {
		if (funcionr.cacheArchivos) { funcionr.cacheArchivos.borrarTodo(funcionr.cacheArchivos,true); }
		if (funcionr.cache) { funcionr.cache.borrarTodo(funcionr.cache); }
	}
	return funcionr;
}

//*****************************************************************************
//S: validaciones
validate_pass= function(security) { //XXX:MOVER:a lib, asi tambien se puede usar en el backend
        var msg = "";
        var newPassHasCorrectLength = security.newPass.length > 5; //XXX:CFG
        var newPassContainsNumber = /\d/.test(security.newPass);
        var newPassContainsLetter = /[a-zA-Z]/.test(security.newPass);

        if (!security.currentPass || !security.newPass || !security.newPassCheck) {
            msg = "Falta ingresar al menos un dato";
            return msg;
        }
        if (security.newPass != security.newPassCheck) {
            msg = "La clave nueva no coincide con la repeticion de la misma";
            return msg;
        }
        if (security.currentPass != Cfg.pass) {
            msg = "Contraseña actual incorrecta";
            return msg;
        }
        if (!(newPassHasCorrectLength && newPassContainsNumber && newPassContainsLetter)){
            msg = "La contraseña debe tener una longitud de 6 caracteres como mínimo y contener al menos un número y una letra";
            return msg;
        }
        return msg;
}


