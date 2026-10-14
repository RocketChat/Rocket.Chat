import { after, before, beforeEach, describe, it } from 'node:test';

import { render, screen } from '@testing-library/react';
import { expect } from 'expect';
import sinon from 'sinon';

import RetentionPolicyWarning from './RetentionPolicyWarning';
import { createRenteionPolicySettingsMock as createMock } from '../../../../tests/mocks/client/mockRetentionPolicySettings';
import { createFakeRoom } from '../../../../tests/mocks/data';

let clock: sinon.SinonFakeTimers;

describe('RetentionPolicyWarning', () => {
	before(() => {
		clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] });
	});

	after(() => clock.restore());

	beforeEach(() => {
		clock.setSystemTime(new Date(2024, 5, 1, 0, 0, 0));
	});
	it('Should render callout if settings are valid', () => {
		const fakeRoom = createFakeRoom({ t: 'c' });
		render(<RetentionPolicyWarning room={fakeRoom} />, {
			wrapper: createMock({ appliesToChannels: true, TTLChannels: 60000 }),
		});
		expect(screen.getByRole('alert')).toHaveTextContent('1 minute June 1, 2024 at 12:30 AM');
	});

	it('Should not render callout if settings are invalid', () => {
		const fakeRoom = createFakeRoom({ t: 'c' });
		render(<RetentionPolicyWarning room={fakeRoom} />, {
			wrapper: createMock({ appliesToChannels: true, TTLChannels: 60000, advancedPrecisionCron: '* * * 12 *', advancedPrecision: true }),
		});
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});
});
