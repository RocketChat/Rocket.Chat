const sensitivePatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH |)?PRIVATE KEY-----/i,
  /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/i,
  /\bpassword\s*=/i,
  /\bAKIA[0-9A-Z]{16}\b/,
];

export const detectSensitiveContent = (text: string): boolean => {
  if (!text.trim()) {
    return false;
  }

  return sensitivePatterns.some((pattern) => pattern.test(text));
};