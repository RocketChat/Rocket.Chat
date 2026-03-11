import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type {
	IApiExtend,
	IExternalComponentsExtend,
	IHttpExtend,
	IOutboundCommunicationProviderExtend,
	ISchedulerExtend,
	ISettingsExtend,
	ISlashCommandsExtend,
	IUIExtend,
	IVideoConfProvidersExtend,
} from '../../../../src/definition/accessors';
import { ConfigurationExtend } from '../../../../src/server/accessors';

describe('ConfigurationExtend', () => {
	it('useConfigurationExtend', () => {
		const he = {} as IHttpExtend;
		const se = {} as ISettingsExtend;
		const sce = {} as ISlashCommandsExtend;
		const api = {} as IApiExtend;
		const externalComponent = {} as IExternalComponentsExtend;
		const schedulerExtend = {} as ISchedulerExtend;
		const uiExtend = {} as IUIExtend;
		const vcProvidersExtend = {} as IVideoConfProvidersExtend;
		const outboundCommunication = {} as IOutboundCommunicationProviderExtend;

		assert.doesNotThrow(
			() =>
				new ConfigurationExtend(
					he,
					se,
					sce,
					api,
					externalComponent,
					schedulerExtend,
					uiExtend,
					vcProvidersExtend,
					outboundCommunication,
				),
		);

		const ce = new ConfigurationExtend(
			he,
			se,
			sce,
			api,
			externalComponent,
			schedulerExtend,
			uiExtend,
			vcProvidersExtend,
			outboundCommunication,
		);
		assert.ok(ce.http !== undefined);
		assert.ok(ce.settings !== undefined);
		assert.ok(ce.slashCommands !== undefined);
		assert.ok(ce.externalComponents !== undefined);
		assert.ok(ce.videoConfProviders !== undefined);
	});
});
