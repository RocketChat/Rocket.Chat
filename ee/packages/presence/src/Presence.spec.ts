import { Presence } from './Presence';

jest.mock('@rocket.chat/core-services', () => ({
    ServiceClass: class {
        api = {
            broadcast: jest.fn(),
        };
        onEvent() { }
    },
    License: {
        hasModule: jest.fn().mockResolvedValue(true),
    },
}));

jest.mock('@rocket.chat/models', () => ({
    Settings: { updateValueById: jest.fn() },
    Users: {},
    UsersSessions: {},
    registerServiceModels: jest.fn(),
}));

jest.mock('./lib/PresenceReaper', () => ({
    PresenceReaper: class {
        start() { }
        stop() { }
    },
}));

describe('Presence Batching', () => {
    let presence: Presence;

    beforeEach(() => {
        jest.useFakeTimers();
        presence = new Presence();
        (presence as any).broadcastEnabled = true;
        (presence as any).hasLicense = true;
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should buffer broadcast events', () => {
        const user = { _id: 'u1', username: 'user1', status: 'online' } as any;
        (presence as any).broadcast(user, 'offline');

        // Check buffer
        expect((presence as any).presenceBatch.size).toBe(1);

        // Assert API not called yet
        expect((presence as any).api.broadcast).not.toHaveBeenCalled();

        // Advance timers
        jest.advanceTimersByTime(500);

        // Assert API called
        expect((presence as any).api.broadcast).toHaveBeenCalledWith('presence.status.batch', expect.any(Array));
        expect((presence as any).api.broadcast).toHaveBeenCalledTimes(1);

        const batch = (presence as any).api.broadcast.mock.calls[0][1];
        expect(batch).toHaveLength(1);
        expect(batch[0].user._id).toBe('u1');
    });

    it('should batch multiple updates', () => {
        const u1 = { _id: 'u1', username: 'user1', status: 'online' } as any;
        const u2 = { _id: 'u2', username: 'user2', status: 'busy' } as any;

        (presence as any).broadcast(u1, 'offline');
        (presence as any).broadcast(u2, 'online');

        expect((presence as any).presenceBatch.size).toBe(2);

        jest.advanceTimersByTime(500);

        expect((presence as any).api.broadcast).toHaveBeenCalledWith('presence.status.batch', expect.any(Array));
        const batch = (presence as any).api.broadcast.mock.calls[0][1];
        expect(batch).toHaveLength(2);
        const ids = batch.map((item: any) => item.user._id).sort();
        expect(ids).toEqual(['u1', 'u2']);
    });

    it('should debounce updates for same user', () => {
        const u1_v1 = { _id: 'u1', username: 'user1', status: 'online' } as any;
        const u1_v2 = { _id: 'u1', username: 'user1', status: 'offline' } as any;

        (presence as any).broadcast(u1_v1, 'busy');
        (presence as any).broadcast(u1_v2, 'online');

        // Should update the existing entry in map
        expect((presence as any).presenceBatch.size).toBe(1);
        const stored = (presence as any).presenceBatch.get('u1');
        expect(stored.user.status).toBe('offline');

        jest.advanceTimersByTime(500);
        expect((presence as any).api.broadcast).toHaveBeenCalledTimes(1);
        const batch = (presence as any).api.broadcast.mock.calls[0][1];
        expect(batch).toHaveLength(1);
        expect(batch[0].user.status).toBe('offline');
    });
});
