// livechat.test.ts

import { describe, expect, it } from '@jest/globals';
import { LiveChat } from './livechat';

describe('LiveChat', () => {
  it('should return the correct message', () => {
    const liveChat = new LiveChat();
    const message = liveChat.getMessage('Hello, world!');
    expect(message).toBe('Hello, world!');
  });

  it('should return the correct message with a name', () => {
    const liveChat = new LiveChat();
    const message = liveChat.getMessage('Hello, world!', 'John Doe');
    expect(message).toBe('Hello, John Doe!');
  });
});