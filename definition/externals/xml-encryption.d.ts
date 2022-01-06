declare module 'xml-encryption' {
	export interface IDecryptOptions {
		disallowDecryptionWithInsecureAlgorithm?: boolean;
		warnInsecureAlgorithm?: boolean;
		key: string;
	}

	export function decrypt(xml: string | Element | Document, options: IDecryptOptions, callback: (err: Error, result: any) => void): string;
	export function decryptKeyInfo(doc: string | Element | Document, options: IDecryptOptions): string;

	export interface IEncryptOptions {
		rsa_pub: string;
		pem: Buffer | string;
		disallowEncryptionWithInsecureAlgorithm: boolean;
		keyEncryptionAlgorithm: string;
		encryptionAlgorithm: string;
		input_encoding?: string;
		warnInsecureAlgorithm: boolean;
	}

	export function encrypt(content: string, options: IEncryptOptions, callback: (err: Error, result: any) => void): string;
	export function encryptKeyInfo(symmetricKey: string, options: IEncryptOptions, callback: (err: Error, result: any) => void): string;
}
