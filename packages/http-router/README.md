# Rocket.Chat HTTP Router

This package provides a flexible HTTP routing solution for Rocket.Chat services, built on top of Hono and Express.

## Features

- Type-safe route definitions with TypeScript
- Express compatibility
- Request validation via JSON Schema
- Response validation
- Middleware support
- Nested routers
- Strong TypeScript types for request and response objects

## Installation

```sh
yarn add @rocket.chat/http-router
```

## Usage

```typescript
import { Router } from '@rocket.chat/http-router';
import express from 'express';

// Create a new router
const api = new Router('api');

// Define routes with typed handlers
api.get(
  'users',
  { 
    // Request validation options
    query: {
      schema: {
        type: 'object',
        properties: {
          limit: { type: 'number' },
          skip: { type: 'number' }
        }
      }
    },
    // Response validation
    response: {
      '200': {
        schema: {
          type: 'object',
          properties: {
            users: { type: 'array' },
            total: { type: 'number' }
          }
        }
      }
    }
  },
  // Optional middleware
  async (c, next) => {
    console.log('Middleware 1');
    await next();
  },
  // Route handler
  async (c) => {
    const { limit, skip } = c.req.valid('query');
    
    return {
      body: { 
        users: [],
        total: 0
      },
      statusCode: 200
    };
  }
);

// Create an Express app and use the router
const app = express();
app.use(api.router);
```

## Middleware

The router supports middleware functions that can be used for authentication, logging, metrics, and more:

```typescript
// Authentication middleware
const authMiddleware = async (c, next) => {
  const token = c.req.header('Authorization');
  if (!token) {
    return {
      body: { error: 'Unauthorized' },
      statusCode: 401
    };
  }
  // Set context variables for later use
  c.set('userId', 'user123');
  await next();
};

api.get('protected-route', {}, authMiddleware, async (c) => {
  const userId = c.get('userId');
  return {
    body: { message: `Hello, ${userId}` },
    statusCode: 200
  };
});
```

## Express Integration

This router is designed to work seamlessly with Express applications:

```typescript
import express from 'express';
import { Router } from '@rocket.chat/http-router';

const app = express();
const api = new Router('api');

// Define routes...

// Use the router with Express
app.use(api.router);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```
