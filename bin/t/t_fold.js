lista= [1,2,3,4,5];
suma= fold(lista,function (e,i,acc) { return(acc+e) ; },0);
logm("DBG",1,"SUMA",suma);
fact= fold(lista,function (e,i,acc) { return(acc*e) ; },1);
logm("DBG",1,"fact",fact);
