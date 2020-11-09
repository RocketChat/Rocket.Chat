function stringAsArray(s: string): string[] {
	if (typeof s !== 'string' || s.length === 0) {
		return [];
	}

	return s.split(',');
}

export { stringAsArray };
