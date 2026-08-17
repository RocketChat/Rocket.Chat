/**
 * Same SHA256 implementation the client uses, so the digest a browser sends and
 * the one computed here from a plaintext password are identical.
 */
export { SHA256 } from '@rocket.chat/sha256';
