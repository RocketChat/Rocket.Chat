export const envSchema = {
	type: 'object' as const,
	required: ['MONGO_URL'],
	additionalProperties: true,
	properties: {
		// Required
		MONGO_URL: { type: 'string' as const, minLength: 1 },

		// Optional with defaults — strings
		ADMIN_NAME: { type: 'string' as const, default: 'Administrator' },
		ADMIN_USERNAME: { type: 'string' as const, default: 'admin' },
		BIND_IP: { type: 'string' as const, default: '0.0.0.0' },
		DEPLOY_METHOD: { type: 'string' as const, default: 'tar' },
		DEPLOY_PLATFORM: { type: 'string' as const, default: 'selfinstall' },
		INSTANCE_IP: { type: 'string' as const, default: 'localhost' },

		// Optional with defaults — numbers
		EVENT_LOOP_LAG_MS: { type: 'number' as const, default: 70 },
		HEAP_USAGE_PERCENT: { type: 'number' as const, default: 0.85 },
		HTTP_FORWARDED_COUNT: { type: 'number' as const, default: 0 },
		MAX_RESUME_LOGIN_TOKENS: { type: 'number' as const, default: 50 },
		PORT: { type: 'number' as const, default: 3000 },

		// Optional strings
		ADMIN_EMAIL: { type: 'string' as const, nullable: true },
		ADMIN_PASS: { type: 'string' as const, nullable: true },
		BUGSNAG_CLIENT: { type: 'string' as const, nullable: true },
		CLOUD_SUPPORTED_VERSIONS: { type: 'string' as const, nullable: true },
		CLOUD_SUPPORTED_VERSIONS_TOKEN: { type: 'string' as const, nullable: true },
		DEPLOYMENT_ID: { type: 'string' as const, nullable: true },
		FILE_STORAGE_CUSTOM_USER_AGENT: { type: 'string' as const, nullable: true },
		INITIAL_USER: { type: 'string' as const, nullable: true },
		OVERWRITE_INTERNAL_MARKETPLACE_URL: { type: 'string' as const, nullable: true },
		OVERWRITE_INTERNAL_RELEASE_URL: { type: 'string' as const, nullable: true },
		RATE_LIMITER_LOGGER: { type: 'string' as const, nullable: true },
		RC_DISABLE_STATISTICS_REPORTING: { type: 'string' as const, nullable: true },
		REG_TOKEN: { type: 'string' as const, nullable: true },
		ROCKET_CHAT_DEPRECATION_THROW_ERRORS_FOR_VERSIONS_UNDER: { type: 'string' as const, nullable: true },
		ROCKETCHAT_LICENSE: { type: 'string' as const, nullable: true },
		SETTINGS_BLOCKED: { type: 'string' as const, nullable: true },
		SETTINGS_HIDDEN: { type: 'string' as const, nullable: true },
		SETTINGS_REQUIRED_ON_WIZARD: { type: 'string' as const, nullable: true },
		TCP_PORT: { type: 'string' as const, nullable: true },
		TRANSPORTER: { type: 'string' as const, nullable: true },
		TRANSPORTER_EXTRA: { type: 'string' as const, nullable: true },

		// Optional booleans
		ADMIN_EMAIL_VERIFIED: { type: 'boolean' as const, nullable: true },
		ALLOW_UNSAFE_QUERY_AND_FIELDS_API_PARAMS: { type: 'boolean' as const, nullable: true },
		AUTO_ACCEPT_FINGERPRINT: { type: 'boolean' as const, nullable: true },
		BYPASS_MONGO_VALIDATION: { type: 'boolean' as const, nullable: true },
		BYPASS_NODEJS_VALIDATION: { type: 'boolean' as const, nullable: true },
		DEBUG_DISABLE_USER_AUDIT: { type: 'boolean' as const, nullable: true },
		DEBUG_SETTINGS: { type: 'boolean' as const, nullable: true },
		DISABLE_ANIMATION: { type: 'boolean' as const, nullable: true },
		DISABLE_CUSTOM_SCRIPTS: { type: 'boolean' as const, nullable: true },
		DISABLE_INTEGRATION_SCRIPTS: { type: 'boolean' as const, nullable: true },
		DISABLE_MESSAGE_PARSER: { type: 'boolean' as const, nullable: true },
		DISABLE_MESSAGE_ROUNDTRIP_TRACKING: { type: 'boolean' as const, nullable: true },
		DISABLE_PRIVATE_APP_INSTALLATION: { type: 'boolean' as const, nullable: true },
		EXIT_UNHANDLEDPROMISEREJECTION: { type: 'boolean' as const, nullable: true },
		FREEZE_INTEGRATION_SCRIPTS: { type: 'boolean' as const, nullable: true },
		IMPORTER_SKIP_APPS_EVENT: { type: 'boolean' as const, nullable: true },
		SKIP_MONGODEPRECATION_CHECK: { type: 'boolean' as const, nullable: true },
		TEST_MODE: { type: 'boolean' as const, nullable: true },

		// Optional numbers
		HTTP_DEFAULT_TIMEOUT: { type: 'number' as const, nullable: true },
		PROMETHEUS_PORT: { type: 'number' as const, nullable: true },
		RATE_LIMITER_SLOWDOWN_RATE: { type: 'number' as const, nullable: true },

		// System pass-through
		HOME: { type: 'string' as const, nullable: true },
		HOMEPATH: { type: 'string' as const, nullable: true },
		NODE_ENV: { type: 'string' as const, nullable: true },
		TMPDIR: { type: 'string' as const, nullable: true },
		USERPROFILE: { type: 'string' as const, nullable: true },
	},
};
