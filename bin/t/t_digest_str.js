var x="esta es mi cadena de texto con datos";
var d= Packages.LibRt.digest(x,"MD5").toUpperCase();
logm("NFO",1,"DIGEST MD5",{src: x, md5: d});
systemRun(["/bin/sh","-c","echo -n '"+x+"' | md5sum | tee xmd5.txt"]);
d2= (get_file("xmd5.txt").split(/ /,1))[0].toUpperCase();
if (d==d2) {
	logm("NFO",1,"TEST OK", {src: x, md5: d});
}
else {
	logm("NFO",1,"TEST ERROR los checksums difieren", {src: x, md5lib: d, md5sum: d2});
}

