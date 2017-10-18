Template.HelpRequestContext.helpers({
	/**
	 * Create a set of name-value-pairs which are being used to visualize the context from which the question has been asked
	 * @returns {Array}
	 */
	relevantParameters() {
		const instance = Template.instance();
		const environment = instance.data.environment;
		const relevantParameters = [];

		if (environment) {
			let value = '';
			let name = '';

			// transaction +  title
			name = '';
			value = environment.tcode || environment.program || environment.wd_application;
			if (environment.title) {
				value = `${ value } - ${ environment.title }`;
			}
			if (environment.tcode) {
				name = 'transaction';
			} else if (environment.program) {
				name = 'program';
			} else if (environment.wd_application) {
				name = 'application';
			}

			if (name) {
				relevantParameters.push({
					name,
					value
				});
			}

			//system information
			if (environment.system) {
				let systemInfo = environment.system;
				if (environment.client) {
					systemInfo = `${ systemInfo }(${ environment.client })`;
				}

				if (environment.release) {
					systemInfo = `${ systemInfo }, ${ t('release') }: ${ environment.release }`;
				}

				relevantParameters.push({
					name: 'system',
					value: systemInfo
				});
			}
		}

		return relevantParameters;
	}
});

Template.HelpRequestContext.onCreated(function() {

});
