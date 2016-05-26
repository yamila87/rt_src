load('crypto-sjcl.js');

CfgDbKey="PEPEPEP";

print("x='"+enc_base64("poroto")+"'");

s= encriptarSAFE({a:1,b:2}, "mi clave");
print(s);
o= encriptar_rSAFE(s,"mi clave");
print(ser_json(o))
