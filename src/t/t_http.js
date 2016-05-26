//s= LibRt.get_http('http://www.google.com','GET',null,null,null);
//print(s);

//OJO! https requiere que JAVA_HOME sea correcto para encontrar los certificados, sino dice que no los puede validar PKIX
s= LibRt.get_http('https://enerminds.plan.io/issues/20660.json','GET',null,"emrestcli1","pone la clave");
print(s);
