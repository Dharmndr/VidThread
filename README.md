#  VidThread – Backend

VidThread is a scalable backend service for a video sharing and social interaction platform.  
It provides secure authentication, media uploads, pagination, aggregation pipelines, and well-structured APIs for handling users, videos, comments, and more.

Built with modern Node.js, Express.js and MongoDB.

---

## ✨ Features

- 🔐 JWT-based Authentication & Authorization  
- 🔒 Password hashing & comparison using bcrypt  
- ☁️ Cloud media storage  
- 📁 File upload handling  
- 📊 MongoDB aggregation pipelines  
- 📄 Advanced pagination support  
- 🍪 Cookie parsing  
- 🌍 CORS enabled  
- 🧱 Modular MVC-style structure  
- ⚡ Async error handling middleware  
- 🧹 Prettier formatting  

---

## 🛠 Tech Stack

- Node.js  
- Express  
- MongoDB  
- Mongoose  

---

## 📦 Packages Used

### Core
- express  
- mongoose  
- dotenv  

### Auth & Security
- bcrypt  
- jsonwebtoken  
- cookie-parser  

### File & Media
- multer  
- cloudinary  

### Pagination
- mongoose-paginate-v2  
- mongoose-aggregate-paginate-v2  

### Dev
- nodemon  
- prettier  

---

## 📁 Project Structure

```
src/
 ├── controllers/
 ├── models/
 ├── routes/
 ├── middlewares/
 ├── utils/
 ├── constants/
 └── index.js
```
---
## ⚙️ Environment Variables

### Create a .env file in the root.

```javascript
PORT=8000
MONGODB_URI=your_mongodb_connection

ACCESS_TOKEN_SECRET=your_secret
ACCESS_TOKEN_EXPIRY=1d

REFRESH_TOKEN_SECRET=your_secret
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=xxxx
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx

```
---
## ▶️ Run Locally

### Install dependencies

- npm install

### Run development server
- npm run dev


---
## 🔐 Authentication Flow

- User registers

- Password hashed via bcrypt

- Login returns access + refresh tokens

- Protected routes verified via middleware

- Tokens can be sent via cookies / headers

---
## 📊 Aggregation & Pagination

### Used for:

- Channel statistics

- Video listings

- Filtering & sorting

- Efficient large dataset handling


Helps mimic real production grade queries like large platforms.

### ☁️ Media Handling

- Files received via multer

- Uploaded to cloud storage

- URLs stored in database

- Optimized for scalability
---
## 🧠 Learning Goals of Project

### This project demonstrates understanding of:

- REST API design

- Secure auth systems

- Database modeling

- Aggregation pipelines

- Clean controller/service separation

- Error handling patterns used in industry

---
## 🚧 Future Improvements

- Caching layer (Redis)

- Rate limiting

- API documentation (Swagger)

- Unit & integration tests

- Docker support

- CI/CD

## 👨‍💻 Author

### Dharmendra Kumar

---
## ⭐ Support

 If you like this project, give it a star ⭐

 It helps a lot! 
