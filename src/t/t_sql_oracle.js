cxcfg= {url: "jdbc:oracle:thin:@//NEXOS:1521/NEXOS", user: "NEXUS_GIS", pass: "NEXUS_GIS"};

cx= dbCx(cxcfg);
r= dbQueryOne(cx,"select 1+2 from dual",{});
logm("NFO",1,"QUERY",{r:r});

