//INFO: se pueden hacer mocks y proxies automagicos? (ej. para "emular" Canvas en java?

//A: no se puede hacer MUY generico (como un autoproxy)
//SEE: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/__lookupGetter__

mkmock= function (name,props,funs) {
	var r= {mock_name: name, mock_st: {}};
	props.map(function (k) { 
		Object.defineProperty(r,k,{ 
			set: function (v) { print("PROP SET "+name+" "+k+" = "+v+"\n"); r.mock_st[k]= v; }, 
			get: function () { print("PROP GET "+name+" "+k+"\n"); return r.mock_st[k]; }, 
	} ) });
	funs.map(function (k) { 
		Object.defineProperty(r,k,{ 
			get: function () { return function () { 
				var a= Array.prototype.slice.call(arguments);	
				print("FUNC "+k+" "+JSON.stringify(a)+"\n");	
			} }
		});
	})
	return r;
}

canvas= mkmock("acanvas",["fillStyle"],["lineTo","moveTo"]);
canvas.fillStyle="red";
print(canvas.fillStyle+"\n");
canvas.moveTo(10,15);
canvas.lineTo(20,25);

