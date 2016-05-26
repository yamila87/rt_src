import org.mozilla.javascript.*;
import java.io.*;
import java.util.*;
import javax.script.*;

public class LibRtJsJdk extends LibRtJs {
	public final static String IMPL="LibRtJsJdk";

	public static ScriptEngine jsEngine() {
		ScriptEngineManager factory = new ScriptEngineManager();
		ScriptEngine engine = factory.getEngineByName(System.getProperty("jsengine","JavaScript")); //XXX: testear bien y cambiar a rhino!
		return engine;
	}

	public ScriptEngine jsEngine; //U: como "ambiente"
	public ScriptContext jsCxt; //U: como "ambiente"

	public static ScriptEngine JsEngineDflt;
	public static ScriptContext JsCxtDflt;
	public LibRtJs jsEval(String js, String srcDesc, LibRtJs jsEnvX,String[] args) throws Exception {
		LibRt.logm("DBG",9,"RT JS EVAL START PATH="+srcDesc+" SRC",js);
		LibRtJsJdk jsEnv= jsEnvX!=null ? (LibRtJsJdk)jsEnvX : new LibRtJsJdk();

		if (jsEnv.jsEngine==null) {
			JsEngineDflt = JsEngineDflt!=null ? JsEngineDflt : jsEngine();
			jsEnv.jsEngine= JsEngineDflt;
		}

		if (jsEnv.jsCxt==null) {
			JsCxtDflt = JsCxtDflt!=null ? JsCxtDflt :  new SimpleScriptContext();
			jsEnv.jsCxt= JsCxtDflt;
		}

		jsEnv.jsEngine.put(ScriptEngine.FILENAME,srcDesc);
		try {
			jsEnv.jsEngine.eval("ARGV="+LibRt.ser_json(args)+";",jsEnv.jsCxt);
			jsEnv.jsEngine.eval(js.replaceFirst("^#[^\r\n]*",""),jsEnv.jsCxt);

			LibRt.logm("DBG",9,"RT JS EVAL END PATH="+srcDesc+" SRC",js);
		}
		catch (Exception ex) {
			LibRt.logmex("ERR",1,"RT JS EVAL PATH="+srcDesc+" SRC",js,ex);
			throw(ex);
		}

		return jsEnv;
	}	

	public Object jsCall(String funcName, LibRtJs jsEnv, Object[] args) throws Exception {
		throw(new Exception("LibRtJsJdk.jsCall NO IMPLEMENTADA!!!"));
	}

	public LibRtJs jsLoadAlone(String path, Hashtable<String,Object> env) { //U: ejecutar un script en un contexto separado (no comparte variables salvo las que le pasemos en el hashtable)
		LibRtJsJdk r= new LibRtJsJdk();
		r.jsCxt= null;
		try {
			r.jsEngine= jsEngine();
			r.jsCxt= new SimpleScriptContext(); 
			Bindings b= r.jsCxt.getBindings(ScriptContext.ENGINE_SCOPE);
			b.put("LibRtMyEnv",r); //U: para load
			jsLoad("librt.js",r,null);
			try {
				b.putAll(env); //U: objetos iniciales
				LibRt.jsLoad(path,r,null); //A: ejecute (si existia)
			}
			finally {
				b.put("LibRtMyEnv",null); //U: para gc
			}
		}
		catch (Exception ex) {
			LibRt.logmex("ERR",1,"JS",null,ex);
		}
		return r;
	}
}
		
