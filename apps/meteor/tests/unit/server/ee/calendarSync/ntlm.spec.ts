import { expect } from 'chai';
import { describe, it } from 'mocha';

import { md4 } from '../../../../../ee/server/lib/calendarSync/providers/ews/md4';
import {
	createType1Message,
	createType3Message,
	ntowfv2,
	parseNtlmUsername,
	parseType2Message,
} from '../../../../../ee/server/lib/calendarSync/providers/ews/ntlm';

describe('calendarSync/ews/ntlm', () => {
	describe('md4', () => {
		// RFC 1320 test vectors
		const vectors: [string, string][] = [
			['', '31d6cfe0d16ae931b73c59d7e0c089c0'],
			['a', 'bde52cb31de33e46245e05fbdbd6fb24'],
			['abc', 'a448017aaf21d8525fc10ae87aa6729d'],
			['message digest', 'd9130a8164549fe818874806e1c7014b'],
			['12345678901234567890123456789012345678901234567890123456789012345678901234567890', 'e33b4ddc9c38f2199c3e7b164fcc0536'],
		];

		for (const [input, digest] of vectors) {
			it(`should match the RFC 1320 vector for ${JSON.stringify(input.slice(0, 16))}`, () => {
				expect(md4(Buffer.from(input, 'ascii')).toString('hex')).to.equal(digest);
			});
		}
	});

	describe('ntowfv2', () => {
		it('should match the [MS-NLMP] 4.2.4.1.1 test vector', () => {
			// User "User", domain "Domain", password "Password"
			expect(ntowfv2('User', 'Password', 'Domain').toString('hex')).to.equal('0c868a403bfd7a93a3001ef22ef02e3f');
		});
	});

	describe('parseNtlmUsername', () => {
		it('should split DOMAIN\\user into its parts', () => {
			expect(parseNtlmUsername('CONTOSO\\svc-rocketchat')).to.deep.equal({ domain: 'CONTOSO', username: 'svc-rocketchat' });
		});

		it('should pass UPNs through with an empty domain', () => {
			expect(parseNtlmUsername('svc@contoso.mil')).to.deep.equal({ domain: '', username: 'svc@contoso.mil' });
		});
	});

	describe('handshake messages', () => {
		it('should produce a well-formed Type 1 message', () => {
			const header = createType1Message();
			expect(header).to.match(/^NTLM [A-Za-z0-9+/=]+$/);

			const message = Buffer.from(header.slice(5), 'base64');
			expect(message.toString('ascii', 0, 8)).to.equal('NTLMSSP\0');
			expect(message.readUInt32LE(8)).to.equal(1);
		});

		it('should parse the server challenge and target info out of a Type 2 message', () => {
			// Build a synthetic Type 2: signature, type, target name (empty), flags, challenge, context, target info
			const targetInfo = Buffer.from('020004004c004100', 'hex'); // MsvAvNbDomainName "LA"
			const message = Buffer.alloc(48 + targetInfo.length);
			message.write('NTLMSSP\0', 0, 'ascii');
			message.writeUInt32LE(2, 8);
			message.writeUInt32LE(0x00088201, 20);
			Buffer.from('0123456789abcdef', 'hex').copy(message, 24);
			message.writeUInt16LE(targetInfo.length, 40);
			message.writeUInt16LE(targetInfo.length, 42);
			message.writeUInt32LE(48, 44);
			targetInfo.copy(message, 48);

			const challenge = parseType2Message(`NTLM ${message.toString('base64')}`);
			expect(challenge.serverChallenge.toString('hex')).to.equal('0123456789abcdef');
			expect(challenge.targetInfo.equals(targetInfo)).to.be.true;
		});

		it('should reject headers without an NTLM challenge', () => {
			expect(() => parseType2Message('Negotiate')).to.throw('NTLM challenge');
		});

		it('should build a Type 3 message whose NT response verifies against the challenge', () => {
			const targetInfo = Buffer.from('020004004c004100', 'hex');
			const challenge = {
				serverChallenge: Buffer.from('0123456789abcdef', 'hex'),
				targetInfo,
				flags: 0x00088201,
			};
			const clientNonce = Buffer.from('aaaaaaaaaaaaaaaa', 'hex');
			const header = createType3Message(
				challenge,
				{ username: 'User', password: 'Password', domain: 'Domain', workstation: 'WS' },
				{ clientNonce, now: 1467321600000 },
			);

			const message = Buffer.from(header.slice(5), 'base64');
			expect(message.toString('ascii', 0, 8)).to.equal('NTLMSSP\0');
			expect(message.readUInt32LE(8)).to.equal(3);

			const readBuffer = (position: number): Buffer => {
				const length = message.readUInt16LE(position);
				const offset = message.readUInt32LE(position + 4);
				return Buffer.from(message.subarray(offset, offset + length));
			};

			const lmResponse = readBuffer(12);
			const ntResponse = readBuffer(20);
			const domain = readBuffer(28).toString('utf16le');
			const username = readBuffer(36).toString('utf16le');

			expect(domain).to.equal('Domain');
			expect(username).to.equal('User');
			expect(lmResponse).to.have.length(24); // 16-byte HMAC + 8-byte client nonce
			expect(lmResponse.subarray(16).equals(clientNonce)).to.be.true;

			// Recompute the NTLMv2 proof from the blob the message carries and verify it matches
			const crypto = require('crypto');
			const blob = ntResponse.subarray(16);
			const expectedProof = crypto
				.createHmac('md5', ntowfv2('User', 'Password', 'Domain'))
				.update(Buffer.concat([challenge.serverChallenge, blob]))
				.digest();
			expect(ntResponse.subarray(0, 16).equals(expectedProof)).to.be.true;

			// The blob must echo the server's target info
			expect(blob.includes(targetInfo)).to.be.true;
		});
	});
});
