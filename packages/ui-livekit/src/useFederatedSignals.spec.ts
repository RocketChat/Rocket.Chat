import { remoteHandsOf } from './useFederatedSignals';

jest.mock('@rocket.chat/ui-contexts', () => ({}));

const member = (id: string, federation: Record<string, unknown>, presence: Record<string, unknown> = { joined: true }) => ({
	_id: id,
	username: id,
	name: id,
	...presence,
	federation: { serverName: 'rc2', transport: 'wss://lk.rc2', livekitIdentity: `h-${id}`, local: false, ...federation },
});

describe('remoteHandsOf', () => {
	it('reads when each member of another server raised their hand, from its serialized date', () => {
		expect(remoteHandsOf([member('carol', { handRaisedAt: '2026-10-15T12:00:00.000Z' })] as any)).toEqual({
			carol: Date.parse('2026-10-15T12:00:00.000Z'),
		});
	});

	it('leaves out hands that are down, this server’s members and members who left', () => {
		expect(
			remoteHandsOf([
				member('dave', {}),
				member('alice', { local: true, handRaisedAt: '2026-10-15T12:00:00.000Z' }),
				member('erin', { handRaisedAt: '2026-10-15T12:00:00.000Z' }, { joined: true, leftAt: '2026-10-15T12:05:00.000Z' }),
			] as any),
		).toEqual({});
	});
});
