exports.app = function(req) {
    var reqj= req.env.servletRequest;
    var k= reqj.getParameter("k")||"";
    var v= reqj.getParameter("v")||"";
    var a= reqj.getParameter("a")||"r";

    var FS= require('fs');
    if (a=="w") { FS.write("x_"+k,v); }
    var v2= ""; try {v2= FS.read("x_"+k); } catch (ex) {};
    return {
        status: 200,
        headers: {"Content-Type": "text/plain; charset=utf-8"},
        body: ["Hello World!",req.pathInfo+" "+k+" "+v2]
    };
};

if (require.main == module)
    require("ringo/httpserver").main(module.id);

