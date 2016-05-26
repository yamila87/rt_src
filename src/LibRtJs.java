import java.io.*;
import java.util.*;

public abstract class LibRtJs {
	public static String IMPL="ABSTRACT";

	abstract public LibRtJs jsEval(String js, String srcDesc, LibRtJs jsEnv,String[] args) throws Exception; 

	abstract public Object jsCall(String func, LibRtJs jsEnv, Object[] args) throws Exception;

	public LibRtJs jsLoad(String path, LibRtJs jsEnv,String[] args) throws IOException, Exception {
		LibRt.logm("DBG",5,"RT JS LOAD TRY",path);
		java.io.InputStream srcs= null;
		try { srcs= LibRt.class.getResourceAsStream(path); }
		catch (Exception ex) { LibRt.logmex("DBG",9,"RT JS LOAD TRY NOT FOUND AS RESOURCE",path,ex); }
		if (srcs==null) { srcs= new FileInputStream(path); }
		String src= LibRt.get_stream(srcs);
		LibRtJs r= jsEval(src,path,jsEnv,args);
		LibRt.logm("DBG",5,"RT JS LOAD OK",path);
		return r;
	}


	abstract public LibRtJs jsLoadAlone(String path, Hashtable<String,Object> env); //U: ejecutar un script en un contexto separado (no comparte variables salvo las que le pasemos en el hashtable)


}
		
