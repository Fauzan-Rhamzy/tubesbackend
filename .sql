CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user'
);

-- Insert data users
INSERT INTO users (username, email, password, role) VALUES
('Admin', 'admin@gmail.com', 'admin123', 'admin'),
('John Doe', 'johndoe@gmail.com', 'johndoe123', 'user'),
('Alice', 'alice@gmail.com', 'alice123', 'user');

CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    image_path VARCHAR(255),
    capacity INT
);

-- insert data ruangan
INSERT INTO rooms VALUES 
(1, 'Meeting Room A', '../images/ruang a/Meeting-Room-GST.webp', 10),
(2, 'Ruang Konferensi B', '../images/ruang a/194_1510807301.67.lg.png', 25),
(3, 'Ruang Diskusi C', '../images/ruang a/meja miting kantor ELSINTA revisi copy.jpg', 5);
