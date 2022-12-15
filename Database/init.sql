CREATE TABLE IF NOT EXISTS users(nombre VARCHAR(50), apellido VARCHAR(50), mail VARCHAR(200), password VARCHAR(32), tipo INT);
CREATE TABLE IF NOT EXISTS products(sku SERIAL PRIMARY KEY, nombre VARCHAR(50), categoria VARCHAR(50), preciocompra INT, precioventa INT, stock INT);
CREATE TABLE IF NOT EXISTS sales(id SERIAL PRIMARY KEY, sku INT, cantidad INT, valor INT, valortotal INT, fecha date);
CREATE TABLE IF NOT EXISTS purchases(id INT, sku INT, cantidad INT, valor INT, valortotal INT, fecha date);
INSERT INTO users VALUES ('admin', 'admin', 'admin@admin.com', 'admin', 0);
INSERT INTO users VALUES ('stock', 'stock', 'stock', 'stock', 0);
INSERT INTO users VALUES ('seller', 'seller', 'seller', 'seller', 1);
INSERT INTO products(nombre,categoria,preciocompra,precioventa,stock) VALUES ('Chocolate','Comida', 1000, 1500, 30);
INSERT INTO products(nombre,categoria,preciocompra,precioventa,stock) VALUES ('Doritos','Comida', 1000, 2000, 20);
INSERT INTO products(nombre,categoria,preciocompra,precioventa,stock) VALUES ('Papa Frita','Comida', 800, 1200, 30);
INSERT INTO products(nombre,categoria,preciocompra,precioventa,stock) VALUES ('Masticables','Comida', 100, 200, 100);
INSERT INTO products(nombre,categoria,preciocompra,precioventa,stock) VALUES ('PlayStation 5','Electrodomesticos', 400000, 450000, 5);
INSERT INTO products(nombre,categoria,preciocompra,precioventa,stock) VALUES ('Xbox Serie X','Electrodomesticos', 400000, 450000, 10);
INSERT INTO products(nombre,categoria,preciocompra,precioventa,stock) VALUES ('Microondas','Electrodomesticos', 100000, 150000, 2);
INSERT INTO products(nombre,categoria,preciocompra,precioventa,stock) VALUES ('Zapatilla Roja','Calzado', 30000, 45000, 5);
INSERT INTO products(nombre,categoria,preciocompra,precioventa,stock) VALUES ('Zapato Formal','Calzado', 35000, 50000, 8);
INSERT INTO products(nombre,categoria,preciocompra,precioventa,stock) VALUES ('Camiseta Polo','Vestuario', 25000, 450000, 5);
INSERT INTO sales(sku, cantidad , valor, valortotal, fecha) VALUES (1, 1, 10000, 10000,'2022-12-11'::date);
INSERT INTO sales(sku, cantidad , valor, valortotal, fecha) VALUES (2, 2, 1000, 2000,'2022-11-08'::date); 
INSERT INTO sales(sku, cantidad , valor, valortotal, fecha) VALUES (5, 5, 800, 4000,'2022-08-10'::date);
INSERT INTO sales(sku, cantidad , valor, valortotal, fecha) VALUES (4, 8, 200, 4000,'2022-10-18'::date);
INSERT INTO sales(sku, cantidad , valor, valortotal, fecha) VALUES (5, 7, 600, 4200,'2022-12-08'::date);
INSERT INTO sales(sku, cantidad , valor, valortotal, fecha) VALUES (6, 1, 500, 500,'2022-12-03'::date);
INSERT INTO sales(sku, cantidad , valor, valortotal, fecha) VALUES (8, 1, 300, 300,'2022-11-30'::date);
INSERT INTO sales(sku, cantidad , valor, valortotal, fecha) VALUES (9, 2, 150000, 300000,'2022-02-25');
INSERT INTO sales(sku, cantidad , valor, valortotal, fecha) VALUES (1, 6, 50000, 300000,'2022-10-08');
INSERT INTO purchases(id, sku, cantidad , valor, valortotal, fecha) VALUES (1, 1, 10, 10000, 100000,'2022-12-11');
INSERT INTO purchases(id, sku, cantidad , valor, valortotal, fecha) VALUES (2, 2, 20, 1000, 200000,'2022-11-08');
INSERT INTO purchases(id, sku, cantidad , valor, valortotal, fecha) VALUES (3, 5, 30, 800, 24000,'2022-08-10');
INSERT INTO purchases(id, sku, cantidad , valor, valortotal, fecha) VALUES (4, 4, 100, 200, 20000,'2022-10-18');
INSERT INTO purchases(id, sku, cantidad , valor, valortotal, fecha) VALUES (5, 5, 90, 600, 54000,'2022-12-08');
INSERT INTO purchases(id, sku, cantidad , valor, valortotal, fecha) VALUES (6, 6, 70, 500, 35000,'2022-12-03');
INSERT INTO purchases(id, sku, cantidad , valor, valortotal, fecha) VALUES (7, 8, 9, 300, 2700,'2022-11-30');
INSERT INTO purchases(id, sku, cantidad , valor, valortotal, fecha) VALUES (8, 9, 10, 150000, 1500000,'2022-02-25');
INSERT INTO purchases(id, sku, cantidad , valor, valortotal, fecha) VALUES (9, 1, 12, 50000, 600000,'2022-10-08');
