import { render, screen } from '@testing-library/react';

import RetentionPolicyWarning from './RetentionPolicyWarning';
import { createRenteionPolicySettingsMock as createMock } from '../../../../tests/mocks/client/mockRetentionPolicySettings';
import { createFakeRoom } from '../../../../tests/mocks/data';

jest.useFakeTimers();

beforeEach(() => {
	jest.setSystemTime(new Date(2024, 5, 1, 0, 0, 0));
});

describe('RetentionPolicyWarning', () => {
	it('Should render callout if settings are valid', () => {
		const fakeRoom = createFakeRoom({ t: 'c' });
		render(<RetentionPolicyWarning room={fakeRoom} />, {
			legacyRoot: true,
			wrapper: createMock({ appliesToChannels: true, TTLChannels: 60000 }),
		});
		expect(screen.getByRole('alert')).toHaveTextContent('a minute June 1, 2024 at 12:30 AM');
	});

	it('Should not render callout if settings are invalid', () => {
		const fakeRoom = createFakeRoom({ t: 'c' });
		render(<RetentionPolicyWarning room={fakeRoom} />, {
			legacyRoot: true,
			wrapper: createMock({ appliesToChannels: true, TTLChannels: 60000, advancedPrecisionCron: '* * * 12 *', advancedPrecision: true }),
		});
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});
});
