//INFO: generar un par de claves
//FROM: http://www.jcraft.com/jsch/examples/KeyGen.java.html
addToClasspath('/home/usr10/opt/jgit.sh');

nuevo_keypair= function (filename, comment) {
  var result= null;
  var jsch= new Packages.com.jcraft.jsch.JSch();

  var KeyPair= Packages.com.jcraft.jsch.KeyPair;
  var kpair= KeyPair.genKeyPair(jsch, KeyPair.RSA);
  kpair.writePrivateKey(filename);
  kpair.writePublicKey(filename+".pub", comment);
  print("Finger print: "+kpair.getFingerPrint());
  kpair.dispose();

  var os= new java.io.ByteArrayOutputStream();
  kpair.writePublicKey(os,comment);
  result= new java.lang.String(os.toByteArray());
  print("Key "+result);

  return result;
}

nuevo_keypair("x_key","x@enerminds.com");

