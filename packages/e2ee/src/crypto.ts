export interface CryptoProvider {
	/**
	 * @example
	 * (key) => await crypto.subtle.exportKey('jwk', key)
	 */
	exportJsonWebKey(key: CryptoKey): Promise<JsonWebKey>;
	/**
	 * @example
	 * (raw) => crypto.subtle.importKey('raw', raw, { name: 'PBKDF2' }, false, ['deriveKey'])
	 */
	importRawKey(raw: Uint8Array<ArrayBuffer>): Promise<CryptoKey>;
	/**
	 * @example
	 * (key) => crypto.subtle.importKey('jwk', key, { name: 'RSA-OAEP', hash: { name: 'SHA-256' } }, false, ['decrypt'])
	 */
	importRsaDecryptKey(key: JsonWebKey): Promise<CryptoKey>;
	/**
	 * @example
	 * (array) => crypto.getRandomValues(array),
	 */
	getRandomUint8Array(array: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer>;
	/**
	 * @example
	 * (array) => crypto.getRandomValues(array),
	 */
	getRandomUint16Array(array: Uint16Array<ArrayBuffer>): Uint16Array<ArrayBuffer>;
	/**
	 * @example
	 * (array) => crypto.getRandomValues(array),
	 */
	getRandomUint32Array(array: Uint32Array<ArrayBuffer>): Uint32Array<ArrayBuffer>;
	/**
	 * @example
	 * () => crypto.subtle.generateKey(
	 *   { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
	 *   true,
	 *   ['encrypt', 'decrypt'],
	 * )
	 */
	generateRsaOaepKeyPair(): Promise<CryptoKeyPair>;
	/**
	 * @example
	 * (input) => {
	 *   const binaryString = atob(input);
	 *   const len = binaryString.length;
	 *   const bytes = new Uint8Array(len);
	 *   for (let i = 0; i < len; i++) {
	 *     bytes[i] = binaryString.charCodeAt(i);
	 *   }
	 *   return bytes;
	 * }
	 */
	decodeBase64(input: string): Uint8Array<ArrayBuffer>;
	/**
	 * @example
	 * (input) => {
	 *    const bytes = new Uint8Array(input);
	 *    let binaryString = '';
	 *    for (let i = 0; i < bytes.byteLength; i++) {
	 *        binaryString += String.fromCharCode(bytes[i]!);
	 *    }
	 *   return btoa(binaryString);
	 * }
	 */
	encodeBase64(input: ArrayBuffer): string;
	/**
	 * @example
	 * NodeJS / Web:
	 * ```
	 * (text: string): Uint8Array<ArrayBuffer> => {
	 *   const encoder = new TextEncoder();
	 *   const buffer = new Uint8Array();
	 *   encoder.encodeInto(text, buffer);
	 *   return buffer;
	 * }
	 * ```
	 */
	encodeBinary(input: string): Uint8Array<ArrayBuffer>;
	/**
	 * @example
	 * NodeJS / Web:
	 * ```
	 * (input) => new TextEncoder().encode(input)
	 * ```
	 */
	encodeUtf8(input: string): Uint8Array<ArrayBuffer>;
	/**
	 * @example
	 * NodeJS / Web:
	 * ```
	 * (input) => TextDecoder().decode(input)
	 * ```
	 */
	decodeUtf8(input: ArrayBuffer): string;
	/**
	 * @example
	 * NodeJS / Web:
	 * ```
	 * (key, iv, data) => crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, data)
	 * ```
	 */
	decryptAesCbc(key: CryptoKey, iv: Uint8Array<ArrayBuffer>, data: Uint8Array<ArrayBuffer>): Promise<ArrayBuffer>;
	/**
	 * @example
	 * NodeJS / Web:
	 * ```
	 * (key, iv, data) => crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, data)
	 * ````
	 */
	encryptAesCbc(key: CryptoKey, iv: Uint8Array<ArrayBuffer>, data: Uint8Array<ArrayBuffer>): Promise<ArrayBuffer>;
	/**
	 * @example
	 * NodeJS / Web:
	 * (key, iv, data) => crypto.subtle.deriveKey(
	 *  {
	 *    name: 'PBKDF2',
	 *    salt,
	 *    iterations: 1000,
	 *    hash: 'SHA-256',
	 *  },
	 *  baseKey,
	 *  {
	 *    name: 'AES-CBC',
	 *    length: 256,
	 *  },
	 *  false,
	 *  ['encrypt', 'decrypt']
	 * )
	 */
	deriveKeyWithPbkdf2(salt: ArrayBuffer, baseKey: CryptoKey): Promise<CryptoKey>;
}
