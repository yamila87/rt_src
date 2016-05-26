//XXX:actualizar con funciones de libgit.js aqui mismo en el rt
importPackage(com.jcraft.jsch);
importPackage(org.eclipse.jgit.api);
importPackage(org.eclipse.jgit.lib);
importPackage(org.eclipse.jgit.storage.file);
importPackage(org.eclipse.jgit.internal.storage.file);
importPackage(org.eclipse.jgit.transport);

CfgMyPrivateKeyPath="/home/usr10/.ssh/id_empio";
CfgTestRepoUrl='git@enerminds.plan.io:enerminds-x_pruebas.x_pruebas_git.git';
CfgRepoLocalDir='x_cloned';

//FROM: http://stackoverflow.com/questions/6861881/jgit-cannot-find-a-tutorial-or-simple-example

//FROM: http://stackoverflow.com/questions/13686643/using-keys-with-jgit-to-access-a-git-repository-securely

gitSsh= function () {
	var SshCfg= new JavaAdapter(JschConfigSessionFactory, {
    configure: function (host, session) {
				print("JSchConfig");
        session.setConfig("StrictHostKeyChecking", "no");
    },
		getJSch: function (hc, fs) {
				print("JSchGet");
        var jsch = this.super$getJSch(hc, fs);
        jsch.removeAllIdentity();
				jsch.addIdentity(CfgMyPrivateKeyPath);
        return jsch;
    }
	});

	SshSessionFactory.setInstance(SshCfg);
}

gitCx= function (dst,url) {
	//FROM: http://stackoverflow.com/questions/13686643/using-keys-with-jgit-to-access-a-git-repository-securely
	var PATH= new java.io.File(dst);
	var builder = new FileRepositoryBuilder();
	var repository = builder.setGitDir(PATH).readEnvironment().findGitDir().build();
	git = new Git(repository);              
	return git;
}

gitCxDir= function(dst) {
	var PATH= new java.io.File(dst+"/.git");
	var git= new Git(new FileRepository(PATH));
	return git;
}

gitclone= function (dst,url) {
	gitSsh();
	var PATH= new java.io.File(dst);
	var git= gitCx(url,dst);
	clone = git.cloneRepository();
	clone.setBare(false);
	clone.setCloneAllBranches(true);
	clone.setDirectory(PATH).setURI(url);
	//login="git"; password="git";
	//user = new UsernamePasswordCredentialsProvider(login, password);                
	//clone.setCredentialsProvider(user);
	clone.call();   
}


gitadd= function (dst,url,fname) {
	var git= gitCxDir(dst);
	var addCmd= git.add();
	addCmd.addFilepattern(fname);
	addCmd.call();
}

gitcommit= function (dst,url,msg) {
	//SEE: http://download.eclipse.org/jgit/docs/jgit-2.0.0.201206130900-r/apidocs/org/eclipse/jgit/api/CommitCommand.html
	var git= gitCxDir(dst);
	var commitCmd = git.commit();
	commitCmd.setMessage(msg);
	commitCmd.call();

	gitSsh();
	git.push().call();
}

gitdiff= function (dst,url) {
	//SEE: https://github.com/eclipse/jgit/blob/master/org.eclipse.jgit/src/org/eclipse/jgit/api/DiffCommand.java
	var git= gitCxDir(dst);
	var diffCmd= git.diff();
	diffCmd.setShowNameAndStatusOnly(true);
	var entries= diffCmd.call();
	logm("DBG",1,"DIFF",toJs(entries));
	return entries;	
}

gitstatus= function(dst,url) {
	var r= {};
	var git= gitCxDir(dst,url);
	var dircache= git.getRepository().readDirCache();
	for (var i=0; i<dircache.getEntryCount(); i++) {
		var e= dircache.getEntry(i);
		var d= {};
		d.tModifiedInCache= e.getLastModified();	
		d.fname= toJs(e.getPathString());
		d.stage= e.getStage();
		d.inAdd= e.isIntentToAdd();
		logm("DBG",1,"ENTRY DIRCACHE",d);
		r[d.fname]= d;
	}
	return r;
}

//gitclone(CfgRepoLocalDir,CfgTestRepoUrl);

gitdiff(CfgRepoLocalDir,CfgTestRepoUrl);
//A: el repo esta clonado
test_file_pathA=CfgRepoLocalDir+"/pruebaQueAgregoACommit.txt"
set_file(test_file_pathA,"Actualizado "+new Date());

test_file_pathB=CfgRepoLocalDir+"/pruebaNuncaAgrego.txt"
set_file(test_file_pathB,"Actualizado "+new Date());

//A: agregue/modifique un archivo
gitdiff(CfgRepoLocalDir,CfgTestRepoUrl);
gitstatus(CfgRepoLocalDir,CfgTestRepoUrl);

gitadd(CfgRepoLocalDir,CfgTestRepoUrl,"pruebaQueAgregoACommit.txt");
//A: puse el archivo para el commit

gitdiff(CfgRepoLocalDir,CfgTestRepoUrl);
gitstatus(CfgRepoLocalDir,CfgTestRepoUrl);
//A: pruebaA esta preparado para el commit pero pruebaB no
gitcommit(CfgRepoLocalDir,CfgTestRepoUrl,"Prueba commit "+new Date());
