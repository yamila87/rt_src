webResponseWrite= function (resp,str) {
	resp.out= (resp.out || "") + str;
	document.body.innerHTML+=str;
}

webRequestData= function (req) {
	return "Sign>100</Sign\nCuit>aguasArriba</Cuit\n";
}

webRequest= {
	getRequestURI: function () { return "/app/cx"; },
	getParameter: function (k) { return "VALOR PARA "+k; }, 
};

webResponse= {};
webMethod= "GET";

