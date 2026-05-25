import { createHash } from 'node:crypto';

function md5(input: string): string {
	return createHash('md5').update(input).digest('hex');
}

const supportedAlgorithms: Record<string, undefined | ((input: string) => string)> = {
	md5,
	'md5-sess': md5,
};

export function getHashAlgorithm(algorithm: string): ((input: string) => string) | null {
	return supportedAlgorithms[algorithm?.toLowerCase()] ?? null;
}
