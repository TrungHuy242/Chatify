# Chatify

![Chatify Banner](https://via.placeholder.com/1200x400?text=Chatify+-+Realtime+Chat+Application)

A modern, real-time chat application built with the **MERN** stack (MongoDB, Express, React, Node.js) and **Socket.io**. Chatify provides a seamless messaging experience with a beautiful UI, robust authentication, and enterprise-grade security.

## 🚀 Features

- **🔐 Secure Authentication:** JWT-based authentication using HTTP-only cookies.
- **🛡️ Advanced Security:** Integrated with [Arcjet](https://arcjet.com/) for bot protection, spoofing detection, and rate limiting.
- **💬 Real-time Messaging:** Instant message delivery powered by Socket.io.
- **🖼️ Media Uploads:** Profile picture and image sharing capabilities via [Cloudinary](https://cloudinary.com/).
- **✉️ Email Notifications:** Automated welcome emails powered by [Resend](https://resend.com/).
- **🎨 Beautiful UI/UX:** Responsive, modern interface built with Tailwind CSS and DaisyUI.
- **🐻 Efficient State Management:** Fast and scalable global state using Zustand.

## 💻 Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS, DaisyUI
- **State Management:** Zustand
- **Routing:** React Router v7
- **Real-time:** Socket.io-client
- **Icons & Alerts:** Lucide React, React Hot Toast
- **HTTP Client:** Axios

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose)
- **Real-time:** Socket.io
- **Security:** Arcjet, bcryptjs
- **Authentication:** JSON Web Tokens (JWT)
- **3rd Party Services:** Cloudinary, Resend

## 🛠️ Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Git](https://git-scm.com/)
- A MongoDB URI (Local or Atlas)
- Accounts for Cloudinary, Resend, and Arcjet

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/chatify.git
   cd chatify
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory with the following variables:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   CLIENT_URL=http://localhost:5173

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Resend
   RESEND_API_KEY=your_resend_api_key

   # Arcjet
   ARCJET_KEY=your_arcjet_api_key
   ```
   Start the backend server:
   ```bash
   npm run dev
   ```

3. **Frontend Setup:**
   Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```
   Create a `.env` file in the `frontend` directory (if needed):
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```
   Start the frontend development server:
   ```bash
   npm run dev
   ```

4. **Open the app:**
   Visit `http://localhost:5173` in your browser.

## 📁 Project Structure

```text
chatify/
├── backend/               # Node.js Express server
│   ├── src/
│   │   ├── controllers/   # Route controllers (auth, messages)
│   │   ├── emails/        # Resend email handlers
│   │   ├── lib/           # Configurations (DB, Cloudinary, Env)
│   │   ├── middleware/    # Custom middlewares (Auth, Arcjet)
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # Express API routes
│   │   └── server.js      # Entry point
│   └── package.json
└── frontend/              # React application
    ├── src/
    │   ├── components/    # Reusable UI components
    │   ├── lib/           # Axios & utility functions
    │   ├── pages/         # Page components (Login, Chat, etc.)
    │   ├── store/         # Zustand stores (useAuthStore, etc.)
    │   ├── App.jsx        # Main React component
    │   └── main.jsx       # React DOM render
    └── package.json
```

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](#).

## 📝 License
This project is licensed under the ISC License.
