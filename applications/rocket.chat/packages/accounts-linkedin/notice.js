if (Package['accounts-ui'] && !Package['service-configuration'] && !Package.hasOwnProperty('pauli:linkedin-config-ui')) {
	console.warn(
		"Note: You're using accounts-ui and pauli:accounts-linkedin,\n" +
			"but didn't install the configuration UI for the Linkedin\n" +
			'OAuth. You can install it with:\n' +
			'\n' +
			'    meteor add pauli:linkedin-config-ui' +
			'\n',
	);
}
