import { Migrations } from '/app/migrations';
import { Integrations } from '/app/models';

Migrations.add({
	version: 33,
	up() {
		const scriptAlert = '/**\n * This script is out-of-date, convert to the new format\n * (https://rocket.chat/docs/administrator-guides/integrations)\n**/\n\n';

		const integrations = Integrations.find({
			$or: [
				{
					script: {
						$exists: false,
					},
					processIncomingRequestScript: {
						$exists: true,
					},
				}, {
					script: {
						$exists: false,
					},
					prepareOutgoingRequestScript: {
						$exists: true,
					},
				}, {
					script: {
						$exists: false,
					},
					processOutgoingResponseScript: {
						$exists: true,
					},
				},
			],
		}).fetch();

		integrations.forEach(function(integration) {
			let script = '';
			if (integration.processIncomingRequestScript) {
				script += `${ integration.processIncomingRequestScript }\n\n`;
			}
			if (integration.prepareOutgoingRequestScript) {
				script += `${ integration.prepareOutgoingRequestScript }\n\n`;
			}
			if (integration.processOutgoingResponseScript) {
				script += `${ integration.processOutgoingResponseScript }\n\n`;
			}

			return Integrations.update(integration._id, {
				$set: {
					script: scriptAlert + script.replace(/^/gm, '// '),
				},
			});
		});

		let update = {
			$unset: {
				processIncomingRequestScript: 1,
				prepareOutgoingRequestScript: 1,
				processOutgoingResponseScript: 1,
			},
		};

		Integrations.update({}, update, {
			multi: true,
		});

		update = {
			$set: {
				enabled: true,
			},
		};

		Integrations.update({
			enabled: {
				$exists: false,
			},
		}, update, {
			multi: true,
		});
	},
});
