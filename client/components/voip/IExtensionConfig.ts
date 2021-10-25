/**
 * Delegate interface for SIP extension information.
 * @remarks
 * This interface is implemented by a class which is
 * interested SIP registration events.
 */
export interface IExtensionConfig {
	/**
	 * extension.
	 */
	extension: string;
	/**
	 * password.
	 */
	password: string;
	/**
	 * SIP Registrar address.
	 * @defaultValue `""`
	 */
	sipRegistrar: string;
	/**
	 * SIP WebSocket Path
	 * @defaultValue `""`
	 */
	websocketUri: string;
}
