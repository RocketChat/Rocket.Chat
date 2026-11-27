export function getTransporter({ transporter, port, extra }: { transporter?: string; port?: string; extra?: string } = {}) {
	if (transporter) {
		if (!transporter.match(/^(?:monolith\+)/)) {
			throw new Error('invalid transporter');
		}

		const [, ...url] = transporter.split('+');
		return url.join('');
	}

	const extraOptions: Record<string, unknown> = extra ? JSON.parse(extra) : {};

	return {
		port: port ? port.trim() : 0,
		udpDiscovery: false,
		useHostname: false,
		...extraOptions,
	};
}
