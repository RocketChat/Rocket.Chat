/**
 * Separates the SOAP message layer from authentication, so neither constrains the other. Implementations
 * own credentials, connection lifetime, TLS trust, and the host allowlist that enforces the air gap.
 */
export interface IEwsTransport {
	/** POSTs a SOAP envelope and returns the response body. Must throw `ExchangeError`, never a raw transport error. */
	post(soapEnvelope: string): Promise<string>;
}
