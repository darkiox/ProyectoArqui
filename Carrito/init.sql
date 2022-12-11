CREATE TABLE IF NOT EXISTS users(nombre VARCHAR(50), apellido VARCHAR(50), mail VARCHAR(200), password VARCHAR(32), tipo INT);
CREATE TABLE IF NOT EXISTS stock(id_producto INT, descripcion VARCHAR(100), nventas INT, pcosto INT, pventa INT, disponible INT)
CREATE TABLE IF NOT EXISTS products(sku INT, nombre VARCHAR(50), categoria VARCHAR(50), preciocompra INT, precioventa INT, stock INT, PRIMARY KEY sku);
CREATE TABLE IF NOT EXISTS sales(id INT, sku INT, cantidad INT, valor INT, valortotal INT, fecha date);
CREATE TABLE IF NOT EXISTS purchases(id INT, sku INT, cantidad INT, valor INT, valortotal INT, fecha date);
INSERT INTO users VALUES ('admin', 'admin', 'admin@admin.com', 'adminpassword', 0);
INSERT INTO stock VALUES (1, 'Chocolate', 0, 1000, 1500, 30);
INSERT INTO stock VALUES (2, 'PlayStation', 0, 400000, 450000, 5);
