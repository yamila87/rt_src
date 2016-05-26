//INFO: consigue una muestra y el rowcount de las tablas recibidas como parametro

print("USO: "+ARGV[0]+" path/a/archivoDefineCxCfg.js prefijoArchivosResultado_ miTabla1 otraTabla siQuieroUnaTablaMas");

var cfg= ARGV[1];
var pfx= ARGV[2];
load(cfg);
cx= dbCx(CfgCx);
dbSampleTables(cx,pfx,ARGV.slice(3));
