export function getTransporter({ transporter, port }: { transporter?: string; port?: string } = {}) {
	if (transporter) {
		if (!transporter.match(/^(?:monolith\+)/)) {
			throw new Error('invalid transporter');
		}

		const [, ...url] = transporter.split('+');
		return url.join('');
	}

	return {
		port: port ? port.trim() : 0,
		udpDiscovery: false,
	};
}
