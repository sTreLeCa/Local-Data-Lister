# Local Data Lister

**A full-stack web application designed to help users discover, save, and track interesting local places. This project was built as a final exam submission, demonstrating a comprehensive understanding of modern web development principles, from backend architecture to a dynamic, real-time frontend.**

This monorepo contains the complete source code for the application, including a React frontend, a Node.js/Express backend, and a shared TypeScript types package.


*(Recommendation: Replace this placeholder link with a real screenshot of your application's home page!)*

## ✨ Key Features

This project is more than just a simple data viewer; it's a complete ecosystem with a rich feature set:

*   **Full-Stack Architecture:** A robust **Node.js/Express backend** serves a modern **React/Vite frontend**, following best practices for separation of concerns.
*   **Real-Time Dashboard:** The "Most Popular Places" dashboard updates **live across all connected clients** using **WebSockets (Socket.io)** as users favorite and un-favorite items.
*   **Secure Authentication:** End-to-end user authentication flow with **JWT (JSON Web Tokens)**, including registration, login, and protected routes for personalized content.
*   **Third-Party API Integration:** Fetches real-world data from the **Foursquare Places API**, transforming and displaying it seamlessly alongside local data.
*   **Performance-Optimized Backend:** Implements a **server-side cache** to reduce redundant API calls to Foursquare, improving response times and respecting external rate limits.
*   **Relational Database:** Uses a **PostgreSQL** database with **Prisma ORM** for type-safe database queries, clear schema definitions, and easy migrations.
*   **Comprehensive Testing:** The codebase includes both backend (Jest, Supertest) and frontend (Vitest, React Testing Library) tests to ensure reliability.

## 🛠️ Tech Stack

| Area       | Technology                                                               |
| :--------- | :----------------------------------------------------------------------- |
| **Frontend** | React, Vite, TypeScript, `react-router-dom`, Zustand, `socket.io-client` |
| **Backend**  | Node.js, Express.js, TypeScript, Prisma, PostgreSQL, `socket.io`        |
| **Database**   | PostgreSQL                                                               |
| **Testing**  | Jest, Supertest (Backend); Vitest, React Testing Library (Frontend)      |

---

## 🚀 Getting Started: Local Development Setup

Follow these instructions to get the project running on your local machine.

**Prerequisites:**
*   [Node.js](https://nodejs.org/) (v18 or later is recommended)
*   [npm](https://www.npmjs.com/) (usually included with Node.js)
*   A running [PostgreSQL](https://www.postgresql.org/download/) database instance.

**Instructions:**

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/sTreLeCa/Local-Data-Lister.git
    cd Local-Data-Lister
    ```

2.  **Install All Dependencies**
    From the root directory, this command will install dependencies for the root, backend, and frontend packages.
    ```bash
    npm install
    ```

3.  **Set Up the Backend Environment**
    *   Navigate to the `backend` directory: `cd backend`
    *   Create a new file named `.env`.
    *   Copy the following configuration into your new `.env` file, replacing the placeholder values with your own.

    ```env
    # The port your backend server will run on
    PORT=4000

    # Your PostgreSQL connection string.
    # Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
    DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/mydb?schema=public"

    # A strong, secret key for signing JSON Web Tokens (JWT)
    JWT_SECRET="a-very-strong-and-secret-key-that-is-at-least-32-characters-long"

    # Your personal API Key for the Foursquare Places API
    FOURSQUARE_API_KEY="your_foursquare_api_key_here"

    # The URL of your running frontend application (for Socket.IO CORS)
    FRONTEND_URL="http://localhost:5173"
    ```
    *   Return to the root directory: `cd ..`

4.  **Set Up the Database**
    Run this command from the root directory to apply the database schema from `backend/prisma/schema.prisma` to your PostgreSQL database.
    ```bash
    npx prisma migrate dev --name init --prefix backend
    ```

5.  **(Optional but Recommended) Seed the Database**
    To populate the application with sample users and favorites, run the seed script. This makes the dashboard and other features come alive instantly.
    ```bash
    npx prisma db seed --prefix backend
    ```

6.  **Run the Application**
    From the **root directory**, this command uses `concurrently` to start both the backend and frontend development servers at the same time.
    ```bash
    npm run dev
    ```

**You're all set!**
*   🎉 **Frontend is available at: `http://localhost:5173`**
*   🌐 **Backend API is running at: `http://localhost:4000`**

---

## 🏛️ Project Structure

The project is organized as a monorepo with three main packages, allowing for clear separation and code sharing:

*   `/frontend`: A React application built with Vite. Handles all UI and user interaction.
*   `/backend`: A Node.js API server built with Express. Manages business logic, database interaction, and authentication.
*   `/packages/types`: A shared TypeScript package for data structures (like `LocalItem`) used by both the frontend and backend, ensuring type safety across the entire stack.

---

## 🤝 Authors

This project was developed by:
*   Aleksandre 
*   Giorgi
*   Nikoloz