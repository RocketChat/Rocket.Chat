const SIMILARITY_THRESHOLD = 0.8;

function levenshtein(a: string, b: string): number {
	const m = a.length;
	const n = b.length;
	const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

	for (let i = 0; i <= m; i++) dp[i][0] = i;
	for (let j = 0; j <= n; j++) dp[0][j] = j;

	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
		}
	}

	return dp[m][n];
}

export function isSimilar(a: string, b: string): boolean {
	const avgLen = (a.length + b.length) / 2;
	const maxDistance = avgLen * (1 - SIMILARITY_THRESHOLD);
	return levenshtein(a, b) <= maxDistance;
}
