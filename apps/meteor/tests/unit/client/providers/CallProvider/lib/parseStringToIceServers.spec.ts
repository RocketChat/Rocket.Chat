import { assert } from 'chai';

import {
	parseStringToIceServers,
	parseStringToIceServer,
} from '../../../../../../client/providers/CallProvider/lib/parseStringToIceServers';

describe('parseStringToIceServers', () => {
	describe('parseStringToIceServers', () => {
		it('should parse return an empty array if string is empty', () => {
			const result = parseStringToIceServers('');
			assert.deepEqual(result, []);
		});
		it('should parse string to servers', () => {
			const servers = parseStringToIceServers('stun:stun.l.google.com:19302');
			assert.equal(servers.length, 1);
			assert.equal(servers[0].urls, 'stun:stun.l.google.com:19302');
			assert.equal(servers[0].username, undefined);
			assert.equal(servers[0].credential, undefined);
		});

		it('should parse string to servers with multiple urls', () => {
			const servers = parseStringToIceServers('stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302');
			assert.equal(servers.length, 2);
			assert.equal(servers[0].urls, 'stun:stun.l.google.com:19302');
			assert.equal(servers[1].urls, 'stun:stun1.l.google.com:19302');
		});

		it('should parse string to servers with multiple urls, with password and username', () => {
			const servers = parseStringToIceServers(
				'stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302,team%40rocket.chat:demo@turn:numb.viagenie.ca:3478',
			);
			assert.equal(servers.length, 3);
			assert.equal(servers[0].urls, 'stun:stun.l.google.com:19302');
			assert.equal(servers[1].urls, 'stun:stun1.l.google.com:19302');
			assert.equal(servers[2].urls, 'turn:numb.viagenie.ca:3478');
			assert.equal(servers[2].username, 'team@rocket.chat');
			assert.equal(servers[2].credential, 'demo');
		});
	});

	describe('parseStringToIceServer', () => {
		it('should parse string to server', () => {
			const server = parseStringToIceServer('stun:stun.l.google.com:19302');
			assert.equal(server.urls, 'stun:stun.l.google.com:19302');
		});

		it('should parse string to server with username and password', () => {
			const server = parseStringToIceServer('team%40rocket.chat:demo@turn:numb.viagenie.ca:3478');
			assert.equal(server.urls, 'turn:numb.viagenie.ca:3478');
			assert.equal(server.username, 'team@rocket.chat');
			assert.equal(server.credential, 'demo');
		});
	});
});
