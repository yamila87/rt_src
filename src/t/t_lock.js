//XXX: para testear hay que lanzar este script varias veces a la vez, uno solo debe adquirir el lock
lockFilePath= "x.lock";

l= LibRt.lock_file(lockFilePath);
logm("DBG",1,"LOCK",{lock: l!=null});

java.lang.Thread.sleep(5000);

logm("DBG",1,"UNLOCK",{lock: l!=null});
LibRt.unlock_file(l);
