/**
 * Generates 12 uniformly random words from the word list.
 *
 * @remarks
 * Uses {@link https://en.wikipedia.org/wiki/Rejection_sampling | rejection sampling} to ensure uniform distribution.
 *
 * @returns A space-separated passphrase.
 */
export async function generatePassphrase() {
	const { wordlist } = await import('./wordList');

	// Number of words in the passphrase
	const WORD_COUNT = 12;
	// We use 32-bit random numbers, so the maximum value is 2^32 - 1
	const MAX_UINT32 = 0xffffffff;

	const range = wordlist.length;
	const rejectionThreshold = Math.floor(MAX_UINT32 / range) * range;

	const words: string[] = [];
	const buf = new Uint32Array(1);

	for (let i = 0; i < WORD_COUNT; i++) {
		let v: number;
		do {
			crypto.getRandomValues(buf);
			v = buf[0];
		} while (v >= rejectionThreshold);
		words.push(wordlist[v % range]);
	}

	return words.join(' ');
}
