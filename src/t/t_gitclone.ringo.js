//XXX:actualizar con funciones de libgit.js aqui mismo en el rt

addToClasspath= this.addToClasspath || function () {};
module= this.module || { resolve: function () {}};
addToClasspath(module.resolve("../../lib/jar/jgit.sh"));
addToClasspath(module.resolve("."));

importPackage(org.eclipse.jgit.api);
importPackage(org.eclipse.jgit.lib);
importPackage(org.eclipse.jgit.storage.file);
importPackage(org.eclipse.jgit.transport);
importPackage(com.jcraft.jsch);


//FROM: http://stackoverflow.com/questions/13686643/using-keys-with-jgit-to-access-a-git-repository-securely
var SshCfg= new JavaAdapter(JschConfigSessionFactory, {
    configure: function (host, session) {
        session.setConfig("StrictHostKeyChecking", "no");
    },
		getJSch: function (hc, fs) {
        var jsch = this.super$getJSch(hc, fs);
        jsch.removeAllIdentity();
				jsch.addIdentity("/home/usr10/.ssh/id_empio");
        return jsch;
    }
});

gitclone= function (url, dst) {
	PATH= new java.io.File("x_cloned");
	url="git@enerminds.plan.io:enerminds-c_desarrollo.viz_mapa.git";
	login="git";
	password="git";

	//FROM: http://stackoverflow.com/questions/13686643/using-keys-with-jgit-to-access-a-git-repository-securely

	jsch = new JSch();

	jschConfigSessionFactory = SshCfg;
	//jsch.setKnownHosts(".ssh/known_hosts");

	SshSessionFactory.setInstance(jschConfigSessionFactory);

	builder = new FileRepositoryBuilder();
	repository = builder.setGitDir(PATH).readEnvironment().findGitDir().build();

	git = new Git(repository);              
	clone = git.cloneRepository();
	clone.setBare(false);
	clone.setCloneAllBranches(true);
	clone.setDirectory(PATH).setURI(url);
	user = new UsernamePasswordCredentialsProvider(login, password);                
	clone.setCredentialsProvider(user);
	clone.call();   
}

gitclone("","");
