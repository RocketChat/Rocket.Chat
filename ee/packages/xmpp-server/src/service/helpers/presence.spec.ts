import { UserStatus } from '@rocket.chat/core-typings';

import { mapPresenceToStatus, mapStatusToPresence } from './presence';

describe('mapStatusToPresence', () => {
	it('maps RC statuses to XMPP presence', () => {
		expect(mapStatusToPresence(UserStatus.ONLINE)).toEqual({ availability: 'available' });
		expect(mapStatusToPresence(UserStatus.AWAY)).toEqual({ availability: 'available', show: 'away' });
		expect(mapStatusToPresence(UserStatus.BUSY)).toEqual({ availability: 'available', show: 'dnd' });
		expect(mapStatusToPresence(UserStatus.OFFLINE)).toEqual({ availability: 'unavailable' });
		expect(mapStatusToPresence(undefined)).toEqual({ availability: 'unavailable' });
	});
});

describe('mapPresenceToStatus', () => {
	it('maps XMPP presence to RC statuses', () => {
		expect(mapPresenceToStatus({ availability: 'available' })).toBe(UserStatus.ONLINE);
		expect(mapPresenceToStatus({ availability: 'available', show: 'away' })).toBe(UserStatus.AWAY);
		expect(mapPresenceToStatus({ availability: 'available', show: 'xa' })).toBe(UserStatus.AWAY);
		expect(mapPresenceToStatus({ availability: 'available', show: 'dnd' })).toBe(UserStatus.BUSY);
		expect(mapPresenceToStatus({ availability: 'unavailable' })).toBe(UserStatus.OFFLINE);
	});
});
