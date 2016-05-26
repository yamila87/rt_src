var calc= LibRt.digestCalc("MD5");
var writer= LibRt.fileWriter("xdigest.gz",true,calc);
writer.write("hola este es el primer string");
writer.write("hola este es el segundo string");
writer.write("etc.");
writer.close();

var d= LibRt.digestHexStr(calc).toUpperCase();
logm("NFO",1,"DIGEST MD5",{file: "xdigest.gz", md5: d});
systemRun(["/bin/sh","-c","md5sum xdigest.gz | tee xmd5.txt"]);
d2= (get_file("xmd5.txt").split(/ /,1))[0].toUpperCase();
if (d==d2) {
	logm("NFO",1,"TEST OK", {file: 'xdigest.gz', md5: d});
}
else {
	logm("NFO",1,"TEST ERROR los checksums difieren", {file: 'xdigest.gz', md5lib: d, md5sum: d2});
}

