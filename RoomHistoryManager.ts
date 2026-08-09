import { v4 as uuidv4 } from 'uuid';

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
}

export default RoomHistoryManager;