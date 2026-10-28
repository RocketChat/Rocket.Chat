export const signatureAlgorithms = {
	'RSA-SHA1': 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
	'RSA-SHA256': 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
	'RSA-SHA384': 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha384',
	'RSA-SHA512': 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha512',
} as const;

export type SigAlgKey = keyof typeof signatureAlgorithms;

export type SigAlgURI = (typeof signatureAlgorithms)[SigAlgKey];

export function getSigAlgKeyIfSupported(key: SigAlgKey): SigAlgKey;
export function getSigAlgKeyIfSupported(key: string): SigAlgKey | null;
export function getSigAlgKeyIfSupported(key: string): SigAlgKey | null {
	if (key in signatureAlgorithms) {
		return key as keyof typeof signatureAlgorithms;
	}

	return null;
}

export function getSigAlgKeyByURI(algURI: SigAlgURI): SigAlgKey;
export function getSigAlgKeyByURI(algURI: string): SigAlgKey | null;
export function getSigAlgKeyByURI(algURI: string): SigAlgKey | null {
	for (const [key, uri] of Object.entries(signatureAlgorithms)) {
		if (uri === algURI) {
			return key as SigAlgKey;
		}
	}

	return null;
}

export function getSigAlgURIByKey(key: SigAlgKey): SigAlgURI;
export function getSigAlgURIByKey(key: string): SigAlgURI | null;
export function getSigAlgURIByKey(key: string): SigAlgURI | null {
	return signatureAlgorithms[key as SigAlgKey] ?? null;
}
