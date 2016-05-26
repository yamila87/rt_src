x= "abc";
print(x.replace(/b/,function (m) { return "("+m.toUpperCase()+")"; }));

x= get_file("t_str.js");
print(x.replace(/b/,function (m) { return "("+m.toUpperCase()+")"; }));
