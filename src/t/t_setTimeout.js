//INFO: usar setTimeout en el lado del SERVER
print("empezo");
runWithTimer(function () {
	var i=5;
	var t0= new Date();
	var reloj= function () {
		print("dT: "+((new Date())-t0));
	}
	var relojT= setInterval(reloj,500);

	var paso= function () {
		print("PASO: "+i); i--;
		if (i>0) { setTimeout(paso,2000); print("esperando 2s"); }
		else { clearInterval(relojT); }
	};
	paso();
});
print("termino");
