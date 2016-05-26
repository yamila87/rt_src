var CfgCxJs = ARGV[1];
load(CfgCxJs);

p= {};
p.outPath= "sprlinks.csv"; 
p.sql= "select * from sprlinks where objectid=12861843";
p.params = {};
p.quiereGzip= false;

logm("DBG",5,"DB Query To Csv", {CfgCx: CfgCx, Params: p});

var cx = dbCx(CfgCx);
var rs= dbQuery(cx,toJs(p.sql),p.params); 

var writer= LibRt.fileWriter(p.outPath,p.quiereGzip,null); 
writer.write("");
logm("DBG",1,"SYNC TO CSV STEP got rs",{CfgCx: CfgCx, rsIsNull: rs==null, writerIsNull: writer==null});
cnt= LibRt.serRsCsvToWriter(rs,null,writer,-1,"\t");
rs.close();
writer.close();
logm("DBG",1,"SYNC TO CSV DONE",{CfgCx: CfgCx, Params: p});
