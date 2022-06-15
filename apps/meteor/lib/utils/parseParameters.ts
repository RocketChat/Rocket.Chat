export function parseParameters(parameters: string): string[] {
	if (!parameters.trim()) {
		return [];
	}

	const match = parameters.match(/((["'])(?:(?=(\\?))\3.)*?\2)/g);
	let line = parameters;

	if (match) {
		match.forEach((item) => {
			const newItem = item.replace(/(^['"]|['"]$)/g, '').replace(/ +/g, '\u2008');
			line = line.replace(item, newItem);
		});

		return line.split(' ').map((item) => item.replace(/\u2008/g, ' ').replace(/\\\"/g, '"'));
	}

	return line.split(' ');
}
