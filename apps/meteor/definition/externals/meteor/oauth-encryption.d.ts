declare module 'meteor/oauth-encryption' {
	namespace OAuthEncryption {
		function _isBase64(str: string): boolean;

		function loadKey(key: string): void;

		function seal(
			data: Record<string, any>,
			userId?: string,
		): { iv: string; ciphertext: string; algorithm: 'aes-128-gcm'; authTag: string };

		function open(ciphertext: string, userId?: string): Record<string, any>;

		function isSealed(maybeCipherText: { iv: string; ciphertext: string; algorithm: string; authTag: string }): boolean;
	}
}
