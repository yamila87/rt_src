//INFO: borrar un directorio con archivos

ensure_dir("/tmp/pruebaDeleteDir");
ensure_dir("/tmp/pruebaDeleteDir/dir2");
set_file("/tmp/pruebaDeleteDir/hola");
set_file("/tmp/pruebaDeleteDir/dir2/chau");

deleteAll_dir("/tmp/pruebaDeleteDir");
