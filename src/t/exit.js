//INFO: sale del runtime, no importa donde este

yoSalgo= function () { exit(123); }

for (i=0; i<1000; i++) {
	print("voy por "+i+" salgo en 5");
	if (i==5) { yoSalgo() };
}
