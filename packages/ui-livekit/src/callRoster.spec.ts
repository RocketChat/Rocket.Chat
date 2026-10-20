import type { RemoteSFU } from './callConnections';
import { OWN_SFU } from './callConnections';
import type { CallMember } from './callRoster';
import { createCallRoster, memberOn, remoteSFUsOf } from './callRoster';

const RC2 = { serverName: 'rc2', transport: 'wss://lk.rc2' };
const RC3 = { serverName: 'rc3', transport: 'https://rc3/livekit/jwt' };

const local = (_id: string, livekitIdentity: string, rest: Partial<CallMember> = {}): CallMember => ({
	_id,
	username: _id,
	name: _id.toUpperCase(),
	federation: { serverName: 'rc1', transport: 'wss://lk.rc1', livekitIdentity, local: true },
	...rest,
});

const remote = (
	_id: string,
	sfu: { serverName: string; transport: string },
	livekitIdentity: string,
	rest: Partial<CallMember> = {},
	livekitIdentityAliases?: string[],
): CallMember => ({
	_id,
	username: `@${_id}:${sfu.serverName}`,
	name: _id.toUpperCase(),
	federation: { ...sfu, livekitIdentity, livekitIdentityAliases, local: false },
	...rest,
});

const sfuOf = ({ serverName, transport }: { serverName: string; transport: string }): RemoteSFU => {
	const [sfu] = remoteSFUsOf([remote('probe', { serverName, transport }, 'probe')]);
	return sfu;
};

describe('remoteSFUsOf', () => {
	it('watches each other homeserver once, however many of its members are in the call', () => {
		const sfus = remoteSFUsOf([
			local('alice', 'h-alice'),
			remote('carol', RC2, 'h-carol'),
			remote('dave', RC2, 'h-dave'),
			remote('erin', RC3, 'h-erin'),
		]);

		expect(sfus.map(({ serverName, transport }) => ({ serverName, transport }))).toEqual([RC2, RC3]);
		expect(new Set(sfus.map(({ key }) => key)).size).toBe(2);
	});

	// Two SFUs of one homeserver are two connections: the transport is what tells them apart.
	it('tells two SFUs of the same homeserver apart', () => {
		const sfus = remoteSFUsOf([remote('carol', RC2, 'h-carol'), remote('dave', { ...RC2, transport: 'wss://lk2.rc2' }, 'h-dave')]);

		expect(sfus).toHaveLength(2);
	});

	// A homeserver whose members all left has nothing left to watch, so its connection can close.
	it('leaves out homeservers with nobody in the call', () => {
		const sfus = remoteSFUsOf([
			remote('carol', RC2, 'h-carol', { joined: false }),
			remote('dave', RC2, 'h-dave', { leftAt: new Date() }),
			remote('erin', RC3, 'h-erin'),
		]);

		expect(sfus.map(({ serverName }) => serverName)).toEqual(['rc3']);
	});

	it('watches nothing for this server, nor for members not yet placed on any SFU', () => {
		expect(remoteSFUsOf([local('alice', 'h-alice'), { _id: 'bob', username: 'bob', name: 'Bob' }])).toEqual([]);
	});
});

describe('memberOn', () => {
	const members = [
		local('alice', 'h-alice'),
		remote('carol', RC2, 'h-carol'),
		remote('erin', RC3, 'h-erin', {}, ['@erin:rc3:DEVICE', 'h3-erin']),
		{ _id: 'bob', username: 'bob', name: 'Bob' },
	];

	it('finds this server’s members on its own SFU by the identity they publish as', () => {
		expect(memberOn(members, OWN_SFU, 'h-alice')?._id).toBe('alice');
	});

	it('finds another homeserver’s members on that homeserver’s SFU', () => {
		expect(memberOn(members, sfuOf(RC2), 'h-carol')?._id).toBe('carol');
	});

	// Matrix clients of different generations publish the same membership under different identities.
	it('knows a member by any identity their membership may publish as', () => {
		expect(memberOn(members, sfuOf(RC3), '@erin:rc3:DEVICE')?._id).toBe('erin');
		expect(memberOn(members, sfuOf(RC3), 'h3-erin')?._id).toBe('erin');
	});

	// Tokens for other servers' members are not hidden, so every SFU also carries people watching it.
	it('takes nobody else on an SFU for a person: watchers from other servers are not on its roster', () => {
		expect(memberOn(members, OWN_SFU, 'watcher-from-rc2')).toBeUndefined();
		expect(memberOn(members, sfuOf(RC2), 'watcher-from-rc1')).toBeUndefined();
	});

	// A member publishes on one SFU only; the same identity anywhere else is somebody else's.
	it('only finds a member on the SFU they publish on', () => {
		expect(memberOn(members, sfuOf(RC2), 'h-alice')).toBeUndefined();
		expect(memberOn(members, OWN_SFU, 'h-carol')).toBeUndefined();
		expect(memberOn(members, sfuOf(RC3), 'h-carol')).toBeUndefined();
		expect(memberOn(members, sfuOf({ ...RC2, transport: 'wss://lk2.rc2' }), 'h-carol')).toBeUndefined();
	});

	// Outside a federated call the identity is the user id, but a federated call's roster says nothing of the kind.
	it('does not read a user id as an identity', () => {
		expect(memberOn(members, OWN_SFU, 'bob')).toBeUndefined();
		expect(memberOn(members, OWN_SFU, 'alice')).toBeUndefined();
	});
});

describe('createCallRoster', () => {
	const members = [local('alice', 'h-alice'), remote('carol', RC2, 'h-carol', {}, ['@carol:rc2:DEVICE'])];
	const roster = createCallRoster(members, ({ _id, username }) => ({ id: _id, displayName: username, avatarUrl: `/avatar/${username}` }));

	it('draws a participant as the member they are, not as their identity', () => {
		expect(roster.personOn(sfuOf(RC2), '@carol:rc2:DEVICE')).toEqual({
			id: 'carol',
			displayName: '@carol:rc2',
			avatarUrl: '/avatar/@carol:rc2',
		});
		expect(roster.personOn(OWN_SFU, 'h-alice')).toMatchObject({ id: 'alice' });
	});

	it('draws nobody for a participant who is not a member on that SFU', () => {
		expect(roster.personOn(OWN_SFU, 'h-carol')).toBeUndefined();
	});

	it('says which identity a member publishes as', () => {
		expect(roster.identityOf('carol')).toBe('h-carol');
		expect(roster.identityOf('nobody')).toBeUndefined();
	});
});
