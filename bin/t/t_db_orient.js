var CFG_ROWS=10;
//var cx= dbCx({url: 'jdbc:h2:./xdb'});

OrientHome= "/home/usr10/devel/dwimer5/s/db_java_orient/orientdb-community-2.1.7";
java.lang.System.setProperty("ORIENTDB_HOME",OrientHome);

try {
db = new Packages.com.orientechnologies.orient.core.db.document.ODatabaseDocumentTx("plocal:"+OrientHome+"/databases/mydb").create();
sm = db.getMetadata().getSecurity();
user = sm["createUser(java.lang.String,java.lang.String,java.lang.String[])"]("root", "nojoda", ["admin"]);
db.setUser(user);
}
catch (ex) { logmex("DBG",1,"CREATE DB",{},ex); }

OServerMain= Packages.com.orientechnologies.orient.server.OServerMain;
server = OServerMain.create();
//server.startup(new File("/home/usr10/devel/dwimer5/s/db_java_orient/orientdb-community-2.1.7/config/orientdb-server-config.xml"));
server.startup(
   "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>"
   + "<orient-server>"
   + "<network>"
   + "<protocols>"
   + "<protocol name=\"binary\" implementation=\"com.orientechnologies.orient.server.network.protocol.binary.ONetworkProtocolBinary\"/>"
   + "<protocol name=\"http\" implementation=\"com.orientechnologies.orient.server.network.protocol.http.ONetworkProtocolHttpDb\"/>"
   + "</protocols>"
   + "<listeners>"
   + "<listener ip-address=\"0.0.0.0\" port-range=\"2424-2430\" protocol=\"binary\"/>"
   + "<listener ip-address=\"0.0.0.0\" port-range=\"2480-2490\" protocol=\"http\"/>"
   + "</listeners>"
   + "</network>"
   + "<users>"
   + "<user name=\"root\" password=\"ThisIsA_TEST\" resources=\"*\"/>"
   + "</users>"
   + "<properties>"
   + "<entry name=\"server.database.path\" value=\""+OrientHome+"/databases/\"/>"
	 + "<storage name=\"mydb\" path=\"local:"+OrientHome+"/databases/mydb\"" 
   + " userName=\"admin\" userPassword=\"admin\" loaded-at-startup=\"true\" /> "
   + "<entry name=\"orientdb.www.path\" value=\""+OrientHome+"/www/\"/>"
   + "<entry name=\"orientdb.config.file\" value=\""+OrientHome+"/config/orientdb-server-config.xml\"/>"
   + "<entry name=\"server.cache.staticResources\" value=\"false\"/>"
   + "<entry name=\"log.console.level\" value=\"info\"/>"
   + "<entry name=\"log.file.level\" value=\"fine\"/>"
   //The following is required to eliminate an error or warning "Error on resolving property: ORIENTDB_HOME"
   + "<entry name=\"plugin.dynamic\" value=\"false\"/>"
   + "</properties>" + "</orient-server>");
server.activate();

x= Packages.com.orientechnologies.orient.jdbc.OrientJdbcDriver;
print("DRV: "+typeof(x));

//var cx= dbCx({url: 'jdbc:orient:remote:localhost/xdb1', user: "root", pass: "nojoda"});
var cx= dbCx({url: 'jdbc:orient:plocal:mydb', user: "root", pass: "nojoda"});

try { x= dbExec(cx,"DROP CLASS t1;"); }
catch (ex) { logmex("DBG",1,"DROP CLASS",{},ex) }

try { x= dbExec(cx,"CREATE CLASS t1;"); }
catch (ex) { logmex("DBG",1,"CREATE CLASS",{},ex) }

for (var i=0; i<CFG_ROWS; i++) {
	r= dbExec(cx,"INSERT INTO T1 (c1,c2,esPar) VALUES ($v1,$v2,$espar);",{v1: (new Date()).toJSON(), v2: i, espar: i % 2});
}
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
	r= dbExec(cx,"INSERT INTO T1 (c1,c2,espar) values ($v1,$v2,$espar);",{v1: (new Date()).toJSON(), v2: i, espar: i % 2});
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

