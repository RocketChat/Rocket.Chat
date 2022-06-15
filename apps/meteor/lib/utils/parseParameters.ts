export function parseParameters(parameters: string, ignoreExtraUnquotedSpaces = true): string[] {
	if (!parameters.trim()) {
		return [];
	}

	const match = parameters.match(/((["'])(?:(?=(\\?))\3.)*?\2)/gs);
	let line = parameters;

	if (!match) {
		const items = line.split(' ');
		if (ignoreExtraUnquotedSpaces) {
			return items.filter(Boolean);
		}

		return items;
	}

	if (match) {
		match.forEach((item) => {
			const newItem = item
				// Replace start quote with SSA character
				.replace(/(^['"])/g, '\u0086')
				// Replace end quote with ESA character
				.replace(/['"]$/g, '\u0087')
				// Replace spaces inside the quotes with a Punctuation Space character
				.replace(/ /g, '\u2008');

			line = line.replace(item, newItem);
		});

		// If two quoted parameters are not separated by a space, add one automatically
		line = line.replace(/\u0087\u0086/g, ' ');

		let items = line.split(' ');
		if (ignoreExtraUnquotedSpaces) {
			items = items.filter(Boolean);
		}

		return items.map((item) =>
			item
				// Convert back the spaces
				.replace(/\u2008/g, ' ')
				// Remove SSA and ESA characters
				.replace(/[\u0086\u0087]/g, '')
				// Unescape quotes
				.replace(/\\\"/g, '"'),
		);
	}

	return line.split(' ');
}
