miFunc= function (a1) {
	return "ok "+a1;
}

var r= LibRt.jsCall("miFunc",null,["prueba"]);
print(r);

var r= LibRt.jsCall("miFuncNoExiste",null,["prueba"]);
print(r);
