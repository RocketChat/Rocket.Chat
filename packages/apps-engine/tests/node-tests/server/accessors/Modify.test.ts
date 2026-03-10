import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { Modify } from '../../../../src/server/accessors';
import type {
	AppBridges,
	MessageBridge,
	ModerationBridge,
	SchedulerBridge,
	UiInteractionBridge,
	UserBridge,
} from '../../../../src/server/bridges';
import type { OAuthAppsBridge } from '../../../../src/server/bridges/OAuthAppsBridge';

describe('Modify', () => {
	it('useModify', () => {
		const mockAppBridges = {
			getUserBridge(): UserBridge {
				return {} as UserBridge;
			},
			getMessageBridge(): MessageBridge {
				return {} as MessageBridge;
			},
			getUiInteractionBridge(): UiInteractionBridge {
				return {} as UiInteractionBridge;
			},
			getSchedulerBridge() {
				return {} as SchedulerBridge;
			},
			getOAuthAppsBridge() {
				return {} as OAuthAppsBridge;
			},
			getModerationBridge() {
				return {} as ModerationBridge;
			},
		} as AppBridges;

		assert.doesNotThrow(() => new Modify(mockAppBridges, 'testing'));

		const md = new Modify(mockAppBridges, 'testing');
		assert.ok(md.getCreator() !== undefined);
		assert.ok(md.getExtender() !== undefined);
		assert.ok(md.getNotifier() !== undefined);
		assert.ok(md.getUpdater() !== undefined);
	});
});
