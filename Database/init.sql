CREATE TABLE IF NOT EXISTS users(nombre VARCHAR(50), apellido VARCHAR(50), mail VARCHAR(200), password VARCHAR(32), tipo INT);
CREATE TABLE IF NOT EXISTS products(sku SERIAL PRIMARY KEY, nombre VARCHAR(50), categoria VARCHAR(50), preciocompra INT, precioventa INT, stock INT);
CREATE TABLE IF NOT EXISTS sales(id INT, sku INT, cantidad INT, valor INT, valortotal INT, fecha date);
CREATE TABLE IF NOT EXISTS purchases(id INT, sku INT, cantidad INT, valor INT, valortotal INT, fecha date);
INSERT INTO users VALUES ('admin', 'admin', 'admin@admin.com', 'adminpassword', 0);
INSERT INTO products(nombre,categoria,preciocompra,precioventa,stock) VALUES ('Chocolate','Comida', 1000, 1500, 30);
INSERT INTO products(nombre,categoria,preciocompra,precioventa,stock) VALUES ('PlayStation','Electrodomesticos', 400000, 450000, 5);
