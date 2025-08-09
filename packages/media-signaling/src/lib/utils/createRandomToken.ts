export function createRandomToken(size: number, base = 32): string {
	let token = '';
	for (let i = 0; i < size; i++) {
		const r: number = Math.floor(Math.random() * base);
		token += r.toString(base);
	}
	return token;
}
