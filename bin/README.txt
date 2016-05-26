#INFO: Ejecutar javascript en distintos ambientes, sin que se note la diferencia
#SEE: http://www.ibm.com/developerworks/library/j-5things9/
#SEE: http://docs.oracle.com/javase/7/docs/technotes/guides/scripting/programmer_guide/
#ASK: mauriciocap@gmail.com

* El Interprete javascript lo lanza LibRt.java, que ademas le da acceso a otras librerias
** AHORA requiere java17 Y depende del interprete javascript de java17 (el de 18 es distinto :P )
** Agregamos jar para usar Rhino bajo javax.script como dice en 
--------------------------
Download Rhino: https://github.com/downloads/mozilla/rhino/rhino1_7R4.zip
Download JSR-223: svn checkout svn checkout https://svn.java.net/svn/scripting~svn
Yes that is a ~ in the URL!
cd scripting~svn/trunk/engines/javascript/lib
Copy the js.jar from rhino1_7R4.zip into this directory (replace the existing js.jar)
cd ../make
ant clean all
Copy ../build/js-engine.jar AND js.jar (of Rhino) into your classpath
Now change:ScriptEngineManager manager = new ScriptEngineManager();
ScriptEngine engine = manager.getEngineByName(“js“);to:
ScriptEngineManager manager = new ScriptEngineManager();
ScriptEngine engine = manager.getEngineByName(“rhino“);
-------------------------------------
** XXX reescribir usando Rhino SIN javax.script? (agregue una funcion jsEvalRhino, se podrian abstraer javax.script y rhino en una interfase comun)

* Hay que mantener una libreria que "oculte" las diferencias entre ambientes: librt.js que se carga SIEMPRE
** se puede llamar cualquier funcion de java como se ve en librt.js/get_file o en t_gui.js
** imitar las librerias disponibles en mas ambientes como la de phonegap, node, requirejs, etc.

* Se compila con # ./mk
* Para DESPLEGARLO o repartirlo, armamos un jar como con # ./mkjar
** (notar que se pueden empaquetar y leer .js de dentro del jar, que hace todo portable :) )
** Cuando queramos INCLUIR DEPENDENCIAS en el jar VER http://stackoverflow.com/questions/15930782/call-java-jar-myfile-jar-with-additional-classpath-option

* Dependencias
** rdbms h2, El jar se baja de http://repo2.maven.org/maven2/com/h2database/h2/1.4.187/h2-1.4.187.jar
