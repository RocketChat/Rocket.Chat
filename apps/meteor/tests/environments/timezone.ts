import type { JestEnvironmentConfig, EnvironmentContext } from '@jest/environment';
import JSDOMEnvironment from 'jest-environment-jsdom';

// Pins the test's timezone.
// the (jsdom) environment and the timezone gets locked in; a beforeAll() is too late.
module.exports = class TimezoneEnvironment extends JSDOMEnvironment {
	private previousTZ: string | undefined;

	constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
		const { timezone = 'UTC' } = config.projectConfig.testEnvironmentOptions as { timezone?: string };
		const previousTZ: string | undefined = process.env.TZ;
		process.env.TZ = timezone;
		super(config, context);
		this.previousTZ = previousTZ;
	}

	override async teardown(): Promise<void> {
		if (this.previousTZ === undefined) {
			delete process.env.TZ;
		} else {
			process.env.TZ = this.previousTZ;
		}
		await super.teardown();
	}
};
