import { expect } from 'chai';
import proxyquire from 'proxyquire';

import type * as federationUtilsModule from '../../../../server/services/federation/utils';

const settings = {
	enabled: false,
	ready: false,

	get(id: string) {
		switch (id) {
			case 'Federation_Matrix_enabled':
				return this.enabled;
			case 'Federation_Matrix_configuration_status':
				return this.ready ? 'Valid' : 'Invalid';
		}
	},

	reset() {
		this.enabled = false;
		this.ready = false;
	},
};

const { throwIfFederationNotEnabledOrNotReady, throwIfFederationNotReady, throwIfFederationEnabledButNotReady } = proxyquire
	.noCallThru()
	.load<typeof federationUtilsModule>('../../../../server/services/federation/utils', {
		'../../../app/settings/server': {
			settings,
		},
	});

describe('Federation helper functions', () => {
	afterEach(() => {
		settings.reset();
	});

	describe('#throwIfFederationNotReady', () => {
		it('should throw if federation is not ready', () => {
			expect(throwIfFederationNotReady).to.throw();
		});
	});

	describe('#throwIfFederationNotEnabledOrNotReady', () => {
		it('should throw if federation is not enabled', () => {
			expect(throwIfFederationNotEnabledOrNotReady).to.throw();
		});

		it('should throw if federation is enabled but configuration is invalid', () => {
			settings.enabled = true;
			expect(throwIfFederationNotEnabledOrNotReady).to.throw();
		});

		it('should not throw if both federation is enabled and configuration is valid', () => {
			settings.enabled = true;
			settings.ready = true;
			expect(throwIfFederationNotEnabledOrNotReady).to.not.throw();
		});
	});

	describe('#throwIfFederationEnabledButNotReady', () => {
		it('should throw if federation is enabled and configuration is invalid', () => {
			settings.enabled = true;
			settings.ready = false;

			expect(throwIfFederationEnabledButNotReady).to.throw();
		});

		it('should not throw if federation is disabled', () => {
			expect(throwIfFederationEnabledButNotReady).to.not.throw();

			settings.ready = true;
			expect(throwIfFederationEnabledButNotReady).to.not.throw();
		});
	});
});
