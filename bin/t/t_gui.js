// Import Java packages and classes
// like import package.*; in Java
importPackage(java.awt);
// like import java.awt.Frame in Java
importClass(java.awt.Frame);
// Create Java Objects by "new ClassName"
var frame = new java.awt.Frame("hello");
// Call Java public methods from script
frame.setVisible(true);
// Access "JavaBean" properties like "fields"
print(frame.title);

