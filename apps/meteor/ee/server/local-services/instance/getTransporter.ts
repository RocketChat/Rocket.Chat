const { MONOLITH_TRANSPORTER, TCP_PORT } = process.env;

export function getTransporter() {
	if (MONOLITH_TRANSPORTER) {
		return MONOLITH_TRANSPORTER;
	}

	const port = TCP_PORT ? String(TCP_PORT).trim() : 0;

	return {
		type: 'TCP',
		options: {
			port,
			udpDiscovery: false,
		},
	};
}
