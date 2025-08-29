interface JSON {
	parse(text: string): unknown;
	stringify(data: unknown): string;
}
