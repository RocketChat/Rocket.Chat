/**
 * What this package will accept as an email address when it is about to send one somewhere that
 * has to arrive — registering an account, or asking for a password reset.
 */
export const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
