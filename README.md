# Local Information Viewer - Frontend

This directory contains the frontend application for the Local Information Viewer project. It is a modern web application built with React, Vite, and TypeScript.

## Overview

The frontend is responsible for rendering the user interface, fetching data from the backend API, and handling all user interactions.

**Key Features:**
- Displays a list of local items (restaurants, parks, events) in a card format.
- Provides client-side filtering for the initial list of simulated data.
- Includes a search interface to query for real-world data from the backend's external API endpoint.
- Built with a mocked service layer to allow for independent development while the backend API is in progress.

---

## Prerequisites

- [Node.js](https://nodejs.org/) (version 18.x or later recommended)
- `npm` (usually included with Node.js)

---

## Setup and Installation

1.  Navigate to the root directory of the project.
2.  Install all dependencies for the entire project (including the frontend):
    ```bash
    npm run install:all
    ```
3.  If you only need to install frontend dependencies, navigate to this `frontend` directory and run:
    ```bash
    npm install
    ```

---

## Available Scripts

From within the `frontend` directory, you can run the following commands:

### `npm run dev`

Runs the app in development mode using Vite. Open [http://localhost:5173](http://localhost:5173) to view it in your browser. The page will reload when you make changes.

The development server is configured to proxy API requests starting with `/api` to the backend server running on `http://localhost:4000`.

### `npm run test`

Launches the Vitest test runner in interactive watch mode. This is the primary way to run the automated tests for the components and application logic.

### `npm run build`

Builds the app for production to the `dist` folder. It correctly bundles React in production mode and optimizes the build for the best performance.

### `npm run lint`

Runs the ESLint static analysis tool to find potential issues in the codebase.

---

## Project Structure

A brief overview of the key files and directories:

-   `public/`: Contains static assets.
-   `src/`: The main application source code.
    -   `components/`: Contains reusable React components, such as `LocalItemCard.tsx`.
    -   `services/`: Handles all communication with the backend API.
    -   `App.tsx`: The main application component that holds state and orchestrates the UI.
    -   `main.tsx`: The entry point of the React application.
-   `vite.config.ts`: Configuration file for the Vite build tool and dev server.
-   `tsconfig.json`: TypeScript configuration for the project.