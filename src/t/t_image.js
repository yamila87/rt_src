importClass(java.awt.BasicStroke);
importClass(java.awt.Color);
importClass(java.awt.Font);
importClass(java.awt.FontMetrics);
importClass(java.awt.GradientPaint);
importClass(java.awt.Graphics2D);
importClass(java.awt.geom.Ellipse2D);
importClass(java.awt.image.BufferedImage);
importClass(java.io.File);
importClass(java.io.IOException);

importClass(javax.imageio.ImageIO);

      width = 200, height = 200;

      // TYPE_INT_ARGB specifies the image format: 8-bit RGBA packed
      // into integer pixels
      bi = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
      ig2 = bi.createGraphics();

//S: string
      font = new Font("TimesRoman", Font.BOLD, 20);
      ig2.setFont(font);
      message = "www.java2s.com!";
      fontMetrics = ig2.getFontMetrics();
      stringWidth = fontMetrics.stringWidth(message);
      stringHeight = fontMetrics.getAscent();
      ig2.setPaint(Color.black);
      ig2.drawString(message, (width - stringWidth) / 2, height / 2 + stringHeight / 4);

//S: 
      ImageIO.write(bi, "PNG", new File("x_yourImageName.PNG"));
//      ImageIO.write(bi, "BMP", new File("x_yourImageName.BMP"));
//      ImageIO.write(bi, "gif", new File("x_yourImageName.GIF"));
//      ImageIO.write(bi, "JPEG", new File("x_yourImageName.JPG"));
