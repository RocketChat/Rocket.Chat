import { MeteorError } from '@rocket.chat/core-services';
import type { SlashCommandCallbackParams, SlashCommandOptions } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

type Registration = {
	command: string;
	callback: (args: SlashCommandCallbackParams<string>) => unknown;
	options?: SlashCommandOptions;
};

// Capture registration and invoke the actual callback without involving the dispatcher.
export function loadCommand(path: string, dependencies: Record<string, unknown> = {}) {
	const commands = new Map<string, Registration>();
	const broadcast = sinon.stub().resolves();
	const translate = sinon.stub().callsFake((key: string) => `translated:${key}`);
	const settings = { get: sinon.stub() };
	proxyquire.noCallThru().load(`../../../../server/slashcommands/${path}`, {
		'@rocket.chat/core-services': { api: { broadcast } },
		'meteor/meteor': { Meteor: { Error: MeteorError } },
		'../../lib/i18n': { i18n: { t: translate } },
		'../../settings': { settings },
		...dependencies,
		'../../lib/utils/slashCommand': {
			slashCommands: { add: (registration: Registration) => commands.set(registration.command, registration) },
		},
	});
	return {
		broadcast,
		translate,
		settings,
		commands,
		async run(command: string, overrides: Partial<SlashCommandCallbackParams<string>> = {}) {
			const registration = commands.get(command);
			if (!registration) throw new Error(`Command /${command} was not registered`);
			return registration.callback({
				command,
				params: '',
				userId: 'actor',
				message: { _id: 'message', rid: 'current-room' },
				...overrides,
			});
		},
		expectFeedback(key: string) {
			expect(broadcast.calledWith('notify.ephemeralMessage', 'actor', 'current-room', { msg: `translated:${key}` })).to.equal(true);
		},
	};
}
