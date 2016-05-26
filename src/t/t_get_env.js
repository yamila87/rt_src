//INFO: probar get de variables de ambiente
//U: T_GET_ENV_SH=DEFINIDA_POR_SH rt t/t_get_env.js 

v1e= "DEFINIDA_POR_SH";
v1= get_env("T_GET_ENV_SH","fallo_usa_default");
logm(v1==v1e ? "NFO": "ERR",1,"T_GET_ENV_SH",{v1: v1, esperado: v1e});
//A: el que llamo la definio y nuestro script la usa

v1e= "VALOR_DFLT";
v1= get_env("T_GET_ENV_NO_EXISTE",v1e);
logm(v1==v1e ? "NFO": "ERR",1,"T_GET_ENV_NO_EXISTE",{v1: v1, esperado: v1e});
