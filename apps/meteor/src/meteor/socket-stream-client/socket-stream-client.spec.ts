import { describe, it, expect } from 'vitest';
import { toSockjsUrl, toWebsocketUrl, ClientStream } from './socket-stream-client.ts';

describe('Socket Stream Client - URLs', () => {
    it('computes sockjs urls correctly', () => {
        const testHasSockjsUrl = (raw: string, expectedSockjsUrl: string | RegExp) => {
            const actual = toSockjsUrl(raw);
            if (expectedSockjsUrl instanceof RegExp) {
                expect(actual).toMatch(expectedSockjsUrl);
            } else {
                expect(actual).toBe(expectedSockjsUrl);
            }
        };

        testHasSockjsUrl('http://subdomain.meteor.com/', 'http://subdomain.meteor.com/sockjs');
        testHasSockjsUrl('http://subdomain.meteor.com', 'http://subdomain.meteor.com/sockjs');
        testHasSockjsUrl('subdomain.meteor.com/', 'http://subdomain.meteor.com/sockjs');
        testHasSockjsUrl('subdomain.meteor.com', 'http://subdomain.meteor.com/sockjs');

        testHasSockjsUrl('http://localhost:3000/', 'http://localhost:3000/sockjs');
        testHasSockjsUrl('localhost:3000', 'http://localhost:3000/sockjs');

        testHasSockjsUrl('https://subdomain.meteor.com/', 'https://subdomain.meteor.com/sockjs');
        testHasSockjsUrl('https://subdomain.meteor.com', 'https://subdomain.meteor.com/sockjs');

        testHasSockjsUrl(
            'ddp+sockjs://ddp--****-foo.meteor.com/sockjs',
            /^https:\/\/ddp--\d\d\d\d-foo\.meteor\.com\/sockjs$/
        );
        testHasSockjsUrl(
            'ddpi+sockjs://ddp--****-foo.meteor.com/sockjs',
            /^http:\/\/ddp--\d\d\d\d-foo\.meteor\.com\/sockjs$/
        );
    });

    it('computes websocket urls correctly', () => {
        expect(toWebsocketUrl('http://subdomain.meteor.com/')).toBe('ws://subdomain.meteor.com/websocket');
        expect(toWebsocketUrl('https://subdomain.meteor.com/')).toBe('wss://subdomain.meteor.com/websocket');
    });
});

describe('Socket Stream Client - Status Transitions', () => {
    it('transitions through disconnect statuses correctly', () => {
        const stream = new ClientStream('/');
        const history: string[] = [];

        // Subscribe to status changes manually for testing
        // Since tracker isn't running automatically here, we just monkey-patch statusChanged
        const originalStatusChanged = stream.statusChanged.bind(stream);
        stream.statusChanged = () => {
            originalStatusChanged();
            history.push(stream.status().status);
        };

        // Kickoff connection sequence
        stream.status();

        // Simulate open
        if (stream.socket) {
            stream.socket.onopen!(new Event('open'));
        }

        expect(history[history.length - 1]).toBe('connected');

        stream.disconnect();

        expect(history[history.length - 1]).toBe('offline');
        expect(stream.status().connected).toBe(false);

        // Reconnecting should immediately push it to 'connecting'
        stream.reconnect();
        expect(history[history.length - 1]).toBe('connecting');
    });

    it('remains offline if the online event is received while manually disconnected', () => {
        const stream = new ClientStream('/');
        stream.disconnect(); // force offline

        expect(stream.status().status).toBe('offline');

        // Simulate browser 'online' event
        (stream as any)._online();

        // Should remain offline because manual disconnect takes precedence
        expect(stream.status().status).toBe('offline');
    });
});