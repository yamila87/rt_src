import java.io.*;
import java.text.*;
import java.util.*;
import javax.servlet.*;
import javax.servlet.http.*;
import javax.script.*;

public class LibRtServlet extends HttpServlet {

	public boolean scriptInitialized= false; //U: la primera vez ejecutamos SI O SI single thread y configura cosas
	public boolean wantsSharedJsInstance= true; //U: por defecto quiere un ambiente js por thread
	public LibRtJs sharedJsInstance= null;

	public String cfgAppJs() { //U: el path al js que define la aplicacion web
			return System.getProperty("librt.webapp",System.getProperty("$user.dir",".")+"/0web.js");
	}

	public String cfgStaticPath() { //U: el path al js que define la aplicacion web
			return System.getProperty("librt.webstatic",System.getProperty("$user.dir",".")+"/webstatic");
	}

  public void init() throws ServletException {
    ServletConfig config = this.getServletConfig();
    if (config == null) return;
    try {
      ServletContext sc= config.getServletContext();
			LibRt.logInit(false);
    } catch (Exception e) {
      System.out.println("During LibRtServlet.init(): ");
      e.printStackTrace();
    }
  }

  public void service(HttpServletRequest request,  HttpServletResponse response)
    throws IOException, ServletException {
		if (!webrun(request,response,request.getMethod())) { super.service(request, response); } 
	}

  public void destroy() {
		if (!webrun(null,null,"DESTROY")) { super.destroy(); } 
	}

	public LibRtJs runScriptInNewInstance(Hashtable<String,Object> requestEnv) {
			LibRtJs jsInstance= null;
			try {
				String appjs= cfgAppJs(); 
				LibRt.logm("DBG",5,"SERVLET SCRIPT EXECUTE",appjs);
				jsInstance= LibRt.jsLoadAlone(appjs,requestEnv); //A: ejecute web.js (si existia)
				LibRt.logm("DBG",9,"SERVLET SCRIPT EXECUTED OK",appjs);
			}
			catch (Exception ex) {
				LibRt.logmex("ERR",1,"SERVLET SCRIPT",null,ex);
			}
			return jsInstance;
	}

	public boolean webrun(HttpServletRequest request, HttpServletResponse response, String method) {
		boolean handled= false;
		try {
			LibRt.logm("DBG",9,"SERVLET SCRIPT REQUEST INI",method);
			Hashtable<String,Object> env= new Hashtable<String,Object>();
			env.put("webMethod",method); //A: en javascript tengo una variable webMethod con el metodo
			env.put("webRequest",request); //A: idem request
			env.put("webResponse",response); //A: idem response

			LibRtJs jsInstance;
			synchronized(this) {
				if (!scriptInitialized) { scriptInitialized= true;
					LibRt.logm("DBG",2,"SERVLET SCRIPT REQUEST INITIALIZE ONCE",method);
					//A: somos el PRIMER thread que ejecuta el script
					if (wantsSharedJsInstance && sharedJsInstance==null) { //A: tal vez quiera instancia compartida y no tenemos 
						jsInstance= runScriptInNewInstance(env); //A: ejecute web.js (si existia)
						handled= true;	
						//A: ejecutamos el script y tenemos una instancia inicializada en jsInstance
						wantsSharedJsInstance= false; //DFLT: asumimos que no quiere, pero si hay metodo quiere decir que SI
						try {
							Object[] args= {env};
							Object r= null;
							try { r= jsInstance.jsCall("onWebRequest",jsInstance,args); }
							catch (Exception ex) { LibRt.logmex("ERR",9,"SERVLET SCRIPT TRYING onWebRequest EXCEPTION (not a problem unless you want a shared js instance)",null,ex); }
							if (r !=null) {
								//A: ejecutamos el metodo si estaba
								sharedJsInstance= jsInstance;
								wantsSharedJsInstance= true;
								//A: los proximos threads encuentran instancia compartida que sabemos quiere usar
							}
						}
						catch (Exception ex) { LibRt.logmex("ERR",1,"SERVLET SCRIPT onWebRequest INIT",null,ex); }
					}
					LibRt.logm("NFO",2,"SERVLET SCRIPT REQUEST INITIALIZE ONCE DONE, wants shared instance",wantsSharedJsInstance);
				}
			}
			//A: wantsSharedJsInstance dice lo que configuro el script
			//A: si quiere instancia compartida, tenemos una

			try { //XXX:SOLO GET O POST
				String path = cfgStaticPath()+request.getRequestURI(); //XXX:SEC
				File file= new File(path);
				boolean exists= file.exists();
				if (exists) { 
					LibRt.logm("DBG",7,"SERVLET STATIC FILE USED FOR",path);
      		ServletContext sc = this.getServletConfig().getServletContext();
					String mt= sc.getMimeType(request.getRequestURI());
					response.setContentType(mt);
					//A: pusimos el mime type

					FileInputStream fis= new FileInputStream(file);
					ServletOutputStream sos= response.getOutputStream();
					LibRt.pipe_stream(fis,sos,false);	
					handled= true;
					//A: ya mandamos el archivo
				}	
				else {
					LibRt.logm("DBG",9,"SERVLET STATIC FILE NOT FOUND FOR",path);
				}
			}catch(Exception e) {LibRt.logmex("DBG",9,"SERVLET CACHE SERVING",request.getRequestURI(),e);}
			//A: si habia un archivo en el cache listo para entregar, listo

			if (!handled) { //A: todavia no atendimos el request
				if (wantsSharedJsInstance) {
					LibRt.logm("DBG",9,"SERVLET SCRIPT REQUEST CALL SHARED INSTANCE",method);
					Object[] args= {env};
					sharedJsInstance.jsCall("onWebRequest",sharedJsInstance,args);
					handled= true;	
				}
				else { //A: confirmamos que NO quiere instancia compartida (no puso metodo onWebRequest
					LibRt.logm("DBG",9,"SERVLET SCRIPT REQUEST CALL SEPARATE INSTANCE",method);
					jsInstance= runScriptInNewInstance(env); //A: ejecute web.js (si existia)
					Object[] args= {env};
					try { jsInstance.jsCall("onWebRequest",jsInstance,args); }
					catch (Exception ex) { LibRt.logmex("ERR",9,"SERVLET SCRIPT TRYING onWebRequest EXCEPTION (not a problem unless you want a shared js instance)",null,ex); }
					handled= true;	
				}
			}
		}
		catch (Exception ex) {
			LibRt.logmex("ERR",1,"SERVLET SCRIPT",null,ex);
		}
		LibRt.logm("DBG",9,"SERVLET SCRIPT REQUEST END handled",handled);
		return handled;
	}

}
