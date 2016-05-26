//INFO: encondear y decodear base64 en java

var t0= "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn+AgYKDhIWGh4iJiouMjY6PkJGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/w=="; //A: encodeado en chrome con btoa

var dec= enc_base64_r(t0);
for (i=0; i<256; i++) {
	if (dec.charCodeAt(i)!=i) { print("ERROR EN "+i+": "+dec.charCodeAt(i)); }
}

var s="";
for (i=0; i<256; i++) { s+=String.fromCharCode(i); }
var t1= enc_base64(s);
print(t0==t1);
print(t1);

