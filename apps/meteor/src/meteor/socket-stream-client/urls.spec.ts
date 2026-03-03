import { describe, it, expect } from 'vitest';
import { toWebsocketUrl } from "meteor/socket-stream-client";

describe('toWebsocketUrl', () => {
    it('websocket urls are computed correctly', () => {
        const testHasWebsocketUrl = (raw: string, expectedUrl: string | RegExp) => {
            const actual = toWebsocketUrl(raw);
            if (expectedUrl instanceof RegExp) {
                expect(actual).toMatch(expectedUrl);
            } else {
                expect(actual).toBe(expectedUrl);
            }
        };

        testHasWebsocketUrl('http://subdomain.meteor.com/', 'ws://subdomain.meteor.com/websocket');
        testHasWebsocketUrl('http://subdomain.meteor.com', 'ws://subdomain.meteor.com/websocket');
        testHasWebsocketUrl('subdomain.meteor.com/', 'ws://subdomain.meteor.com/websocket');
        testHasWebsocketUrl('subdomain.meteor.com', 'ws://subdomain.meteor.com/websocket');

        testHasWebsocketUrl('http://localhost:3000/', 'ws://localhost:3000/websocket');
        testHasWebsocketUrl('http://localhost:3000', 'ws://localhost:3000/websocket');
        testHasWebsocketUrl('localhost:3000', 'ws://localhost:3000/websocket');

        testHasWebsocketUrl('https://subdomain.meteor.com/', 'wss://subdomain.meteor.com/websocket');
        testHasWebsocketUrl('https://subdomain.meteor.com', 'wss://subdomain.meteor.com/websocket');

        testHasWebsocketUrl('ddp+sockjs://ddp--****-foo.meteor.com/sockjs', /^wss:\/\/ddp--\d\d\d\d-foo\.meteor\.com\/sockjs$/);
        testHasWebsocketUrl('ddpi+sockjs://ddp--****-foo.meteor.com/sockjs', /^ws:\/\/ddp--\d\d\d\d-foo\.meteor\.com\/sockjs$/);
    });
});