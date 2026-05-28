import { SignJWT, importPKCS8, jwtVerify, importSPKI, generateKeyPair, exportSPKI, exportPKCS8 } from 'jose';
import type { JWTPayload } from 'jose';

export async function sign(keyObject: object, pkcs8: string, alg = 'RS256') {
	const privateKey = await importPKCS8(pkcs8, alg);

	const token = await new SignJWT(keyObject as JWTPayload).setProtectedHeader({ alg, typ: 'JWT' }).sign(privateKey);

	return token;
}

export async function verify(jwt: string, spki: string, alg = 'RS256') {
	const publicKey = await importSPKI(spki, alg);

	const { payload, protectedHeader } = await jwtVerify(jwt, publicKey, {});

	return [payload, protectedHeader];
}

export async function getPairs(): Promise<[string, string]> {
	if (process.env.NODE_ENV !== 'test') {
		throw new Error('This function should only be used in tests');
	}
	const { publicKey, privateKey } = await generateKeyPair('RS256');
	const spki = await exportSPKI(publicKey);
	const pkcs8 = await exportPKCS8(privateKey);

	return [spki, pkcs8];
}

// ---- HS256 (shared-secret) JWTs ----
// Used for systems like LiveKit that authenticate with an API key/secret pair.

export type HS256SignOptions = {
	secret: string;
	issuer?: string;
	subject?: string;
	// Accepts a duration string like '6h' or '30s', a Date, or seconds since epoch.
	expiresIn?: string | number | Date;
	// Same accepted forms as expiresIn. Pass 0 for "immediately valid".
	notBefore?: string | number | Date;
};

export async function signHS256(payload: JWTPayload, options: HS256SignOptions): Promise<string> {
	const secretBytes = new TextEncoder().encode(options.secret);
	const builder = new SignJWT(payload).setProtectedHeader({ alg: 'HS256', typ: 'JWT' }).setIssuedAt();

	if (options.issuer) {
		builder.setIssuer(options.issuer);
	}
	if (options.subject) {
		builder.setSubject(options.subject);
	}
	if (options.expiresIn !== undefined) {
		builder.setExpirationTime(options.expiresIn as Parameters<SignJWT['setExpirationTime']>[0]);
	}
	if (options.notBefore !== undefined) {
		builder.setNotBefore(options.notBefore as Parameters<SignJWT['setNotBefore']>[0]);
	}

	return builder.sign(secretBytes);
}

export async function verifyHS256(jwt: string, secret: string, options?: { issuer?: string }): Promise<JWTPayload> {
	const { payload } = await jwtVerify(jwt, new TextEncoder().encode(secret), {
		...(options?.issuer ? { issuer: options.issuer } : {}),
	});
	return payload;
}
