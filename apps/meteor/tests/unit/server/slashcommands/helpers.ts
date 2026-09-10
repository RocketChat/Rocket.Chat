import { MeteorError } from '@rocket.chat/core-services';
import type { SlashCommandCallbackParams, SlashCommandOptions } from '@rocket.chat/core-typings';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

type Registration = {
	command: string;
	callback: (args: SlashCommandCallbackParams<string>) => unknown;
	options?: SlashCommandOptions;
};

type Dependencies = Record<string, unknown> & {
	'@rocket.chat/core-services'?: Record<string, unknown> & {
		api?: Record<string, unknown> & { broadcast?: sinon.SinonStub };
	};
};

/** Capture registration and invoke the actual callback without involving the dispatcher. */
export function loadCommand(path: string, dependencies: Dependencies = {}) {
	const commands = new Map<string, Registration>();
	const coreServices = dependencies['@rocket.chat/core-services'];
	const broadcast = coreServices?.api?.broadcast ?? sinon.stub().resolves();
	const translate = sinon.stub().callsFake((key: string) => `translated:${key}`);
	const settings = { get: sinon.stub() };
	let invocation: SlashCommandCallbackParams<string> | undefined;
	proxyquire
		.noCallThru()
		.noPreserveCache()
		.load(`../../../../server/slashcommands/${path}`, {
			'meteor/meteor': { Meteor: { Error: MeteorError } },
			'../../lib/i18n': { i18n: { t: translate } },
			'../../settings': { settings },
			...dependencies,
			'@rocket.chat/core-services': { ...coreServices, api: { ...coreServices?.api, broadcast } },
			'../../lib/utils/slashCommand': {
				slashCommands: { add: (registration: Registration) => commands.set(registration.command, registration) },
			},
		});
	return {
		broadcast,
		translate,
		settings,
		commands,
		/** Invoke a registered command, retaining its arguments for feedback assertions. */
		async run(command: string, overrides: Partial<SlashCommandCallbackParams<string>> = {}) {
			const registration = commands.get(command);
			if (!registration) throw new Error(`Command /${command} was not registered`);
			invocation = {
				command,
				params: '',
				userId: 'actor',
				message: { _id: 'message', rid: 'current-room' },
				...overrides,
			};
			return registration.callback(invocation);
		},
		/** Assert translated feedback was sent to the user and room from the latest invocation. */
		expectFeedback(key: string) {
			if (!invocation) throw new Error('Run a command before asserting feedback');
			sinon.assert.calledWithExactly(broadcast, 'notify.ephemeralMessage', invocation.userId, invocation.message.rid, {
				msg: `translated:${key}`,
			});
		},
	};
}
