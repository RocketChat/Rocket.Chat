const maxLoginTokens = parseInt(String(process.env.MAX_RESUME_LOGIN_TOKENS)) || 50;

export function getMaxLoginTokens(): number {
	return maxLoginTokens;
}
