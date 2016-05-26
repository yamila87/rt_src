dir="x_dir1";
name1="file1.txt";
name2="file2.txt";
path1=dir+"/"+name1;
path2=dir+"/"+name2;
data= ahora().toJSON();

ensure_dir(dir);
set_file(path1,data);
ex1= exists_file(path1);
logm(ex1 ? "NFO": "ERR",1,"TEST FILE EXISTS (recien creada)",{ex1: ex1, path: path1});

delete_file(path2);
copy_file(path1,path2);
ex2= exists_file(path2);
logm(ex2 ? "NFO" : "ERR",1,"TEST FILE COPY (recien copiada)",{ex2: ex2, path: path2});

delete_file(path1);
ex1= exists_file(path1);
logm(!ex1 ? "NFO": "ERR",1,"TEST FILE NOT EXISTS (recien BORRADA)",{ex1: ex1, path: path1});

delete_file(path1);
ex1= exists_file(path1);
logm(!ex1 ? "NFO": "ERR",1,"TEST FILE NOT EXISTS (recien BORRADA aunque no existia)",{ex1: ex1, path: path1});

move_file(path2,path1);
ex1= exists_file(path1);
logm(ex1 ? "NFO": "ERR",1,"TEST FILE MOVE, target exists",{ex1: ex1, path: path1});
ex2= exists_file(path2);
logm(!ex2 ? "NFO" : "ERR",1,"TEST FILE MOVE, src no existe",{ex2: ex2, path: path2});
set_file(path2,"segunda version");
var cantMove= false;
try { move_file(path2,path1); }
catch (ex) { cantMove= true; }
logm((cantMove && exists_file(path2)) ? "NFO" : "ERR",1,"TEST FILE MOVE, dst existe y no se pidio sobreescribir",{cantMove: cantMove, keptSrc: exists_file(path2)});

var cantMove= false;
try { move_file(path2,path1,true); }
catch (ex) { cantMove= true; }
logm((cantMove || exists_file(path2)) ? "ERR" : "NFO",1,"TEST FILE MOVE, dst existe y SI se pidio sobreescribir",{cantMove: cantMove, keptSrc: exists_file(path2)});

d2= get_file(path1);
logm(d2==data ? "NFO" : "ERR",1,"TEST FILE MOVE, mismo contenido",{ex2: ex2, path: path2,data2: d2, data: data});

delete_file(path1);
exD= exists_file(dir);
logm(exD=="dir" ? "NFO" : "ERR",1,"TEST DIR EXISTS",{dir: dir, exists: exD});

delete_file(dir);
exD= exists_file(dir);
logm(!exD ? "NFO" : "ERR",1,"TEST DIR NOT EXISTS (recien borrado)",{dir: dir, exists: exD});
