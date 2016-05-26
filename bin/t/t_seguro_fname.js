probarCon= function (original) {
	seguro= seguro_fname(original);
	restaurado= seguro_fname_r(seguro);
	testOriginalIgualRestaurado= (original==restaurado)
	logm((testOriginalIgualRestaurado) ? "NFO":"ERR",1,"TEST RESULT SEGURO_FNAME ",{original: original, seguro: seguro,restaurado: restaurado, testOriginalIgualRestaurado: testOriginalIgualRestaurado});
} 

probarCon("esteNoCambia20");
probarCon("este-Si-Cambia20");
probarCon("noSeConfundeElCaracterDeEscape_20_conLosDelOriginal");
probarCon("../nos/protege de \\20 que nos hackeen!!");



