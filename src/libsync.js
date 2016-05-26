//INFO: funciones comodas para escribir planes de sincronizacion

//***************************************************************************
//S: cfg
CfgOutPfx="x_";

//***************************************************************************
//S: db utils
cx_=null; //U: se crea una sola vez, PERO hay que poderla cerrar
cx= function () {
	cx_= cx_ || dbCx(CfgCx);
	return cx_;
}

//***************************************************************************
//S: sync plan
var CfgSyncPlan= [];
syncPlanAgregar= function(e) { CfgSyncPlan.push(e); }
syncPlanAgregarLista= function (l) { l.map(syncPlanAgregar); }

//***************************************************************************
//S: reprDb
reprDbSqlPathFor= function (name,reprDb) {
  return reprDb+"/"+name+".sql";
  //XXX:SEC devolver VACIO si no entendemos el caso!
}

ReprDbSqlCache= {};
reprDbSqlFor= function (name, reprDb) {
	var sqlPath= reprDbSqlPathFor(name, reprDb);
	var sql= ReprDbSqlCache[sqlPath];
	if (!sql) { sql= ReprDbSqlCache[sqlPath] || get_file(sqlPath); }

	if (CfgCx.url.match(/:h2:/)) { //XXX:esto es siempre? de que depende?
		sql= sql.replace(/TO_DATE/i,"PARSEDATETIME");
		sql= sql.replace("'YYYY-MM-DD HH24:MI:SS'","'yyyy-MM-dd HH:mm:ss'");	
	} 
	logm("DBG",1,"DB REPR SQL FOR",{name:name, reprDb: reprDb, sql: sql});
	return sql;
}
	
//***************************************************************************
//S: sync func
syncStdManifestCfg= function (logId,outDir,outPfx) {
	var fname= outPfx+"o_logId"+logId+"_manifest.json"; //XXX: otros casos de query a path 
	var cfg={
		fname: fname,
	  outPath: outDir+"/"+fname,
	};
	return cfg;
}

syncStdCfg= function (logId,queryName,outDir,outPfx,paramsKv,extraWhere) {
	var fname= outPfx+"o_logId"+logId+"_"+seguro_fname(queryName)+".csv.gz"; //XXX: otros casos de query a path 
	var cfg={
		sqlPath: queryName+".query.sql", //XXX:CFG //XXX:unificar con reprDbSqlFor
		fname: fname,
	  outPath: outDir+"/"+fname,
	};
	return cfg;
}

syncStdCfgSql= function (logId,queryName,outDir,outPfx,paramsKv,extraWhere) {
	var cfg= syncStdCfg(logId,queryName,outDir,outPfx,paramsKv,extraWhere);
	cfg.sql= cfg.sqlSrc= get_file(cfg.sqlPath);
	if (extraWhere) {
		cfg.sql= cfg.sqlSrc.match(/\s+WHERE\s+/i) ? 
			cfg.sqlSrc.replace(/\s+WHERE\s/i," WHERE "+extraWhere+" AND ") : 
			cfg.sqlSrc.match(/\s+(?:ORDER\s+BY)|(?:GROUP\s+BY)\s+/i) ?
				cfg.sqlSrc.replace(/\s+(?:ORDER\s+BY)|(?:GROUP\s+BY)\s+/i, function (m) { return(" WHERE "+extraWhere + m); }) :
				cfg.sqlSrc + " WHERE "+ extraWhere;
	}
	cfg.isVersioned= /SPRLOG/i.exec(cfg.sql)!=null; //XXX: generalize!!!
	return cfg;
}

syncStd= function (logId,queryName,outDir,outPfx,paramsKv,extraWhere,wantsNoDb,wantsOnlyVersioned,rowCntMax) {
	rowCntMax= rowCntMax || -1;

	var cfg= syncStdCfgSql(logId,queryName,outDir,outPfx,paramsKv,extraWhere); 
	logm("DBG",7,"DB REPDB SQL",cfg);
	
	var cnt= 0;
	if (wantsNoDb || (wantsOnlyVersioned && !cfg.isVersioned)) {//A: emulacion
		var digestCalc= LibRt.digestCalc("MD5");
		var writer= LibRt.fileWriter(cfg.outPath,true,digestCalc); writer.write("");
	}
	else {
		var rs= dbQuery(cx(),cfg.sql,paramsKv); 
		var digestCalc= LibRt.digestCalc("MD5");
		var writer= LibRt.fileWriter(cfg.outPath,true,digestCalc); writer.write("");
		logm("DBG",8,"SYNC TO CSV STEP got rs",{cfg: cfg, rsIsNull: rs==null, writerIsNull: writer==null});
		cnt= LibRt.serRsCsvToWriter(rs,null,writer,rowCntMax,"\t");
		rs.close();
		logm("DBG",7,"SYNC TO CSV STEP wrote", {cnt: cnt,queryName: queryName});
	}
	writer.close();
	logm("DBG",1,"SYNC TO CSV DONE",cfg);
	return {cnt: cnt, fname: cfg.fname, outPath: cfg.outPath, digest: LibRt.digestHexStr(digestCalc)+"", query: queryName};
}

syncStdManifest= function (logId,manifest,outDir,outPfx) {
	var cfg= syncStdManifestCfg(logId,outDir,outPfx);
	set_file(cfg.outPath,ser_json(manifest,true));
}
	

