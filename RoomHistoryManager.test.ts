import { RoomHistoryManager } from './RoomHistoryManager';

describe('RoomHistoryManager', () => {
  it('should return an empty array when no history is provided', () => {
    const roomHistoryManager = new RoomHistoryManager();
    expect(roomHistoryManager.getHistory()).toEqual([]);
  });

  it('should return the history when it is provided', () => {
    const roomHistoryManager = new RoomHistoryManager();
    roomHistoryManager.addHistory('message1');
    roomHistoryManager.addHistory('message2');
    expect(roomHistoryManager.getHistory()).toEqual(['message1', 'message2']);
  });

  it('should return the history in the correct order', () => {
    const roomHistoryManager = new RoomHistoryManager();
    roomHistoryManager.addHistory('message1');
    roomHistoryManager.addHistory('message2');
    expect(roomHistoryManager.getHistory()).toEqual(['message1', 'message2']);
  });

  it('should return the history with the correct length', () => {
    const roomHistoryManager = new RoomHistoryManager();
    roomHistoryManager.addHistory('message1');
    roomHistoryManager.addHistory('message2');
    expect(roomHistoryManager.getHistory().length).toBe(2);
  });

  it('should return the history with the correct messages', () => {
    const roomHistoryManager = new RoomHistoryManager();
    roomHistoryManager.addHistory('message1');
    roomHistoryManager.addHistory('message2');
    expect(roomHistoryManager.getHistory()).toEqual(['message1', 'message2']);
  });

  it('should return the history with the correct messages when messages are added in a different order', () => {
    const roomHistoryManager = new RoomHistoryManager();
    roomHistoryManager.addHistory('message2');
    roomHistoryManager.addHistory('message1');
    expect(roomHistoryManager.getHistory()).toEqual(['message2', 'message1']);
  });
});