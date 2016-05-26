var CFG_ROWS=10;
//var cx= dbCx({url: 'jdbc:h2:./xdb'});
var cx= dbCx({url: 'jdbc:sqlite:./xdb.sqlite'});
x= dbParse("CREATE TABLE t1 (c1 varchar(50), c2 varchar(50));");
logm("DBG",1,"CMD",x);
dbExec(cx,"CREATE TABLE IF NOT EXISTS t1 (c1 varchar(50), c2 Integer, espar Integer);");
for (var i=0; i<CFG_ROWS; i++) {
	r= dbExec(cx,"INSERT INTO T1 values ($v1,$v2:number,$espar);",{v1: (new Date()).toJSON(), v2: i, espar: i % 2});
}

r= dbExec(cx,"INSERT INTO T1 values ($v1,$v2:number,$espar);",{v1: (new Date()).toJSON(), v2: "TuVieja", espar: i % 2}); //A: este no se puede convertir v1 a number

rs= dbQuery(cx,"select * from t1",{});
while (rs.next()) {
	print(rs.getObject(1)+"|"+rs.getObject(2)+"\n");
}

rs= dbQuery(cx,"select * from t1 where espar=$miparametro",{miparametro: 1});
digestCalc= LibRt.digestCalc("MD5");
w= Packages.LibRt.fileWriter("x1.csv.gz",true,digestCalc);
cnt1= Packages.LibRt.serRsCsvToWriter(rs,null,w,5,">|<");
logm("DBG",1,"CSV GENERADO",{file: "x1.csv", rows: cnt1});
w= Packages.LibRt.fileWriter("x5.csv.gz",true,null);
cnt2= Packages.LibRt.serRsCsvToWriter(rs,null,w,-1,">|<");
logm("DBG",1,"CSV GENERADO",{file: "x5.csv", rows: cnt2});

diff= CFG_ROWS-cnt1-cnt2;
if (diff!=0) {
	logm("ERR",1,"TEST no hay la misma cantidad de filas en los csv que en la base",{diff: diff, cnt1: cnt1, cnt2: cnt2, CFG_ROWS: CFG_ROWS})
}
else {
	logm("NFO",1,"TEST OK misma cantidad de filas en los csv que en la base",{diff: diff, cnt1: cnt1, cnt2: cnt2, CFG_ROWS: CFG_ROWS})
}


//S: transacciones
dbTxAutoCommit(cx,false);
for (var j=0; j<CFG_ROWS; j++) {
	i=j+1000;
	r= dbExec(cx,"INSERT INTO T1 values ($v1,$v2,$espar);",{v1: (new Date()).toJSON(), v2: i, espar: i % 2});
}
var ct= dbQueryOne(cx,"select count(*) from t1 where c2>=1000;");
dbTxRollback(cx);
var cf= dbQueryOne(cx,"select count(*) from t1 where c2>=1000;");
if (ct==CFG_ROWS && cf==0) {
	logm("NFO",1,"TEST OK TX",{ctransaccion: ct, cfinal: cf});
}
else {
	logm("ERR",1,"TEST ERROR TX",{ctransaccion: ct, cfinal: cf, ctransaccionExpected: CFG_ROWS});
}

