import type { VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { LIVEKIT_CAPABILITIES } from './capabilities';

/**
 * What the LiveKit provider declares, read back through the registry. A capability left out turns its feature off
 * without failing anywhere, so each one is pinned here.
 *
 * The registry reads `server/settings`, whose top-level await this runner cannot load, hence the stub.
 */
const proxyquire = require('proxyquire');

const { videoConfProviders, CORE_PROVIDER_APP_ID } = proxyquire
	.noCallThru()
	.noPreserveCache()
	.load('../../../../server/lib/videoConfProviders', {
		'../settings': { settings: { get: () => undefined } },
	});

const registered = (): VideoConferenceCapabilities | undefined => videoConfProviders.getProviderCapabilities('livekit');

describe('the LiveKit provider registration', () => {
	beforeEach(() => {
		videoConfProviders.registerProvider('livekit', LIVEKIT_CAPABILITIES, CORE_PROVIDER_APP_ID);
	});

	afterEach(() => {
		videoConfProviders.unRegisterProvider('livekit');
	});

	// Main-room mode creates a discussion per call only for providers that declare this.
	it('says it can keep the chat, so main-room mode has a discussion to make', () => {
		expect(registered()?.persistentChat).to.be.true;
	});

	// Presence leases, the per-member lifecycle and ringing on the caller's arrival apply to embedded providers.
	it('says the call runs inside Rocket.Chat', () => {
		expect(registered()?.embedded).to.be.true;
	});

	// What the preflight offers: two device toggles and a name for the call.
	it('offers the devices and the name the preflight asks about', () => {
		expect(registered()?.mic).to.be.true;
		expect(registered()?.cam).to.be.true;
		expect(registered()?.title).to.be.true;
	});
});
