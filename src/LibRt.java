
import java.io.*;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.nio.channels.*;
import java.util.*;
import java.util.jar.JarFile;
import java.util.zip.GZIPOutputStream;
import java.util.zip.GZIPInputStream;
import java.util.logging.*;
import java.sql.*;
import java.security.MessageDigest;
import java.security.DigestOutputStream;
import java.security.DigestInputStream;
import java.security.NoSuchAlgorithmException;

import javax.xml.bind.annotation.adapters.HexBinaryAdapter;

import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLClassLoader;
import java.net.MalformedURLException;
import java.net.ProtocolException;

import javax.xml.bind.DatatypeConverter;
import javax.script.*;

import com.google.gson.Gson;

import java.awt.geom.Point2D;

import org.rev6.scf.ScpFile;	
import org.rev6.scf.ScpUpload;
import org.rev6.scf.SshConnection;	
import org.rev6.scf.SshException;


public class LibRt {
	public static String CfgEncodingDflt= "ISO-8859-1"; //U: si no especificamos, un archivo a string se lee con este encoding

	public static final Logger logger= Logger.getLogger("rt");
	public static final String EOL= "\n";
	public static final int BUFF_SZ= 8192;

	public static java.util.Hashtable state= new java.util.Hashtable(); //U: accesible desde javascript para mantener estado entre llamadas AUNQUE los scripts se ejecuten de cero en cada thread

	public static boolean IsLogInitialized= false;
	public static void logInit(boolean force) throws IOException {
		if (!IsLogInitialized || force) {
			LogManager.getLogManager().readConfiguration(LibRt.class.getClassLoader().getResourceAsStream("cfg.logging.properties"));
			String logFile = System.getProperty("CfgLog");
			if (logFile!=null) {
				LogManager.getLogManager().readConfiguration(new FileInputStream(logFile));
			}
			try { LogLvlMax= Integer.parseInt(System.getProperty("LogLvlMax",LogLvlMax+"")); }
			catch(Exception ex){}; //XXX: mostrar mensaje?
		}
	}

	// Primitiva de log
	public static int LogLvlMax= 9; //DFLT
	public static void logm(String t, int lvl, String msg, Object o) {
		//System.out.println("LOG:" + t + ":" + lvl + ":" + msg + ":" + (o != null ? ser_json(o) : ""));
		if (lvl<=LogLvlMax) {
			logger.info(t + ":" + lvl + ":" + msg + ":" + (o != null ? ser_json(o) : ""));
		}
	}

	public static void logmex(String t, int lvl, String msg, Object o, Exception ex) {
		StringBuilder sb= new StringBuilder();
		StackTraceElement se[]= ex.getStackTrace();
		for (int i=0; i<se.length; i++) { sb.append(se[i].getMethodName()+"@"+se[i].getFileName()+"@"+se[i].getLineNumber()); sb.append(" > "); }
		logm(t,lvl,msg+" EXCEPTION "+ex+" "+sb.toString(),o);
	}

	//***************************************************************************
	//S: enc/base64

	public static String enc_base64(String data) throws UnsupportedEncodingException{
		return enc_base64(data.getBytes("UTF-8"));
	}

	public static String enc_base64(byte[] data) throws UnsupportedEncodingException{
		return DatatypeConverter.printBase64Binary(data);
	}

	public static String enc_base64_r_str(String encoded) throws UnsupportedEncodingException{
		return new String(enc_base64_r(encoded),"UTF-8");
	}

	public static byte[] enc_base64_r(String encoded) throws UnsupportedEncodingException{
		return DatatypeConverter.parseBase64Binary(encoded);
	}

	//***************************************************************************
	//S: ser/json
	static final Gson gson= new Gson(); //A: encapsulamos
	//XXX: mejor usar Jackson? cual usan otros proyectos de EM? Por que?

	public static String ser_json(Object o) {
		String s="";
		try { s= gson.toJson(o); } catch (Exception ex) { s= o+""; }
		return s;
	}

	//***************************************************************************
	//S: ser/csv

	public static int serRsCsvToFile(ResultSet resultset, String[] columnNames, String path, int maxRows, String separator) {
		Writer writer;
		try { 
			writer = fileWriter(path); 
		} catch (UnsupportedEncodingException e) { 
			logm("ERR", 0, "FILE WRITER CSV OUTPUT OPEN unsupported encondig", path);
			return -1;
		} catch (FileNotFoundException e) { 
			logm("ERR", 0, "FILE WRITER CSV OUTPUT OPEN file not found", path);
			return -1;
		} catch (IOException e) { 
			logm("ERR", 0, "FILE WRITER CSV OUTPUT OPEN file not found", path);
			return -1;
		}
		//A: writer escribe en el archivo especificado
		return serRsCsvToWriter(resultset,columnNames,writer,maxRows,separator);
	}
	
	
	public static int serDiccCsvToWriter(String str, String path, int maxRows, String separator) {
		Writer writer;
		try { 
			writer = fileWriterAppend(path,false,null); 
			logm("DBG",9,"ABRE WRITER",null);
		} catch (UnsupportedEncodingException e) { 
			logm("ERR", 0, "FILE WRITER CSV OUTPUT OPEN unsupported encondig", path);
			return -1;
		} catch (FileNotFoundException e) { 
			logm("ERR", 0, "FILE WRITER CSV OUTPUT OPEN file not found", path);
			return -1;
		} catch (IOException e) { 
			logm("ERR", 0, "FILE WRITER CSV OUTPUT OPEN file not found", path);
			return -1;
		}
		//A: writer escribe en el archivo especificado
		return serDiccCsvToWriter(str,writer,maxRows,separator);
	}
	
	
	

	public static String[] dbRsColumnNames(ResultSet resultset) throws SQLException {
		java.util.Vector<String> rv= new java.util.Vector<String>();
		if (resultset!=null) {
			logm("DBG", 9, "ColumnCount=0 Calculando cantidad columnas desde metadata", null);
			ResultSetMetaData md= resultset.getMetaData();
			int columnCount = md.getColumnCount();
			logm("DBG", 9, "ColumnCount", columnCount);
			for (int i = 1; i <= columnCount; i++) {
				rv.add(md.getColumnName(i).toLowerCase());
			}
		}
		String[] r=	rv.toArray(new String[0]);
		logm("DBG",9,"DB dbRsColumnNames",r);
		return r;
	}

	public static int serRsCsvToWriter(ResultSet resultset, String[] columnNames, Writer writer, int maxRows, String separator) {
		int counter = 0;
		if (resultset!=null) {
			if (columnNames==null) {
				try {
					logm("NFO", 9, "CSV titulos, obteniendo desde metadata", null);
					columnNames = dbRsColumnNames(resultset);
				} catch (SQLException e) {
					logmex("ERR", 1, "CSV titulos, obteniendo desde metadata", null,e);
					return -1;
				}
			}
			logm("DBG",7,"CSV titulos",columnNames);
			//A: columnCount tiene el valor especificado o el default

			int columnCount= columnNames.length;
			// Itero el resultset escribiendo el output
			try {
				//XXX:OPCION escape separator si aparece en un valor?
				
				logm("DBG",4,"ESCRIBIENDO ARCHIVO",resultset);
				
				for (int i = 0; i < columnCount-1; i++) {
					logm("DBG",9,"ESCRIBE COL: ",columnNames[i]);
					writer.write(columnNames[i]); writer.write(separator);
				}
				
				
				writer.write(columnNames[columnCount-1]);
				writer.write(EOL);
				
				logm("DBG",4,"SE ESCRIBIO LINEA DE COLUMNAS",null);
				logm("DBG",4,"COUNTER",counter);
				logm("DBG",4,"MAXROWS",maxRows);
				//A: escribi los nombres de las columnas
				
				boolean hasNext = resultset.next();
				
				logm("DBG",4,"NEXT",hasNext);
				
				while ((counter<maxRows || maxRows<0) && hasNext) {
					
					logm("DBG",4,"Escribiendo fila :",counter);
					
					String buf;
					for (int i = 1; i < columnCount; i++) {
				
						if ((buf = resultset.getString(i)) != null) { writer.write(buf); }
						
						logm("DBG",9,"STR",buf);
						
						writer.write(separator);
					}
					if ((buf = resultset.getString(columnCount)) != null) { writer.write(buf); }
					
					
					logm("DBG",9,"STR",buf);
					
					writer.write(EOL);
					counter++;
					//XXX:loguear un cartelito ej. cada 1000
					hasNext = resultset.next();

				}
				
				logm("DBG",2,"termino de escribir lineas",null);
				
			} catch (SQLException s) {
				logmex("ERR", 0, "DB leyendo resultset para CSV", null,s);
				return -1;
			} catch (IOException e) {
				logmex("ERR", 0, "FILE WRITER CSV OUTPUT writing", null,e);
				return -1;
			}
		}
		else {
			logm("NFO",3,"DB FILE CSV RESULTSET IS NULL, was expected?",null);
		}
		try { writer.close(); } 
		catch (IOException e) {
			logmex("ERR", 0, "FILE WRITER CSV OUTPUT closing", null,e);
			return -1;
		}
		return counter;
	}

	
	
	@SuppressWarnings("unchecked")
	public static int serDiccCsvToWriter(String csv, Writer writer, int maxRows, String separator) {
		int counter = 0;

		if (csv!=null) {
			try{
				writer.write(csv);
				writer.write(EOL);

			}  catch (IOException e) {
				logmex("ERR", 0, "FILE WRITER CSV OUTPUT writing", null,e);
				return -1;
			} 
		}
		else {
			logm("NFO",3,"DB FILE CSV RESULTSET IS NULL, was expected?",null);
		}

		return counter;
	}
	
	public static int serDiccGroupByToWriter(ResultSet rs, Writer writer, int maxRows,String idPor,String []idAcumulados ,String campoAcumuladoNombre){
		int rowsCount=0;
		
		try {
			
			ArrayList<String> acumulado = null;
			String idActual=null;
			StringBuilder reg = null;			
			reg = new StringBuilder();
			String value = "";
				
			if(rs!=null){
				ResultSetMetaData rsm = rs.getMetaData();
				int countCol = rsm.getColumnCount();
				String name = "";
				for(int i = 1 ; i<=countCol ; i++){
					name=rsm.getColumnName(i);
					reg.append(name.toLowerCase()).append("\t");
				}
				reg.append(campoAcumuladoNombre);
				
				writer.write(reg.toString()+EOL);
										
				while(rs.next() ){					
					if(idActual==null){					
						reg = new StringBuilder();
						acumulado = new ArrayList<String>();
						idActual = rs.getString(idPor);


						for(int i = 1;i<=countCol;i++){						
							reg.append(rs.getString(i)).append("\t");
						}
						
						for(String id : idAcumulados){
							value =rs.getString(id);
							if(!rs.wasNull()){
								acumulado.add(rs.getString(id));
							}
						}
						
					}else{
						
						if(idActual.equals(rs.getString(idPor))){
							for(String id : idAcumulados){
								value =rs.getString(id);
								if(!rs.wasNull()){
									acumulado.add(rs.getString(id));
								}
							}
						}else{
							if(acumulado.size()>0){
								for(String str : acumulado){
									reg.append(str).append(",");
								}
								reg.deleteCharAt(reg.length()-1);
							}	
							reg.append(EOL);
							
							writer.write(reg.toString());
							rowsCount++;
							if(maxRows == rowsCount){
								break;
							}
							
							idActual= rs.getString(idPor);
							reg = new StringBuilder();
							acumulado = new ArrayList<String>();
							
							for(int i = 1;i<=countCol;i++){						
								reg.append(rs.getString(i)).append("\t");
							}
							
							for(String id : idAcumulados){
								value =rs.getString(id);
								if(!rs.wasNull()){
									acumulado.add(rs.getString(id));
								}
							}
							
						}	
					}					
				}	
			}
		} catch (SQLException e) {
			logm("ERR",1,"Error al escribir registros",e);
		} catch (IOException e) {
			logm("ERR",1,"Error al escribir registros",e);
		}
		return rowsCount;
	}
	
	public static void closeWriterAppend(Writer writer){
		try { writer.close(); } 
		catch (IOException e) {
			logmex("ERR", 0, "FILE WRITER CSV OUTPUT closing", null,e);
		}
	}
	
	//***************************************************************************
	//S: db
	public static int dbRsColumnCount(ResultSet rs) throws SQLException {
		return rs.getMetaData().getColumnCount();
	}

	//***************************************************************************
	//S: digest
	public static MessageDigest digestCalc(String algorithm) throws NoSuchAlgorithmException {
		return MessageDigest.getInstance(algorithm);
	}

	public static String digestHexStr(MessageDigest digestCalc) {
		return (new HexBinaryAdapter()).marshal(digestCalc.digest());
	}

	public static String digest(String data, String algorithm) throws NoSuchAlgorithmException {
		MessageDigest calc= digestCalc(algorithm);
		calc.update(data.getBytes());
		return digestHexStr(calc);
	}

	//***************************************************************************
	//S: file
	public static Writer fileWriter(String path) throws UnsupportedEncodingException, FileNotFoundException, IOException {
		return fileWriter(path,false,null);
	}

	public static Writer fileWriter(String path, boolean zip, MessageDigest digestCalc) throws UnsupportedEncodingException, FileNotFoundException, IOException {
		return streamWriter(new FileOutputStream(path),zip,digestCalc);
	}
	
	public static Writer fileWriterAppend(String path, boolean zip, MessageDigest digestCalc) throws UnsupportedEncodingException, FileNotFoundException, IOException {
		return streamWriter(new FileOutputStream(path,true),zip,digestCalc);
	}

	public static OutputStream streamForOutput_file(String path, boolean zip, MessageDigest digestCalc) throws UnsupportedEncodingException, FileNotFoundException, IOException {
		return streamForOutput(new FileOutputStream(path),zip,digestCalc);
	}

	public static OutputStream streamForOutput(OutputStream os, boolean zip, MessageDigest digestCalc) throws UnsupportedEncodingException, FileNotFoundException, IOException {
		OutputStream dos= digestCalc!=null ? new DigestOutputStream(os,digestCalc) : os;
		OutputStream zos= zip ? new GZIPOutputStream(dos) : dos;
		return zos;
	}

	public static Writer streamWriter(OutputStream os, boolean zip, MessageDigest digestCalc) throws UnsupportedEncodingException, FileNotFoundException, IOException {
		return new BufferedWriter(new OutputStreamWriter(streamForOutput(os,zip,digestCalc), "utf-8"));
	}

	public static InputStream streamForInput_file(String path, boolean zip, MessageDigest digestCalc) throws UnsupportedEncodingException, FileNotFoundException, IOException {
		return streamForInput(new FileInputStream(path),zip,digestCalc);
	}


	public static Reader fileReader(String path, boolean zip, MessageDigest digestCalc) throws UnsupportedEncodingException, FileNotFoundException, IOException {
		return streamReader(new FileInputStream(path),zip,digestCalc);
	}

	public static InputStream streamForInput(InputStream fis, boolean zip, MessageDigest digestCalc) throws UnsupportedEncodingException, FileNotFoundException, IOException {
		InputStream dis= digestCalc!=null ? new DigestInputStream(fis,digestCalc) : fis;
		InputStream zis= zip ? new GZIPInputStream(dis) : dis;
		return zis;
	}

	public static Reader streamReader(InputStream fis, boolean zip, MessageDigest digestCalc) throws UnsupportedEncodingException, FileNotFoundException, IOException {
		return new BufferedReader(new InputStreamReader(streamForInput(fis,zip,digestCalc))); //, "utf-8"));
	}

	public static int pipe_stream(InputStream is, OutputStream os,boolean wantsKeepOpen) throws IOException { //U: copia de un stream al otro
		int cnt= 0; int n; byte[] buffer = new byte[BUFF_SZ];
		while((n = is.read(buffer)) > -1) { cnt+=n; os.write(buffer, 0, n); }
		if (!wantsKeepOpen) { is.close(); os.close(); }
		return cnt;
	}

	public static String get_stream(Reader isr) throws IOException {
		char[] buffer = new char[BUFF_SZ];
		StringBuilder out = new StringBuilder();
		logm("DBG",9,"STREAM GET",isr+"");
		for (;;) {
			int rsz = isr.read(buffer, 0, buffer.length);
			logm("DBG",9,"STREAM GET READ",rsz);
			if (rsz < 0) break; 
			out.append(buffer, 0, rsz);
		}
		String s= out.toString();
		logm("DBG",9,"STREAM GET RESULT",s);
		return s;
	}

		public static String get_stream(InputStream is) throws IOException {
			return get_stream(is,CfgEncodingDflt);
		}

		public static String get_stream(InputStream is, String encoding) throws IOException {
			if (encoding==null) { encoding= CfgEncodingDflt; }
			byte[] buffer = new byte[BUFF_SZ];
			StringBuilder out = new StringBuilder();
			logm("DBG",9,"STREAM GET",is+"");
			for (;;) {
				int rsz = is.read(buffer, 0, buffer.length);
				logm("DBG",9,"STREAM GET READ",rsz);
				if (rsz < 0) break; 
				out.append(new String(buffer,0,rsz,encoding));
			}
			String s= out.toString();
			logm("DBG",9,"STREAM GET RESULT",s);
			return s;
		}

		public static void set_stream(OutputStream os,String data,String encoding) throws IOException {
			os.write(data.getBytes(encoding));
			os.close();
		}

		public static void set_stream(Writer os,String data) throws IOException {
			os.write(data);
			os.close();
		}

		public static String get_file(String path,boolean gzip,MessageDigest digestCalc,String encoding) throws UnsupportedEncodingException, IOException {
			try {
				return get_stream(streamForInput_file(path,gzip,digestCalc));
			}
			catch (FileNotFoundException ex) {
				return "";
			}
		}

		public static String get_resource(String path) throws IOException {
			java.io.InputStream srcs= null;
			try { 
				srcs= LibRt.class.getResourceAsStream(path); 
				return get_stream(srcs);
			}
			catch (IOException ex) { LibRt.logmex("DBG",9,"RT GET_RESOURCE",path,ex); throw(ex);}
		}

		public static String get_resourceOrFile(String path,boolean gzip,MessageDigest digestCalc,String encoding) throws UnsupportedEncodingException, IOException {
			try { return get_resource(path); }
			catch (IOException ex) { return get_file(path,gzip,digestCalc,encoding); }
		}

		public static void set_file(String path,String data, boolean gzip,MessageDigest digestCalc,String encoding) throws UnsupportedEncodingException, IOException {
			set_stream(streamForOutput_file(path,gzip,digestCalc),data,CfgEncodingDflt);
		}

		public static String[] get_filelist(String path, boolean nodirs, boolean nofiles) {
			File folder = new File(path);
			if (folder.isDirectory()) {
				File[] listOfFiles = folder.listFiles();
				java.util.Vector<String> r= new java.util.Vector<String>();
				for (int i = 0; listOfFiles!=null && i < listOfFiles.length; i++) {
					if ( (listOfFiles[i].isFile() && !nofiles) || (listOfFiles[i].isDirectory() && !nodirs) ) {
						r.add(listOfFiles[i].getName());
					}
				}
				return r.toArray(new String[0]);
			}
			else {
				return null; //A: no existe o no es directorio
			}
		}


		public static FileLock lock_file(String path) throws IOException, FileNotFoundException {
			RandomAccessFile file = new RandomAccessFile(path, "rw");
			FileChannel fileChannel = file.getChannel();
			return fileChannel.tryLock();
		}

		public static boolean unlock_file(FileLock fileLock)  throws IOException, FileNotFoundException{
			if (fileLock != null){ fileLock.release(); return true; }
			return false;
		}

		public static String temp_filePath(String namePattern, String ext)  throws IOException, FileNotFoundException {
			File temp = File.createTempFile("temp-file-name", ".tmp"); 
			return temp.getAbsolutePath();
		}

		//***************************************************************************
		//S File: scp = copiar sobre ssh
		public static void set_file_scp(String srcFilePath, String dstUrl, String dstFilePath, String dstUser, String dstPass, String keyFilePath) throws SshException {	    
			//SEE: http://code.google.com/p/securechannelfacade/source/browse/trunk/src/main/java/org/rev6/scf/SshConnection.java?r=12
			SshConnection sshCx = null;
			String[] nameAndPort= dstUrl.split(":"); 
			int dstPort= nameAndPort.length>1 ? Integer.parseInt(nameAndPort[1]) : 22;
			try{
				if (keyFilePath==null) {
					sshCx = new SshConnection(nameAndPort[0],dstUser,dstPass);
					logm("DBG",7,"NET SSH CONNECT TO {HOST: '"+nameAndPort[0]+"', PORT:"+dstPort+", USER:'"+dstUser+"', auth: '"+"pass"+"'}",null);
				}
				else {
					sshCx = new SshConnection(nameAndPort[0],dstUser,new File(keyFilePath));
					logm("DBG",7,"NET SSH CONNECT TO {HOST: '"+nameAndPort[0]+"', PORT:"+dstPort+", USER:'"+dstUser+"', auth: 'key', keyfile: '"+keyFilePath+"'}",null);
				}

				sshCx.setPort(dstPort);
				sshCx.connect();
				ScpFile scpFile = new ScpFile(new File(srcFilePath),dstFilePath);
				sshCx.executeTask(new ScpUpload(scpFile));
			}
			finally{
				if (sshCx != null) { sshCx.disconnect(); }
			}
		}

		public static void set_file_scp_pass(String srcFilePath,String dstUrl,String dstFilePath, String dstUser, String dstPass) throws SshException {	    
			set_file_scp(srcFilePath, dstUrl, dstFilePath, dstUser, dstPass, null);
		}


		public static void set_file_scp_key(String srcFilePath,String dstUrl, String dstFilePath, String dstUser, String keyFilePath) throws SshException {
			set_file_scp(srcFilePath, dstUrl, dstFilePath, dstUser, null, keyFilePath);
		}


		//***************************************************************************
		//S: net/http 
		public static HttpURLConnection httpCx(String url, String method, String usr, String pass) throws MalformedURLException, IOException, ProtocolException {
			//NB:https requiere HAVA_HOME para encontrar los certificados!
			URL obj = new URL(url);
			HttpURLConnection cx = (HttpURLConnection) obj.openConnection();
			cx.setRequestMethod(method);
			if (usr!="") {
				String basicAuth = "Basic " + new String(enc_base64(usr + ":" + pass));
				cx.setRequestProperty ("Authorization", basicAuth);
			}
			//A: parameters set

			return cx; 
		} 

		public static void httpWrite(HttpURLConnection cx, String data) throws IOException, ProtocolException {
			cx.setDoOutput(true);
			DataOutputStream wr = new DataOutputStream(cx.getOutputStream());
			wr.writeBytes(data);
			wr.flush();
			wr.close();
		}	

		public static String httpRead(HttpURLConnection cx) throws UnsupportedEncodingException, IOException {
			//int responseCode = con.getResponseCode();
			return get_stream(cx.getInputStream());
		}

		public static String get_http(String url, String method, String data, String usr, String pass) throws IOException, ProtocolException, UnsupportedEncodingException {
			HttpURLConnection cx= httpCx(url,method, usr, pass);
			if (data!=null) { httpWrite(cx,data); }	
			return httpRead(cx);
		}

		//****************************************************************************
		//S: Javascript
		public static LibRtJs JsImpl= System.getProperty("jsImpl","RHINO").equals("JDK") ? new LibRtJsJdk() : new LibRtJsRhino();

		public static LibRtJs jsEval(String js, String srcDesc, LibRtJs jsEnv,String[] args) throws Exception {
			logm("DBG",9,"RT JS EVAL START PATH="+srcDesc+" SRC",js);
			return JsImpl.jsEval(js,srcDesc,jsEnv,args);
		}	

		public static Object jsCall(String funName, LibRtJs jsEnv,Object[] args) throws IOException, Exception {
			logm("DBG",5,"RT JS CALL TRY",funName);
			return JsImpl.jsCall(funName,jsEnv,args);
		}


		public static LibRtJs jsLoad(String path, LibRtJs jsEnv,String[] args) throws IOException, Exception {
			logm("DBG",5,"RT JS LOAD TRY",path);
			return JsImpl.jsLoad(path,jsEnv,args);
		}

		public static LibRtJs jsLoadAlone(String path, Hashtable<String,Object> env) { //U: ejecutar un script en un contexto separado (no comparte variables salvo las que le pasemos en el hashtable)
			return JsImpl.jsLoadAlone(path,env);
		}

		//****************************************************************************
		//S: paths

		public static String runtimePath() throws java.net.URISyntaxException, java.net.MalformedURLException { //U: para cargar librerias y assets, etc.
			//SEE: http://stackoverflow.com/questions/320542/how-to-get-the-path-of-a-running-jar-file
			URL url = LibRt.class.getResource(LibRt.class.getSimpleName() + ".class");
			logm("DBG",1,"RT runtimePath URL",url);
			URL urlOk= (url.getProtocol()=="jar" ? new URL(url.getPath()) : url);
			logm("DBG",1,"RT runtimePath URL OK",urlOk);
			return new File( urlOk.toURI() ).getParentFile().getPath();
		}

		//****************************************************************************
		//S: main
		public static void init() throws Exception {
			logInit(false);
		}

		public static void main(String[] args) throws Exception {
			init();
			String mainPath= args.length>0 ? args[0] : "0inicio.js";
			try {
				jsLoad("librt.js",null,args);
				jsLoad(mainPath,null,args);
			}
			catch (Exception ex) {
				ex.printStackTrace();
				logmex("ERR",1,"RT RUNNING SCRIPTS",null,ex);
			}
		}

		private static Class<?> getClassFromJar (String pathToJar, String pkg, String classToGet) throws IOException, ClassNotFoundException, 
						SecurityException, InstantiationException, IllegalAccessException, NoSuchMethodException, IllegalArgumentException, 
						InvocationTargetException {

							JarFile jarFile = new JarFile(pathToJar);
							Enumeration e = jarFile.entries();

							URL[] urls = { new URL("jar:file:" + pathToJar + "!/") };
							ClassLoader cl = URLClassLoader.newInstance(urls);

							Class<?> c = Class.forName(pkg+"."+classToGet, true, cl);

							return c;
						}

		public static void executeMethodClass(String pathToJar, String pkg, String classToGet, String methodName, String pathToFile, 
				long logIdSyncMin, long logIdSyncMax) throws IOException, ClassNotFoundException, SecurityException, 
					 InstantiationException, IllegalAccessException, NoSuchMethodException, IllegalArgumentException, 
					 InvocationTargetException {
						 Class<?> c = getClassFromJar(pathToJar, pkg, classToGet); 
						 Method  method = c.getDeclaredMethod (methodName, String.class, long.class, long.class);
						 method.invoke (null, pathToFile, logIdSyncMin, logIdSyncMax);
					 }

	}
		
