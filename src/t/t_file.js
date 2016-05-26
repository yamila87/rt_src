CFG_CNT=10000;

var a=[];
for (var i=0; i<CFG_CNT; i++) {
	a[i]= i;
}

var src= ser_json(a);
set_file("xo",src);

var r= get_file("xo","ERROR");
if (r!=src) {
	logm("ERR",1,"TEST leido es distinto de escrito",{src: src, leido: r});
}
else {
	logm("NFO",1,"TEST OK leido es igual que escrito",{src_len: src.length});
}

print(r.replace(/un patron/,"un reemplazo"));

//XXX: testear no se puede crear o leer poque no existe, disco lleno, etc.

var img= getBin_file("close.png");
print("\n"+img.charCodeAt(0)+"\n");
print("\n"+img.charCodeAt(1)+"\n");
set_file("x_close.png",img);

bin="";
for (var i=0; i<256; i++) {
	bin+= String.fromCharCode(i);
}
set_file("x_bin",bin);
img2= get_file("x_bin");
for (var i=0; i<256; i++) {
	if (img2.charCodeAt(i)!=i) {
		print("ERROR "+i+" vs "+img2.charCodeAt(i)+"\n");	
	}
}
print("OK");
