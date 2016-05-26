importPackage(java.awt);
importPackage(java.awt.event);
importPackage(java.awt.geom);
importPackage(javax.swing);
importClass(java.awt.geom.Ellipse2D);
importClass(java.awt.image.BufferedImage);
importClass(java.io.File);
importClass(java.io.IOException);
importClass(javax.imageio.ImageIO);

imgNew= function (width,height) {
    width = 200, height = 200;
    // TYPE_INT_ARGB specifies the image format: 8-bit RGBA packed
    // into integer pixels
    bi = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
    ig2 = bi.createGraphics();
}

imgSave= function (img,path,fmt) {
      ImageIO.write(bi, "PNG", new File("x_yourImageName.PNG"));
//      ImageIO.write(bi, "BMP", new File("x_yourImageName.BMP"));
//      ImageIO.write(bi, "gif", new File("x_yourImageName.GIF"));
//      ImageIO.write(bi, "JPEG", new File("x_yourImageName.JPG"));
}

img= imgNew();

maxCharHeight = 15;
minFontSize = 6;

bg = Color.white;
fg = Color.black;
red = Color.red;
white = Color.white;

stroke = new BasicStroke(2.0);
wideStroke = new BasicStroke(8.0);

dash1 = [10.0];
dashed = new BasicStroke(1.0, BasicStroke.CAP_BUTT, BasicStroke.JOIN_MITER, 10.0, dash1, 0.0);

g2 =  ig2;
g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
d = g2.getSize();
gridWidth = d.width / 6;
gridHeight = d.height / 2;

fontMetrics = pickFont(g2, "Filled and Stroked GeneralPath", gridWidth);

fg3D = Color.lightGray;

g2.setPaint(fg3D);
g2.draw3DRect(0, 0, d.width - 1, d.height - 1, true);
g2.draw3DRect(3, 3, d.width - 7, d.height - 7, false);
g2.setPaint(fg);

x = 5;
y = 7;
rectWidth = gridWidth - 2*x;
stringY = gridHeight - 3 - fontMetrics.getDescent();
rectHeight = stringY - fontMetrics.getMaxAscent() - y - 2;

        // draw Line2D.Double
        g2.draw(new Line2D.Double(x, y+rectHeight-1, x + rectWidth, y));
/*
        g2.drawString("Line2D", x, stringY);
        x += gridWidth;

        // draw Rectangle2D.Double
        g2.setStroke(stroke);
        g2.draw(new Rectangle2D.Double(x, y, rectWidth, rectHeight));
        g2.drawString("Rectangle2D", x, stringY);
        x += gridWidth;      

        // draw  RoundRectangle2D.Double
        g2.setStroke(dashed);
        g2.draw(new RoundRectangle2D.Double(x, y, rectWidth, 
                                            rectHeight, 10, 10));
        g2.drawString("RoundRectangle2D", x, stringY);
        x += gridWidth;

        // draw Arc2D.Double       
        g2.setStroke(wideStroke);
        g2.draw(new Arc2D.Double(x, y, rectWidth, rectHeight, 90, 
                                 135, Arc2D.OPEN));
        g2.drawString("Arc2D", x, stringY);
        x += gridWidth;

        // draw Ellipse2D.Double
        g2.setStroke(stroke);
        g2.draw(new Ellipse2D.Double(x, y, rectWidth, rectHeight));
        g2.drawString("Ellipse2D", x, stringY);
        x += gridWidth;

        // draw GeneralPath (polygon)
        int x1Points[] = {x, x+rectWidth, x, x+rectWidth};
        int y1Points[] = {y, y+rectHeight, y+rectHeight, y};
        GeneralPath polygon = new GeneralPath(GeneralPath.WIND_EVEN_ODD,
                                              x1Points.length);
        polygon.moveTo(x1Points[0], y1Points[0]);
        for ( int index = 1; index < x1Points.length; index++ ) {
            polygon.lineTo(x1Points[index], y1Points[index]);
        };
        polygon.closePath();

        g2.draw(polygon);
        g2.drawString("GeneralPath", x, stringY);

        // NEW ROW
        x = 5;
        y += gridHeight;
        stringY += gridHeight;

        // draw GeneralPath (polyline)

        int x2Points[] = {x, x+rectWidth, x, x+rectWidth};
        int y2Points[] = {y, y+rectHeight, y+rectHeight, y};
        GeneralPath polyline = new GeneralPath(GeneralPath.WIND_EVEN_ODD,
                                               x2Points.length);
        polyline.moveTo (x2Points[0], y2Points[0]);
        for ( int index = 1; index < x2Points.length; index++ ) {
            polyline.lineTo(x2Points[index], y2Points[index]);
        };

        g2.draw(polyline);
        g2.drawString("GeneralPath (open)", x, stringY);
        x += gridWidth;

        // fill Rectangle2D.Double (red)
        g2.setPaint(red);
        g2.fill(new Rectangle2D.Double(x, y, rectWidth, rectHeight));
        g2.setPaint(fg);
        g2.drawString("Filled Rectangle2D", x, stringY);
        x += gridWidth;        

        // fill RoundRectangle2D.Double
        GradientPaint redtowhite = new GradientPaint(x,y,red,x+rectWidth, y,white);
        g2.setPaint(redtowhite);
        g2.fill(new RoundRectangle2D.Double(x, y, rectWidth, 
                                            rectHeight, 10, 10));
        g2.setPaint(fg);
        g2.drawString("Filled RoundRectangle2D", x, stringY);
        x += gridWidth;

        // fill Arc2D 
        g2.setPaint(red);
        g2.fill(new Arc2D.Double(x, y, rectWidth, rectHeight, 90, 
                                 135, Arc2D.OPEN));
        g2.setPaint(fg);
        g2.drawString("Filled Arc2D", x, stringY);
        x += gridWidth;

        // fill Ellipse2D.Double
        redtowhite = new GradientPaint(x,y,red,x+rectWidth, y,white);
        g2.setPaint(redtowhite);
        g2.fill (new Ellipse2D.Double(x, y, rectWidth, rectHeight));
        g2.setPaint(fg);
        g2.drawString("Filled Ellipse2D", x, stringY);
        x += gridWidth;



        // fill and stroke GeneralPath
        int x3Points[] = {x, x+rectWidth, x, x+rectWidth};
        int y3Points[] = {y, y+rectHeight, y+rectHeight, y};
        GeneralPath filledPolygon = new GeneralPath(GeneralPath.WIND_EVEN_ODD,
                                                    x3Points.length);
        filledPolygon.moveTo(x3Points[0], y3Points[0]);
        for ( int index = 1; index < x3Points.length; index++ ) {
            filledPolygon.lineTo(x3Points[index], y3Points[index]);
        };
        filledPolygon.closePath();
        g2.setPaint(red);
        g2.fill(filledPolygon);
        g2.setPaint(fg);
        g2.draw(filledPolygon);
        g2.drawString("Filled and Stroked GeneralPath", x, stringY);
    }

*/
