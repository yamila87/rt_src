x= {a: 1, b: "c", d: true}
xs= JSON.stringify(x);
print(xs)
x2= JSON.parse(xs);
print(x2.b.replace("c","C"));
x2= JSON.parse(new java.lang.String(xs));
print(x2.b.replace("c","C"));

x1= "x1"
x3= "x1"+5;
print(x3.replace("x","Z"));

function ss(s) { return new java.lang.String(s); }
x1= ss("x1"); x2= ss("x2");
x3= x1+"_"+x2;
print("X3 "+typeof(x3));
try { print(x3.replace("x","Z")); }
catch (ex) { logmex("ERR",1,"SUMA DE java strings y js strings NO es js string",x3,ex) }
x1= "x1j";
x2= "x2j";
x3= x1+"_"+x2;
print("X3 "+typeof(x3));
try { print(x3.replace("x","Z")); }
catch (ex) { logmex("ERR",1,"SUMA DE js strings NO es js string",x3,ex) }
//XXX: OJO! cuando sumas un java.lang.String a un string TODO se convierte en java.lang.String :P
