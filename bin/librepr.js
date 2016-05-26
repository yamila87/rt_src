//INFO: generar sql y ddl desde formatos mas comodos

CfgDbIdiom= "oracle";
CfgDbIdiom= "sqlite";

kvDeKv_file_tsv= function (fname,id0ColName,id1ColName) {
	var r= {};
	var colNames= null;
	csvEach_file(fname,function (cols) {
		if (!colNames) { colNames= cols.map(function(n) { return n.toLowerCase();}); logm("DBG",7,"CSV NAMES",colNames); }
		else { var d= zipkv(colNames,cols);
			logm("DBG",7,"CSV ROW",d);
			var id= d[id0ColName];
			var encur= r[id];
			if (!encur) { encur= r[id]= {} };
			encur[d[id1ColName]]= d;
		}
	});
	return r;
}

substringMasLarga= function (clave,lista,dflt) {
	return fold(lista, function (t,k,acc) { 
		return (clave.indexOf(k)>=0 && (!acc || k.length>acc.length)) ? k : acc;
	},dflt);
}

tipoParaColumna= function (colNombre,entNombre,entidades) {
	var colDef= entidades[entNombre][colNombre];
	var r= colDef["tipo_"+CfgDbIdiom] || colDef["tipo"]; //XXX: generalizar
	if (!r) {
		var tiposPorDefecto= entidades["*"];	
		var colDefDflt= tiposPorDefecto[colNombre];
		r= colDefDflt && (colDefDflt["tipo_"+CfgDbIdiom] || colDefDflt.tipo);
		if (!r) {
			var patron= substringMasLarga(colNombre,tiposPorDefecto,"*");
			var colDefDflt= tiposPorDefecto[patron];
			r= colDefDflt && (colDefDflt["tipo_"+CfgDbIdiom] || colDefDflt.tipo);
			r= r || "INTEGER";
		}
	}		
	return r;
}

indicesParaEntidad= function (entidad) {
	var indices= fold(entidad, function (cold,colNombre,acc) { 
		if (cold.pk!="") { acc["PK"]= acc["PK"]||[]; acc["PK"][(cold.pk||acc["PK"].length)-1]= cold.parte; }
		fold("abcdefgh".split(""),function (k,i) { var idxk= "idx"+k; 
			var idx= cold[idxk];
			if (idx) { acc[idx]= acc[idx]||[]; acc[idx][(cold["pos"+k]||acc[idx].length)-1]= cold.parte; }
		});
		return acc; 
	},{});
	//A: indices->nombre->[columnas]
	return indices;
}

ddlTablaEindicesPara= function (entNombre, entidades,acc) {
	acc= acc || "";
	var entidad= entidades[entNombre];
	acc+="\nCREATE TABLE "+entNombre+" ("+
		fold(entidad, function (cold,colNombre,acc) { 
			acc+= ", "+colNombre+" "+tipoParaColumna(colNombre,entNombre,entidades); 
		return acc; } ,"").substr(2)+");\n";
	//A: tabla
	var indices= indicesParaEntidad(entidad);
	//A: indices->nombre->[columnas]

	fold(indices,function (cols,k) {
		acc+= "CREATE "+(k=="PK" ? "UNIQUE":"")+" INDEX ix_"+entNombre+"_"+k+" ON "+entNombre+" ("+cols.join(", ")+");\n"
	});
	return acc;
}

dmlInsertPara= function (entNombre, entidades,acc) {
	acc= acc || "";
	var entidad= entidades[entNombre];
	acc+= "\nINSERT INTO "+entNombre+" ("+
		fold(entidad, function (cold,colNombre,acc) { acc+= ", "+colNombre; return acc; } ,"").substr(2)+")  VALUES ("+
		fold(entidad, function (cold,colNombre,acc) { acc+= ", $"+(entidad[colNombre].paramcsv || colNombre); return acc; } ,"").substr(2)+") ";
	return acc;	
}

dmlDeletePara= function (entNombre, entidades,acc) {
	acc= acc ||"";
	var entidad= entidades[entNombre];
	acc+="\nDELETE FROM "+entNombre+" WHERE "+
		fold(entidad, function (cold,colNombre,acc) { 
			if (cold.pk) { acc+= " AND "+colNombre+"= $"+(entidad[colNombre].paramcsv || colNombre); }
		return acc; } ,"").substr(5)+"\n";
	return acc;
}


fname= "SCHEMA.def.tsv"
Entidades= kvDeKv_file_tsv(fname,"tabla","parte");
//A: tenemos nombreEntidadXentidad en Entidades
logm("DBG",1,"ENTIDADES",Entidades);

ddlSrc= fold(Entidades, function (entidad,entNombre,acc) {
	if (entNombre!="*") { //A: es una entidad a crear, no es el default que usamos para los tipos
		set_file(entNombre+"."+CfgDbIdiom+".ddl",ddlTablaEindicesPara(entNombre,Entidades));
		set_file(entNombre+".insert.sql",dmlInsertPara(entNombre,Entidades));
		set_file(entNombre+".delete.sql",dmlDeletePara(entNombre,Entidades));
	}
});

