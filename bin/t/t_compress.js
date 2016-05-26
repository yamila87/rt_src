//INFO: comprimir descomprimir, javascript PURO!
//SEE: http://pieroxy.net/blog/pages/lz-string/guide.html

load("lz-string.js");

var src= get_file(ARGV[1]);
var compressed = LZString.compress(src);
print("Size of compressed sample is: " + compressed.length+"\n");
set_file(ARGV[1]+".z",compressed);
src2 = LZString.decompress(compressed);
print("CHK "+(src==src2)+"\n");
