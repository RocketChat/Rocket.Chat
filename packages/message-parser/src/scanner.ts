import { matchesAt } from './chars';

export class Scanner {
	public pos: number;
	private readonly input: string;

	constructor(input: string, startPos = 0) {
		this.input = input;
		this.pos = startPos;
	}

	// Current character, empty string if at end
	char(): string {
		return this.input[this.pos] ?? '';
	}

	// Character at offset from current pos
	charAt(offset: number): string {
		return this.input[this.pos + offset] ?? '';
	}

	// Advance by n characters (default 1)
	advance(n = 1): void {
		this.pos += n;
	}

	// Are we at or past the end?
	isEnd(): boolean {
		return this.pos >= this.input.length;
	}

	// Does the input match a literal starting at current pos?
	matches(literal: string): boolean {
		return matchesAt(this.input, this.pos, literal);
	}

	// Save current position for backtracking
	save(): number {
		return this.pos;
	}

	// Restore to a previously saved position
	restore(savedPos: number): void {
		this.pos = savedPos;
	}

	// Slice from savedPos to current pos
	sliceFrom(savedPos: number): string {
		return this.input.slice(savedPos, this.pos);
	}
}
