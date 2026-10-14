import { createNtlmV2Response, createType1Message, createType3Message, decodeType2Message, NTLM_FLAGS } from './messages';

const NTLM_SIGNATURE = 'NTLMSSP\0';

const bodyOf = (header: string) => Buffer.from(header.replace(/^NTLM /, ''), 'base64');

const securityBuffer = (message: Buffer, headerOffset: number) => {
	const length = message.readUInt16LE(headerOffset);
	const offset = message.readUInt32LE(headerOffset + 4);

	return message.subarray(offset, offset + length);
};

const buildType2 = ({
	flags,
	challenge,
	targetName = '',
	targetInfo = Buffer.alloc(0),
}: {
	flags: number;
	challenge: Buffer;
	targetName?: string;
	targetInfo?: Buffer;
}) => {
	const encoding = flags & NTLM_FLAGS.NEGOTIATE_UNICODE ? 'ucs2' : 'ascii';
	const nameBytes = Buffer.from(targetName, encoding);
	const base = 48;

	const buf = Buffer.alloc(base + nameBytes.length + targetInfo.length);

	buf.write(NTLM_SIGNATURE, 0, 'ascii');
	buf.writeUInt32LE(2, 8);
	buf.writeUInt16LE(nameBytes.length, 12);
	buf.writeUInt16LE(nameBytes.length, 14);
	buf.writeUInt32LE(base, 16);
	buf.writeUInt32LE(flags, 20);
	challenge.copy(buf, 24);
	buf.writeUInt16LE(targetInfo.length, 40);
	buf.writeUInt16LE(targetInfo.length, 42);
	buf.writeUInt32LE(base + nameBytes.length, 44);

	nameBytes.copy(buf, base);
	targetInfo.copy(buf, base + nameBytes.length);

	return `NTLM ${buf.toString('base64')}`;
};

const u16 = (text: string) => Buffer.from(text, 'ucs2');

const avPair = (id: number, text: string) => {
	const value = u16(text);
	const header = Buffer.alloc(4);

	header.writeUInt16LE(id, 0);
	header.writeUInt16LE(value.length, 2);

	return Buffer.concat([header, value]);
};

/**
 * MS-NLMP 4.2.4. The timestamp is given as zero, and ours is built from a Unix epoch, so the test hands
 * over the instant that converts to it
 */
const SPEC = {
	user: 'User',
	password: 'Password',
	domain: 'Domain',
	challenge: Buffer.from('0123456789abcdef', 'hex'),
	clientChallenge: Buffer.from('aaaaaaaaaaaaaaaa', 'hex'),
	nowForZeroFiletime: -11644473600000,
	targetInfo: Buffer.concat([avPair(0x0002, 'Domain'), avPair(0x0001, 'Server'), Buffer.alloc(4)]),
	response:
		'68cd0ab851e51c96aabc927bebef6a1c' +
		'0101000000000000' +
		'0000000000000000' +
		'aaaaaaaaaaaaaaaa' +
		'00000000' +
		'02000c0044006f006d00610069006e00' +
		'01000c00530065007200760065007200' +
		'00000000' +
		'00000000',
};

describe('createNtlmV2Response', () => {
	const type2 = { flags: 0, challenge: SPEC.challenge, targetName: SPEC.domain, targetInfo: SPEC.targetInfo };

	it('reproduces the response published in MS-NLMP 4.2.4', () => {
		const response = createNtlmV2Response(type2, SPEC.user, SPEC.password, SPEC.domain, {
			nonce: SPEC.clientChallenge,
			now: SPEC.nowForZeroFiletime,
		});

		expect(response.toString('hex')).toBe(SPEC.response);
	});
});

describe('createType1Message', () => {
	it('points each buffer at its own payload, which sit in the reverse of the header order', () => {
		const message = bodyOf(createType1Message('workstation', 'domain'));

		expect(securityBuffer(message, 16).toString('ascii')).toBe('DOMAIN');
		expect(securityBuffer(message, 24).toString('ascii')).toBe('WORKSTATION');
	});
});

describe('decodeType2Message', () => {
	const UNICODE = NTLM_FLAGS.NEGOTIATE_UNICODE | NTLM_FLAGS.NEGOTIATE_TARGET_INFO;

	it('reads back the challenge, the target and its information block', () => {
		const header = buildType2({ flags: UNICODE, challenge: SPEC.challenge, targetName: 'Domain', targetInfo: SPEC.targetInfo });

		expect(decodeType2Message(header)).toMatchObject({
			challenge: SPEC.challenge,
			targetName: 'Domain',
			targetInfo: SPEC.targetInfo,
		});
	});

	it('picks the NTLM challenge out of a header offering more than one scheme', () => {
		const header = buildType2({ flags: UNICODE, challenge: SPEC.challenge, targetInfo: SPEC.targetInfo });

		expect(decodeType2Message(`Negotiate, ${header}`).challenge).toEqual(SPEC.challenge);
	});

	it('refuses a message whose information block points past its own end', () => {
		const buf = bodyOf(buildType2({ flags: UNICODE, challenge: SPEC.challenge, targetInfo: SPEC.targetInfo }));
		buf.writeUInt32LE(buf.length, 44);

		expect(() => decodeType2Message(`NTLM ${buf.toString('base64')}`)).toThrow('out of bounds');
	});
});

describe('createType3Message', () => {
	const type2 = {
		flags: NTLM_FLAGS.NEGOTIATE_UNICODE | NTLM_FLAGS.NEGOTIATE_TARGET_INFO,
		challenge: SPEC.challenge,
		targetName: SPEC.domain,
		targetInfo: SPEC.targetInfo,
	};

	const options = { nonce: SPEC.clientChallenge, now: SPEC.nowForZeroFiletime };

	it('points every buffer at its own payload, though the headers are not in payload order', () => {
		const message = bodyOf(createType3Message(type2, SPEC.user, SPEC.password, 'ws', undefined, options));

		expect(securityBuffer(message, 28).toString('ucs2')).toBe(SPEC.domain);
		expect(securityBuffer(message, 36).toString('ucs2')).toBe(SPEC.user);
		expect(securityBuffer(message, 44).toString('ucs2')).toBe('WS');
		expect(securityBuffer(message, 12)).toHaveLength(24);
	});

	it('answers to the domain it was handed rather than the one the server named', () => {
		const message = bodyOf(createType3Message(type2, SPEC.user, SPEC.password, 'ws', 'Other', options));

		expect(securityBuffer(message, 28).toString('ucs2')).toBe('Other');
		expect(securityBuffer(message, 20)).toEqual(createNtlmV2Response(type2, SPEC.user, SPEC.password, 'Other', options));
	});

	it('reaches the server with the channel binding inside the signed response', () => {
		const channelBindings = Buffer.alloc(16, 0xcc);
		const plain = bodyOf(createType3Message(type2, SPEC.user, SPEC.password, 'ws', undefined, options));
		const bound = bodyOf(createType3Message(type2, SPEC.user, SPEC.password, 'ws', undefined, { ...options, channelBindings }));

		expect(securityBuffer(bound, 20)).not.toEqual(securityBuffer(plain, 20));
		expect(securityBuffer(bound, 20).includes(channelBindings)).toBe(true);
	});
});
