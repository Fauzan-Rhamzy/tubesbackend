CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user'
);

-- Insert data users
INSERT INTO users (username, email, password, role) VALUES
('Admin', 'admin@gmail.com', crypt('admin123', gen_salt('bf', 10)), 'admin'),
('Jagung', 'admin1@gmail.com', crypt('admin123', gen_salt('bf', 10)), 'admin'),
('John Doe', 'johndoe@gmail.com', crypt('johndoe123', gen_salt('bf', 10)), 'user'),
('Alice', 'alice@gmail.com', crypt('alice123', gen_salt('bf', 10)), 'user');

CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    image_path VARCHAR(255),
    capacity INT
);

-- insert data ruangan
INSERT INTO rooms VALUES 
(1, 'Meeting Room A', '../images/ruang-a/Meeting-Room-a.webp', 10),
(2, 'Conference Room B', '../images/ruang-a/conference-room-b.webp', 25),
(3, 'Discussion Room C', '../images/ruang-a/discussion-room-c.webp', 5);

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

-- Insert data bookings
INSERT INTO bookings (user_id, room_id, booking_date, booking_time, purpose, status) VALUES
(2, 1, '2024-05-20', '09:00-11:00', 'Team Meeting', 'approved'),
(3, 2, '2024-05-21', '14:00-16:00', 'Client Presentation', 'pending'),
(2, 3, '2024-05-22', '10:00-12:00', 'Project Discussion', 'approved'),
(3, 1, '2024-05-23', '11:00-13:00', 'Quarterly Review', 'rejected'),
(2, 2, '2024-05-24', '09:00-11:00', 'Internal Training', 'pending'),
(3, 3, '2024-05-25', '14:00-16:00', 'UX/UI Design Review', 'approved'),
(2, 1, '2024-05-26', '10:00-12:00', 'Sprint Planning', 'pending');
