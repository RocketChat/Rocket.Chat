import {
	parseStringToIceServers,
	parseStringToIceServer,
} from '../../../../../../client/providers/CallProvider/lib/parseStringToIceServers';

describe('parseStringToIceServers', () => {
	describe('parseStringToIceServers', () => {
		it('should parse return an empty array if string is empty', () => {
			const result = parseStringToIceServers('');
			expect(result).toEqual([]);
		});
		it('should parse string to servers', () => {
			const servers = parseStringToIceServers('stun:stun.l.google.com:19302');
			expect(servers.length).toEqual(1);
			expect(servers[0].urls).toEqual('stun:stun.l.google.com:19302');
			expect(servers[0].username).toEqual(undefined);
			expect(servers[0].credential).toEqual(undefined);
		});

		it('should parse string to servers with multiple urls', () => {
			const servers = parseStringToIceServers('stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302');
			expect(servers.length).toEqual(2);
			expect(servers[0].urls).toEqual('stun:stun.l.google.com:19302');
			expect(servers[1].urls).toEqual('stun:stun1.l.google.com:19302');
		});

		it('should parse string to servers with multiple urls, with password and username', () => {
			const servers = parseStringToIceServers(
				'stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302,team%40rocket.chat:demo@turn:numb.viagenie.ca:3478',
			);
			expect(servers.length).toEqual(3);
			expect(servers[0].urls).toEqual('stun:stun.l.google.com:19302');
			expect(servers[1].urls).toEqual('stun:stun1.l.google.com:19302');
			expect(servers[2].urls).toEqual('turn:numb.viagenie.ca:3478');
			expect(servers[2].username).toEqual('team@rocket.chat');
			expect(servers[2].credential).toEqual('demo');
		});
	});

	describe('parseStringToIceServer', () => {
		it('should parse string to server', () => {
			const server = parseStringToIceServer('stun:stun.l.google.com:19302');
			expect(server.urls).toEqual('stun:stun.l.google.com:19302');
		});

		it('should parse string to server with username and password', () => {
			const server = parseStringToIceServer('team%40rocket.chat:demo@turn:numb.viagenie.ca:3478');
			expect(server.urls).toEqual('turn:numb.viagenie.ca:3478');
			expect(server.username).toEqual('team@rocket.chat');
			expect(server.credential).toEqual('demo');
		});
	});
});
