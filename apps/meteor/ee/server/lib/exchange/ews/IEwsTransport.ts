/**
 * Separates the SOAP message layer from authentication, so neither constrains the other. Implementations
 * own credentials, connection lifetime, TLS trust, and the host allowlist that enforces the air gap.
 */
export interface IEwsTransport {
	post(soapEnvelope: string): Promise<string>;
}
