CREATE TABLE IF NOT EXISTS users(nombre VARCHAR(50), apellido VARCHAR(50), mail VARCHAR(200), password VARCHAR(32), tipo INT);
CREATE TABLE IF NOT EXISTS stock(id_producto INT, descripcion VARCHAR(100), nventas INT, pcosto INT, pventa INT, disponible INT)
INSERT INTO users VALUES ('admin', 'admin', 'admin@admin.com', 'adminpassword', 0);
INSERT INTO stock VALUES (1, 'Chocolate', 0, 1000, 1500, 30);
INSERT INTO stock VALUES (2, 'PlayStation', 0, 400000, 450000, 5);
