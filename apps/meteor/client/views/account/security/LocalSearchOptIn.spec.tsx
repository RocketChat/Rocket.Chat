import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import LocalSearchOptIn from './LocalSearchOptIn';
import { getSearchIndexBackend } from '../../../lib/e2eeSearch/getSearchIndexBackend';
import { isSearchIndexOptedIn } from '../../../lib/e2eeSearch/searchIndexOptIn';

jest.mock('../../../lib/e2eeSearch/getSearchIndexBackend', () => ({
	getSearchIndexBackend: jest.fn(),
}));

const label = 'Index my encrypted messages on this device';

const renderOptIn = ({ adminAllows = true } = {}) =>
	render(<LocalSearchOptIn />, {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withSetting('E2E_Enable_Local_Search', adminAllows)
			.withTranslations('en', 'core', { E2E_Local_Search_Opt_In: label })
			.build(),
	});

beforeEach(() => {
	window.localStorage.clear();
	jest.mocked(getSearchIndexBackend).mockReturnValue({} as never);
});

it('shows the opt-in off by default and stores the choice for this user on this device', async () => {
	renderOptIn();

	const toggle = screen.getByRole('checkbox', { name: label });
	expect(toggle).not.toBeChecked();

	await userEvent.click(toggle);

	expect(toggle).toBeChecked();
	expect(isSearchIndexOptedIn('john.doe')).toBe(true);

	await userEvent.click(toggle);

	expect(isSearchIndexOptedIn('john.doe')).toBe(false);
});

it('shows nothing when the admin does not allow local search', () => {
	renderOptIn({ adminAllows: false });

	expect(screen.queryByRole('checkbox', { name: label })).not.toBeInTheDocument();
});

it('shows nothing without a local index backend (normal browser, old desktop)', () => {
	jest.mocked(getSearchIndexBackend).mockReturnValue(undefined);
	renderOptIn();

	expect(screen.queryByRole('checkbox', { name: label })).not.toBeInTheDocument();
});
