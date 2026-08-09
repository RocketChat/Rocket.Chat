import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { NextFunction, Request, Response, Router } from 'express';

class RoomHistoryManager {
  private roomHistory: { [key: string]: any };

  constructor() {
    this.roomHistory = {};
  }

  addHistory(roomId: string, history: any) {
    if (!this.roomHistory[roomId]) {
      this.roomHistory[roomId] = [];
    }
    this.roomHistory[roomId].push(history);
  }

  getHistory(roomId: string): any[] {
    return this.roomHistory[roomId] || [];
  }

  removeHistory(roomId: string) {
    if (this.roomHistory[roomId]) {
      delete this.roomHistory[roomId];
    }
  }

  // Securely generate a random room ID for non-secure origins
  generateSecureRoomId(req: Request, res: Response, next: NextFunction) {
    if (req.secure) {
      return next();
    }

    const randomBytes = crypto.randomBytes(16);
    const roomId = uuidv4() + randomBytes.toString('hex');
    return next(roomId);
  }
}

export default RoomHistoryManager;
```

```typescript
// Example usage in an Express.js route
import express from 'express';
import RoomHistoryManager from './RoomHistoryManager';

const app = express();
const roomHistoryManager = new RoomHistoryManager();

app.use((req: Request, res: Response, next: NextFunction) => {
  roomHistoryManager.generateSecureRoomId(req, res, (roomId) => {
    req.roomId = roomId;
    next();
  });
});

// Rest of your Express.js application...