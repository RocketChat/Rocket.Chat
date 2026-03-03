import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClientStream } from "meteor/socket-stream-client";
import { Tracker } from "meteor/tracker";

// Lightweight array equality helper
const isArrayEqual = (a: string[], b: string[]): boolean => {
    return a.length === b.length && a.every((val, index) => val === b[index]);
};

// Mock WebSocket to simulate server connection success without a real server
class MockWebSocket {
    onopen?: () => void;
    onclose?: () => void;
    onerror?: (e: Event) => void;
    onmessage?: (e: MessageEvent) => void;
    url: string;

    constructor(url: string) {
        this.url = url;
        // Automatically "connect" shortly after instantiation
        setTimeout(() => {
            if (this.onopen) this.onopen();
        }, 5);
    }

    send(_data: any) { }

    close() {
        // Automatically "close" shortly after request
        setTimeout(() => {
            if (this.onclose) this.onclose();
        }, 5);
    }
}

describe('Client Stream Status', () => {

    beforeEach(() => {
        vi.stubGlobal('WebSocket', MockWebSocket);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('disconnecting and reconnecting transitions through the correct statuses', () => {
        return new Promise<void>((resolve, reject) => {
            const history: string[] = [];
            const stream = new ClientStream('/');

            Tracker.autorun((computation) => {
                const status = stream.status();

                if (history[history.length - 1] !== status.status) {
                    history.push(status.status);

                    if (isArrayEqual(history, ['connecting'])) {
                        // wait
                    } else if (isArrayEqual(history, ['connecting', 'connected'])) {
                        stream.disconnect();
                    } else if (isArrayEqual(history, ['connecting', 'connected', 'offline'])) {
                        stream.reconnect();
                    } else if (isArrayEqual(history, ['connecting', 'connected', 'offline', 'connecting'])) {
                        // wait
                    } else if (isArrayEqual(history, ['connecting', 'connected', 'offline', 'connecting', 'connected'])) {
                        computation.stop();
                        stream.disconnect();
                        resolve();
                    } else if (isArrayEqual(history, ['connecting', 'connected', 'offline', 'connecting', 'connected', 'offline'])) {
                        // End condition
                    } else {
                        computation.stop();
                        stream.disconnect();
                        reject(new Error('Unexpected status history: ' + JSON.stringify(history)));
                    }
                }
            });
        });
    });

    it('remains offline if the online event is received while offline', () => {
        return new Promise<void>((resolve, reject) => {
            const history: string[] = [];
            const stream = new ClientStream('/');

            Tracker.autorun((computation) => {
                const status = stream.status();

                if (history[history.length - 1] !== status.status) {
                    history.push(status.status);

                    if (isArrayEqual(history, ['connecting'])) {
                        // wait
                    } else if (isArrayEqual(history, ['connecting', 'connected'])) {
                        stream.disconnect();
                    } else if (isArrayEqual(history, ['connecting', 'connected', 'offline'])) {
                        stream._online();
                        expect(stream.status().status).toBe('offline');
                        computation.stop();
                        resolve();
                    } else {
                        computation.stop();
                        reject(new Error('Unexpected status history: ' + JSON.stringify(history)));
                    }
                }
            });
        });
    });

});