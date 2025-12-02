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
(2, 'Conference Room B', '../images/ruang a/194_1510807301.67.lg.png', 25),
(3, 'Discussion Room C', '../images/ruang a/meja miting kantor ELSINTA revisi copy.jpg', 5);

CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    room_id INT NOT NULL,
    booking_date DATE NOT NULL,
    booking_time VARCHAR(50) NOT NULL,
    purpose TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);
