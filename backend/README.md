# Local Information Viewer - Backend

This directory contains the backend server for the Local Information Viewer project. It's built with Node.js, Express, and TypeScript.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setup and Installation](#setup-and-installation)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
  - [Development Mode](#development-mode)
  - [Production Mode](#production-mode)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
  - [GET /api/local-items](#get-apilocal-items)
  - [GET /api/external/items](#get-apiexternalitems)
- [Third-Party APIs Used](#third-party-apis-used)

## Prerequisites

- [Node.js](https://nodejs.org/) (version 18.x or later recommended)
- `npm` (usually included with Node.js)

## Setup and Installation

1. Navigate to the root directory of the project.
2. Install all dependencies for the entire project (including the backend):
   ```bash
   npm run install:all
   ```
3. Alternatively, to install only backend dependencies, navigate to this `backend` directory and run:
   ```bash
   npm install
   ```

## Environment Variables

To run the backend server, you need to create a `.env` file in the `backend` directory. You can copy the `backend/.env.example` (if you create one) to `backend/.env` and fill in the values.

```env
# backend/.env

# Port for the backend server
PORT=4000

# Yelp Fusion API Key (REQUIRED for /api/external/items)
# Obtain from: https://docs.developer.yelp.com/docs/fusion-intro
YELP_API_KEY=your_actual_yelp_fusion_api_key_here
```

### Environment Variable Details

- **PORT**: (Optional) The port the server will listen on. Defaults to 4000 if not set.
- **YELP_API_KEY**: **Required**. Your API key for the Yelp Fusion API. This is necessary for the `/api/external/items` endpoint to fetch data from Yelp. If this key is missing or invalid, the external search functionality will fail.

## Running the Server

### Development Mode

To run the server in development mode with hot reloading:

```bash
npm run dev
```

This uses `ts-node-dev` to automatically restart the server when files change.

### Production Mode

To build and run the server in production mode:

```bash
# Build the TypeScript code
npm run build

# Start the production server
npm start
```

## Running Tests

To run the test suite:

```bash
npm test
```

To run tests in watch mode during development:

```bash
npm run test:watch
```

## Project Structure

```
backend/
├── src/
│   ├── data/               # Static data files
│   │   └── local-items.json
│   ├── services/           # Business logic and external API services
│   │   ├── yelpService.ts
│   │   └── dataTransformer.ts
│   ├── types/              # TypeScript type definitions
│   ├── server.ts           # Express server configuration and routes
│   └── index.ts            # Application entry point
├── dist/                   # Compiled JavaScript output (generated)
├── tests/                  # Test files
├── .env                    # Environment variables (create this file)
├── .env.example           # Environment variables template
├── package.json
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## API Endpoints

### GET /api/local-items

Fetches local items from a static JSON file.

**Response:**
```json
[
  {
    "id": "string",
    "name": "string",
    "category": "string",
    "location": "string",
    "description": "string",
    "rating": "number",
    "imageUrl": "string"
  }
]
```

**Error Responses:**
- `500` - Server error (file read error, empty data file, JSON parse error)

### GET /api/external/items

Fetches items from external APIs (currently Yelp Fusion API) and transforms them into the LocalItem format.

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `location` | string | Yes* | Location to search | `"New York"`, `"NYC"`, `"SoHo, New York"` |
| `latitude` | number | Yes* | Latitude coordinate | `40.7128` |
| `longitude` | number | Yes* | Longitude coordinate | `-74.0060` |
| `term` | string | No | Search term | `"restaurants"`, `"coffee"`, `"parks"` |
| `categories` | string | No | Comma-separated category aliases | `"restaurants,bars"` |
| `limit` | integer | No | Number of results (1-50, default: 20) | `10` |
| `offset` | integer | No | Pagination offset (default: 0) | `20` |

*Either `location` OR both `latitude` and `longitude` must be provided.

**Example Requests:**
```bash
# Search by location
GET /api/external/items?location=New York&term=restaurants&limit=10

# Search by coordinates
GET /api/external/items?latitude=40.7128&longitude=-74.0060&term=coffee&limit=5

# Search with categories
GET /api/external/items?location=San Francisco&categories=restaurants,bars&offset=10
```

**Response:**
```json
{
  "items": [
    {
      "id": "string",
      "name": "string",
      "category": "string",
      "location": "string",
      "description": "string",
      "rating": "number",
      "imageUrl": "string"
    }
  ],
  "totalResultsFromSource": "number",
  "source": "live",
  "requestParams": {
    "limit": "number",
    "offset": "number"
  }
}
```

**Error Responses:**
- `400` - Bad Request (missing/invalid parameters)
- `502` - Bad Gateway (external API error)
- `503` - Service Unavailable (external service down)
- `500` - Internal Server Error

**Common Error Codes:**
- `MISSING_LOCATION_PARAMS` - Neither location nor coordinates provided
- `INVALID_COORDINATES` - Invalid latitude/longitude format
- `LIMIT_OUT_OF_BOUNDS` - Limit not between 1-50
- `EXTERNAL_API_ERROR` - Error from Yelp API
- `SERVICE_UNAVAILABLE` - External service temporarily down

## Third-Party APIs Used

### Yelp Fusion API

The backend integrates with the [Yelp Fusion API](https://docs.developer.yelp.com/docs/fusion-intro) to fetch business and location data.

**Features:**
- Business search by location or coordinates
- Category filtering
- Pagination support
- Rating and review data
- Business photos and contact information

**Setup:**
1. Create a Yelp Developer account at [https://www.yelp.com/developers](https://www.yelp.com/developers)
2. Create a new app to get your API key
3. Add the API key to your `.env` file as `YELP_API_KEY`

**Rate Limits:**
The Yelp Fusion API has rate limits. Please refer to [Yelp's documentation](https://docs.developer.yelp.com/docs/fusion-intro) for current limits.

**Data Transformation:**
Raw Yelp API responses are transformed into our standardized `LocalItem` format using the `dataTransformer` service. This ensures consistent data structure regardless of the external API source.

---

## Development Notes

- The server includes comprehensive error handling and validation
- All endpoints include detailed logging for debugging
- CORS is enabled for all origins (configure for production use)
- A test endpoint `/api/test-yelp` is available in development mode
- TypeScript is used throughout for type safety

## Support

For issues related to:
- **Yelp API**: Check [Yelp Developer Documentation](https://docs.developer.yelp.com/)
- **Node.js/Express**: Refer to official documentation
- **Project-specific issues**: Check the main project README or create an issue

---

*Last updated: June 2025*