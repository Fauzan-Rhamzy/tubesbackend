CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user'
);

-- Insert data
INSERT INTO users (username, email, password, role) VALUES
('Admin', 'admin@gmail.com', 'admin123', 'admin'),
('John Doe', 'johndoe@gmail.com', 'johndoe123', 'user'),
('Alice', 'alice@gmail.com', 'alice123', 'user');