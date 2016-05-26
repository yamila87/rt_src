import org.mozilla.javascript.*;
import java.io.*;
import java.util.*;

public class LibRtJsRhino extends LibRtJs {

	public final static String IMPL="LibRtJsRhino";

	public static LibRtJsRhino Dflt= new LibRtJsRhino();

	public Scriptable jsScope= null;

	public LibRtJs jsEval(String js, String srcDesc, LibRtJs jsEnvX,String[] args) throws Exception {
		LibRt.logm("DBG",9,"RT JS EVAL START PATH="+srcDesc+" SRC",js);
		LibRtJsRhino jsEnv= jsEnvX!=null ? (LibRtJsRhino)jsEnvX : Dflt;
		Context cx = Context.enter();
		try {
			jsEnv.jsScope = jsEnv.jsScope!=null ? jsEnv.jsScope : new ImporterTopLevel(cx);
			Object argsJs = Context.javaToJS(args, jsEnv.jsScope);
			ScriptableObject.putProperty(jsEnv.jsScope, "LibRtMyEnv", Context.javaToJS(jsEnv,jsEnv.jsScope)); 
			ScriptableObject.putProperty(jsEnv.jsScope, "ARGV", argsJs); 
			Object result = cx.evaluateString(jsEnv.jsScope, js, srcDesc, 1, null);
		} finally {
			Context.exit();
		}
		return jsEnv;
	}

	public Object jsCall(String funcName, LibRtJs jsEnvX, Object[] argsJava) throws Exception {
		Object r= null;
		LibRtJsRhino jsEnv= jsEnvX!=null ? (LibRtJsRhino)jsEnvX : Dflt;


		Scriptable scope= jsEnv.jsScope;
		Function fun = (Function)scope.get(funcName, scope);
		Context context = Context.enter();
		try {
			Object rJs = Context.javaToJS(jsEnv, jsEnv.jsScope);
			ScriptableObject.putProperty(jsEnv.jsScope, "LibRtMyEnv", rJs); //U: para load
			Object[] argsJs= null;
			if (argsJava!=null) { argsJs= new Object[argsJava.length];
				for (int i=0; i<argsJava.length; i++) {
					argsJs[i]= Context.javaToJS(argsJava[i], jsEnv.jsScope);
				}
			}
	   	r= fun.call(context, scope, scope, argsJs);
		} finally {
			//XXX:es necesario? ScriptableObject.putProperty(jsEnv.jsScope, "LibRtMyEnv", null); //U: para gc, necesita?
			Context.exit();
		}

		return r;
	}

	public LibRtJs jsLoadAlone(String path, Hashtable<String,Object> env) { //U: ejecutar un script en un contexto separado (no comparte variables salvo las que le pasemos en el hashtable)
		LibRtJsRhino r= new LibRtJsRhino();
		Context cx = Context.enter();
		r.jsScope= new ImporterTopLevel(cx); //cx.initStandardObjects();
		try {
			Object rJs = Context.javaToJS(r, r.jsScope);
			ScriptableObject.putProperty(r.jsScope, "LibRtMyEnv", rJs); //U: para load
			jsLoad("librt.js",r,null);
			try {
				//U: objetos iniciales
		    Enumeration<String> keys = env.keys();
    		while(keys.hasMoreElements()) { String k= keys.nextElement();
					Object oJs = Context.javaToJS(env.get(k), r.jsScope);
					ScriptableObject.putProperty(r.jsScope, k, oJs); //U: para load
  			}
				jsLoad(path,r,null); //A: ejecute (si existia)
			}
			finally {
				//XXX: es necesario? ScriptableObject.putProperty(r.jsScope, "LibRtMyEnv", null); //U: para gc
			}
		}
		catch (Exception ex) { LibRt.logmex("ERR",1,"JS",path,ex); }
		return r;
	}
}
		
