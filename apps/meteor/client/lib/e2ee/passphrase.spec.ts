import { generatePassphrase } from './passphrase';

describe('generatePassphrase', () => {
	it('should generate a passphrase with 12 words', async () => {
		const passphrase = await generatePassphrase();
		const words = passphrase.split(' ');
		expect(words.length).toBe(12);
	});

	it('should generate different passphrases on subsequent calls', async () => {
		const passphrase1 = await generatePassphrase();
		const passphrase2 = await generatePassphrase();
		expect(passphrase1).not.toBe(passphrase2);
	});
});
