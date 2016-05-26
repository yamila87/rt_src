LibCoord= Packages.LibGeoCoord;

ElipsoideIntl1924Major= 6378388.0;
ElipsoideIntl1924Flattening= 1/297.0;
LatMax= -39.2;
LatMin= -23.4;
LatOrigenRad= ((LatMax-LatMin)/2.0+LatMin)*Math.PI/180.0;
LongMin=-61.5;
LongMax=-58.5;
	
LongCentroRad=((LongMax-LongMin)/2.0+LongMin)*Math.PI/180.0;

XFalseMin=5346654.6134;
XFalseMax=5653345.3866;
XFalseCentro=((XFalseMax-XFalseMin)/2.0+XFalseMin)+91.878675789;

YFalseMin= 5660435.2104;
YFalseMax= 7412620.6223;
YFalseCentro= ((YFalseMax-YFalseMin)/2.0+YFalseMin)+1463.211680856;

Scale= 1.0;
	
/*
	AMENABAR y OLLEROS: 
	DbCv: "x":56427019,"y":61738567  
	Leaflet: LatLng(-34.57307, -58.44539) Point(11329711, 20215142) 
	Conversion: xdb= xmap - 11329711 + 56427019; ydb= ymap - 20215142 +61738567 ; 
*/

x=56427019/10; y=61738567/10; 

converter= new Packages.LibGeoCoord();
converter.setTransverseMercatorParameters(ElipsoideIntl1924Major,ElipsoideIntl1924Flattening,LatOrigenRad,LongCentroRad,XFalseCentro,YFalseCentro,Scale);
converter.convertTransverseMercatorToGeodetic(x,y);
print("R: "+converter.getLatitude()*180/Math.PI + "," + converter.getLongitude()*180/Math.PI+"\n");
	
