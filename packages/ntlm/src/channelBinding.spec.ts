import { createHash } from 'crypto';

import { computeChannelBindingHash, withChannelBindings } from './channelBinding';

/** Self signed certificates for test, one per signature algorithm, as DER */
const CERTIFICATES: Record<string, string> = {
	sha256:
		'MIIDETCCAfmgAwIBAgIUTVVy6aEgFfAgvUNpGaKDNfS6bHUwDQYJKoZIhvcNAQELBQAwGDEWMBQGA1UEAwwNZXhjaGFuZ2UudGVz' +
		'dDAeFw0yNjEwMTQxNTQyMDFaFw0yNjEwMTUxNTQyMDFaMBgxFjAUBgNVBAMMDWV4Y2hhbmdlLnRlc3QwggEiMA0GCSqGSIb3DQEB' +
		'AQUAA4IBDwAwggEKAoIBAQDC8Jms0JNC9h1BqfXdxnkkCnmPDFRB0btxZ3U+/pSBrny3fSb8mu4yttUL4diIQBSdsjAdxwbkAxpG' +
		'r1QnAvBnBsFM6nBzfRR7n9cx9rGI1Yf9WdzVOHNzDz/ug25awgWfCNHy0bj8JsKwmf8s56bLIwuh7Nsg+yP7wrOpk2dtaNPy4e3t' +
		'S1aEgbgBhS0OuGPdQmcc7EWhdJHn9PVHsVVUUBM6dCwrKpb2QUYGFRc7Cb9UGEQNxWOaHR5Pkaw7+t4UyHiKSIGyAI49bfC8qKC5' +
		'7MydS/fTozamyqZs51tP90y04QN8nELFX1vrDNObreYd6Yv+RyRgv/9sdD/04Oh3AgMBAAGjUzBRMB0GA1UdDgQWBBRGdFo9ALfG' +
		'bg5y+h815bGbn7TUwDAfBgNVHSMEGDAWgBRGdFo9ALfGbg5y+h815bGbn7TUwDAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEB' +
		'CwUAA4IBAQBU2AcDieH/UAkbmDHDcmImwhJGRRZn2jQnX6a2w7vKXHH5FdFjDKkVhwN8B8Wa/FNV5YnqL4b3ysww9YYQU3+xV44x' +
		'Qstd07Y127paqDlavPfMudrcGdzD6tSZgs72XYwa6GQc0jKyXQn+mQIlWQE8S0CHZ6FrwCodWf7AWKAXR65+afWBrTaMYgAvj3BU' +
		'DXuoOdu8EIFC0hMbysKqtjeX6KuvEW8fQIdCb+lCTpC1Pv35uy+55WxSgNNC6pDZMZjVBlGyda1/S7p6HmNHDo11BgkTscquH86V' +
		'ZsNn8dmRpS6iaTSdNvBj3VXzhyXZ+1C/aMJiYIoF65JU16c0xScX',
	sha384:
		'MIIDETCCAfmgAwIBAgIUQJc5Tui/v7SmamPxAJTUztOgaLswDQYJKoZIhvcNAQEMBQAwGDEWMBQGA1UEAwwNZXhjaGFuZ2UudGVz' +
		'dDAeFw0yNjEwMTQxNTQyMDFaFw0yNjEwMTUxNTQyMDFaMBgxFjAUBgNVBAMMDWV4Y2hhbmdlLnRlc3QwggEiMA0GCSqGSIb3DQEB' +
		'AQUAA4IBDwAwggEKAoIBAQDZhbffdEAaQ82M9W/MdEh8LPi95pHYl2D2CpVG1oFEul+VKcd2qaopfFiWZPv9G8sqZCIybCoMoQEh' +
		'NoflyO4ZVdyyKMqTxEBTcs9g6uW6dHWJWf54Yq9YnvolGCUpUQE+b10vqOTCqjR1CqoZ/yIzKwj9thwMXHgO00JndGUpydjHpcab' +
		'VcRlPR7CPQvSM+0FrDjSQ6RC9iTfPlwtOA3Ln/lWSi8fUWMobKTLZMwok2T4WX4fswwpdCk8Ua8iMS/lv4DoExNHoUtUBTB56Ck3' +
		'Zv5peiky4OxbH73pHVS8VJwbZ9DAjtmyAVZc8ZWl6GVMnMBovpjOS9arH0JMfvnFAgMBAAGjUzBRMB0GA1UdDgQWBBTNKCmjTW2r' +
		'E/gAJDpC4Tfo47HdnjAfBgNVHSMEGDAWgBTNKCmjTW2rE/gAJDpC4Tfo47HdnjAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEB' +
		'DAUAA4IBAQAlV7xixG86xD6FbRbaZbcGXhvtIxJAlncG0nWEMnAx5LuwS2piQVN+qpuqAg/WdvURIiCMn3AsyBmTjs8aLqjFXHxw' +
		'9ds/tlxzV0BSLGeBv6QqGJ6vuMhpeipuvQrFaXmXZ0xeFe0+9cQar9mzBu+s/vllVaG7mLg32jtWe1lAmLQk/YtadI32THiBAFQ2' +
		'L1ySNrraikEJvMEZonPxyYtUrc5nUHTWMS5vpiHmStjWw1s49uAbX0rd0Mi3Yu3RQfnUB0X6YjKh5u9tBed134+TGvrhXwD7WSHP' +
		'2qy5gZHTnL4ZY4Gx/GtU6SyCUNcLu42+sQOvEEqiJcJOsLURYnnc',
	sha512:
		'MIIDETCCAfmgAwIBAgIUUwFNuzY35rHUGUOZm1XxEhDoR1AwDQYJKoZIhvcNAQENBQAwGDEWMBQGA1UEAwwNZXhjaGFuZ2UudGVz' +
		'dDAeFw0yNjEwMTQxNTQyMDFaFw0yNjEwMTUxNTQyMDFaMBgxFjAUBgNVBAMMDWV4Y2hhbmdlLnRlc3QwggEiMA0GCSqGSIb3DQEB' +
		'AQUAA4IBDwAwggEKAoIBAQCyH1KySMu3rNh9oUfY6+izD8rdciu+YQQhRu7cLKQlVmU3ItnZHx+ZkxjbGQ/txSM2bzfYWxyUgK/u' +
		'bNRkxZkz+nox/5qwSB1RtCh8DTLhirH8vn1p/zfcAdnXc+Ze+cnsj+bkpM8LewZr+NSc8sspRLpKkHxxGdvv2XVfs8Cf7elsEEAL' +
		'xHBJomHQCSGH2jH/Ug7nVPusKIteYjKXCtBcoIL2GYjJuxKwRKUBOMoPO+oil4apHymyIo8mgWDM1sATq3/9p2XaSbgW8A53nWeD' +
		'd0L5aos9/16BRid/EBIw0mq+oR1X5LSWLgU+EoZvLLsCOMfzIJ1UmvnmMvpInojVAgMBAAGjUzBRMB0GA1UdDgQWBBQaIano/3EC' +
		'SO1gBRNgFW5a0E57xjAfBgNVHSMEGDAWgBQaIano/3ECSO1gBRNgFW5a0E57xjAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEB' +
		'DQUAA4IBAQBX6NMA/69FpqkeBdGsmvxWFDsluJcejVx3HrhJCAWb19tagZeUYGCEB/RBPpLkmKbEMYVL65z2IPv3qlQT27iES7+c' +
		'nwnl5OLe/1JkCxptRLzKPYi4FpVUFq+n7eKFte/6U2FMkZ85dKPcD5zGlxOR2ysbTKpgXuWHNkJtWXpaYKLr+wOrfa/bxj9Bipwa' +
		'GQHOYiUC13a/cg4ypZvjk7DUKR2bWIitvDOsyeeupwCirtvW0NqJbp5QeK8Qcc+rJEKX5xlGNzI/fiSgLu5Wqo/n23JZn9QTVlqZ' +
		'euNjNYQrtPWuJuQLBzvAUkuTv6Ajg6AzYfxVuOBtqxGKmKGt3WVa',
};

const certificate = (algorithm: string) => Buffer.from(CERTIFICATES[algorithm], 'base64');

/** RFC 5929 4.1 spelled out here, so the test does not lean on the same code it is checking */
const expectedBinding = (der: Buffer, algorithm: string) => {
	const applicationData = Buffer.concat([Buffer.from('tls-server-end-point:', 'ascii'), createHash(algorithm).update(der).digest()]);

	const struct = Buffer.alloc(20 + applicationData.length);
	struct.writeUInt32LE(applicationData.length, 16);
	applicationData.copy(struct, 20);

	return createHash('md5').update(struct).digest();
};

const AV_ID_EOL = 0x0000;
const AV_ID_CHANNEL_BINDINGS = 0x000a;

const avPair = (id: number, value: Buffer) => {
	const header = Buffer.alloc(4);
	header.writeUInt16LE(id, 0);
	header.writeUInt16LE(value.length, 2);

	return Buffer.concat([header, value]);
};

const idsOf = (targetInfo: Buffer): number[] => {
	const ids: number[] = [];

	let offset = 0;
	while (offset + 4 <= targetInfo.length) {
		const id = targetInfo.readUInt16LE(offset);
		ids.push(id);

		if (id === AV_ID_EOL) {
			return ids;
		}

		offset += 4 + targetInfo.readUInt16LE(offset + 2);
	}

	return ids;
};

describe('computeChannelBindingHash', () => {
	it('hashes a known certificate into the value RFC 5929 describes', () => {
		expect(computeChannelBindingHash(certificate('sha256')).toString('hex')).toBe('8f256a0fb4e025c75678cbe8aac59b6e');
	});

	// sha256 is pinned by the test above; these two are what say the signature algorithm was read at all.
	it.each(['sha384', 'sha512'])('hashes a %s signed certificate with its own algorithm', (algorithm) => {
		const der = certificate(algorithm);

		expect(computeChannelBindingHash(der)).toEqual(expectedBinding(der, algorithm));
	});

	it('falls back rather than throwing on something that is not a certificate', () => {
		expect(() => computeChannelBindingHash(Buffer.from('not a certificate'))).not.toThrow();
	});
});

describe('withChannelBindings', () => {
	const hash = Buffer.alloc(16, 0xcc);

	it('puts the pair before the end of the list, which is where a reader stops', () => {
		const targetInfo = Buffer.concat([avPair(0x0002, Buffer.from('Domain', 'ucs2')), avPair(AV_ID_EOL, Buffer.alloc(0))]);
		const bound = withChannelBindings(targetInfo, hash);

		expect(idsOf(bound)).toEqual([0x0002, AV_ID_CHANNEL_BINDINGS, AV_ID_EOL]);
		expect(bound.includes(hash)).toBe(true);
	});

	it('terminates a list that arrived without an end of its own', () => {
		const targetInfo = avPair(0x0002, Buffer.from('Domain', 'ucs2'));

		expect(idsOf(withChannelBindings(targetInfo, hash))).toEqual([0x0002, AV_ID_CHANNEL_BINDINGS, AV_ID_EOL]);
	});
});
