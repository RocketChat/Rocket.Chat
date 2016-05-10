const Ajv = Npm.require('ajv');
const semver = Npm.require('semver');

const applicationValidator = new class ApplicationValidator {
	constructor() {
		this.ajv = new Ajv({
			allErrors: true,
			removeAdditional: 'all'
		});

		this.ajv.addFormat('semver', function(value) {
			return semver.valid(value) !== null;
		});

		this.ajv.addFormat('semver-range', function(value) {
			return semver.validRange(value) !== null;
		});

		this.ajv.addSchema(this.settingsSchema);
		this.ajv.addSchema(this.permissionsSchema);
		this.ajv.addSchema(this.incomingWebhookSchema);
		this.ajv.addSchema(this.outgoingWebhookSchema);
		this.ajv.addSchema(this.applicationSchema);
	}

	get settingsSchema() {
		return {
			id: 'settings',
			type: 'object',
			patternProperties: {
				'.*': {
					type: 'object',
					required: ['type', 'value', 'read_only', 'name', 'description', 'required_permissions'],
					properties: {
						type: {
							type: 'string',
							enum: ['string', 'boolean']
						},
						value: {},
						read_only: {
							type: 'boolean'
						},
						name: {
							type: 'string',
							minLength: 1,
							maxLength: 20,
							not: { pattern: '(^\\s|\\s$)'}
						},
						description: {
							type: 'string',
							minLength: 5,
							maxLength: 255,
							not: { pattern: '(^\\s|\\s$)'}
						},
						required_permissions: {
							type: 'array',
							minItems: 0,
							maxItems: 10,
							uniqueItems: true,
							items: {
								type: 'string',
								enum: ['http']
							}
						}
					}
				}
			}
		};
	}

	get permissionsSchema() {
		return {
			id: 'permissions',
			type: 'object',
			patternProperties: {
				'.*': {
					type: 'object',
					required: ['enabled', 'description'],
					properties: {
						enabled: {
							type: 'boolean'
						},
						description: {
							type: 'string',
							minLength: 5,
							maxLength: 255,
							not: { pattern: '(^\\s|\\s$)'}
						}
					}
				}
			}
		};
	}

	get incomingWebhookSchema() {
		return {
			id: 'incoming_webhook',
			properties: {
				name: {
					type: 'string',
					minLength: 2,
					maxLength: 40,
					not: { pattern: '(^\\s|\\s$)' }
				},
				description: {
					type: 'string',
					minLength: 5,
					maxLength: 255,
					not: { pattern: '(^\\s|\\s$)' }
				},
				optional: {
					type: 'boolean'
				},
				// enabled
				settings: {
					$ref: 'settings'
				},
				channel: {
					type: 'string',
					minLength: 0,
					maxLength: 40,
					not: { pattern: '(^\\s|\\s$)' }
				},
				username: {
					type: 'string',
					minLength: 1,
					maxLength: 40,
					not: { pattern: '(^\\s|\\s$)' }
				},
				// avatar: null,
				// emoji: null,
				// alias: null,
				scriptEnabled: {
					type: 'boolean'
				},
				script: {
					type: 'string',
					minLength: 0,
					maxLength: 1000000
				}
			}
		};
	}

	get outgoingWebhookSchema() {
		return {
			id: 'outgoing_webhook',
			properties: {
				name: {
					type: 'string',
					minLength: 2,
					maxLength: 40,
					not: { pattern: '(^\\s|\\s$)' }
				},
				description: {
					type: 'string',
					minLength: 5,
					maxLength: 255,
					not: { pattern: '(^\\s|\\s$)' }
				},
				optional: {
					type: 'boolean'
				},
				// enabled
				settings: {
					$ref: 'settings'
				},
				channel: {
					type: 'string',
					minLength: 0,
					maxLength: 40,
					not: { pattern: '(^\\s|\\s$)' }
				},
				username: {
					type: 'string',
					minLength: 1,
					maxLength: 40,
					not: { pattern: '(^\\s|\\s$)' }
				},
				// avatar: null,
				// emoji: null,
				// alias: null,
				scriptEnabled: {
					type: 'boolean'
				},
				script: {
					type: 'string',
					minLength: 0,
					maxLength: 1000000
				}
				// urls: ['http://google.com'],
				// token: 'asd',
				// triggerWords: ['asd']
			}
		};
	}

	get applicationSchema() {
		return {
			id: 'application',
			properties: {
				id: {
					type: 'string',
					minLength: 5,
					maxLength: 255,
					pattern: '^([a-z]+\\.[a-z]+)+$'
				},
				version: {
					type: 'string',
					minLength: 5,
					maxLength: 15,
					format: 'semver'
				},
				rocketchat_version: {
					type: 'string',
					minLength: 0,
					maxLength: 25,
					format: 'semver-range'
				},
				name: {
					type: 'string',
					minLength: 2,
					maxLength: 40,
					pattern: '^[^\\s].*[^\\s]$'
				},
				short_description: {
					type: 'string',
					minLength: 10,
					maxLength: 255,
					pattern: '^[^\\s].*[^\\s]$'
				},
				description: {
					type: 'string',
					minLength: 10,
					maxLength: 10000,
					pattern: '^[^\\s].*[^\\s]$'
				},
				permissions: {
					$ref: 'permissions'
				},
				incoming_webhook: {
					type: 'array',
					maxItems: 5,
					items: {
						$ref: 'incoming_webhook'
					}
				},
				outgoing_webhook: {
					type: 'array',
					maxItems: 5,
					items: {
						$ref: 'outgoing_webhook'
					}
				}
			},
			required: [
				'id',
				'version',
				'rocketchat_version',
				'name',
				'short_description',
				'description'
			]
		};
	}

	validate(application = {}) {
		let isValid = this.ajv.validate('application', application);

		if (!isValid) {
			return this.ajv.errors;
		}

		if ((!application.incoming_webhook || application.incoming_webhook.length === 0) && (!application.outgoing_webhook || application.outgoing_webhook.length === 0)) {
			return [{
				message: 'At least one incoming_webhook or outgoing_webhook is required'
			}];
		}

		return true;
	}
};

RocketChat.Application.Validator = applicationValidator;
