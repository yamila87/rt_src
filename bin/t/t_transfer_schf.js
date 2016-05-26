//XXX:OJO! hay servidores que aceptan KeyboardInput pero NO password, con esos NO funciona

testHost = "127.0.0.1"
usr = "dev"
pwd = "dev"
dstFile = "/tmp/x2.txt"; //OJO! la escribimos!
srcFile = "x.txt"; //OJO! la escribimos!

d= ahora()+""
set_file(srcFile, d);
LibRt.set_file_scp_pass(srcFile,testHost,dstFile,usr,pwd)
d2= get_file(dstFile);
logm(d==d2 ? "NFO" : "ERR", 1,"NET SCP TEST",{d: d, d2: d2, srcFile: srcFile, dstFile: dstFile});
