import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import LocalSearchOptIn from './LocalSearchOptIn';
import { absoluteUrl } from '../../../lib/absoluteUrl';
import { getSearchIndexBackend } from '../../../lib/e2eeSearch/getSearchIndexBackend';
import { isSearchIndexOptedIn, setSearchIndexOptIn } from '../../../lib/e2eeSearch/searchIndexOptIn';

jest.mock('../../../lib/absoluteUrl', () => ({ absoluteUrl: jest.fn(() => 'https://chat.example.test/team/') }));
jest.mock('../../../lib/e2eeSearch/getSearchIndexBackend', () => ({ getSearchIndexBackend: jest.fn() }));

const label = 'Index my encrypted messages on this device';
const description = 'Search encrypted messages on this device. Disable this option to delete the local index.';
const workspace = 'https://chat.example.test/team/';
const wrapper = ({ adminAllows = true, withUser = true }: { adminAllows?: boolean; withUser?: boolean } = {}) => {
	const root = mockAppRoot();
	if (withUser) root.withJohnDoe();
	return root
		.withSetting('E2E_Enable_Local_Search', adminAllows)
		.withTranslations('en', 'core', { E2E_Local_Search_Opt_In: label, E2E_Local_Search_Opt_In_Description: description })
		.build();
};

beforeEach(() => {
	jest.clearAllMocks();
	window.localStorage.clear();
	jest.mocked(absoluteUrl).mockReturnValue(workspace);
	jest.mocked(getSearchIndexBackend).mockReturnValue({} as never);
});

afterEach(() => jest.restoreAllMocks());

it('defaults off and stores consent for the absolute workspace URL and user', async () => {
	render(<LocalSearchOptIn />, { wrapper: wrapper() });
	const toggle = screen.getByRole('checkbox', { name: label });
	expect(toggle).not.toBeChecked();
	expect(toggle).toHaveAccessibleDescription(description);
	expect(absoluteUrl).toHaveBeenCalledWith('');
	await userEvent.click(toggle);
	expect(toggle).toBeChecked();
	expect(isSearchIndexOptedIn(workspace, 'john.doe')).toBe(true);
	expect(isSearchIndexOptedIn('https://chat.example.test/other/', 'john.doe')).toBe(false);
	expect(isSearchIndexOptedIn(workspace, 'other-user')).toBe(false);
	await userEvent.click(toggle);
	expect(toggle).not.toBeChecked();
	expect(isSearchIndexOptedIn(workspace, 'john.doe')).toBe(false);
});

it('keeps the consent after remount', () => {
	setSearchIndexOptIn(workspace, 'john.doe', true);
	const first = render(<LocalSearchOptIn />, { wrapper: wrapper() });
	expect(screen.getByRole('checkbox', { name: label })).toBeChecked();
	first.unmount();
	render(<LocalSearchOptIn />, { wrapper: wrapper() });
	expect(screen.getByRole('checkbox', { name: label })).toBeChecked();
});

it('updates from same-page consent changes', () => {
	render(<LocalSearchOptIn />, { wrapper: wrapper() });
	act(() => {
		setSearchIndexOptIn(workspace, 'john.doe', true);
	});
	expect(screen.getByRole('checkbox', { name: label })).toBeChecked();
	act(() => {
		setSearchIndexOptIn(workspace, 'john.doe', false);
	});
	expect(screen.getByRole('checkbox', { name: label })).not.toBeChecked();
});

it('updates from another tab in the same workspace', () => {
	render(<LocalSearchOptIn />, { wrapper: wrapper() });
	const key = `E2EESearch_OptIn_v2_${JSON.stringify([workspace, 'john.doe'])}`;
	act(() => {
		window.localStorage.setItem(key, 'true');
		window.dispatchEvent(new StorageEvent('storage', { key, storageArea: window.localStorage }));
	});
	expect(screen.getByRole('checkbox', { name: label })).toBeChecked();
});

it('ignores consent from another workspace and ambiguous legacy consent', () => {
	window.localStorage.setItem('E2EESearch_OptIn_john.doe', 'true');
	setSearchIndexOptIn('https://other.example.test/', 'john.doe', true);
	render(<LocalSearchOptIn />, { wrapper: wrapper() });
	expect(screen.getByRole('checkbox', { name: label })).not.toBeChecked();
});

it.each(['admin', 'user', 'backend'] as const)('hides the option without %s access', (missing) => {
	if (missing === 'backend') jest.mocked(getSearchIndexBackend).mockReturnValue(undefined);
	render(<LocalSearchOptIn />, { wrapper: wrapper({ adminAllows: missing !== 'admin', withUser: missing !== 'user' }) });
	expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
	if (missing !== 'backend') expect(getSearchIndexBackend).not.toHaveBeenCalled();
});

it('keeps the workspace default off when the setting is absent', () => {
	render(<LocalSearchOptIn />, { wrapper: mockAppRoot().withJohnDoe().build() });
	expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
});

it('does not show consent as enabled when storage rejects the choice', async () => {
	jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
		throw new Error('Storage unavailable');
	});
	render(<LocalSearchOptIn />, { wrapper: wrapper() });
	await userEvent.click(screen.getByRole('checkbox', { name: label }));
	expect(screen.getByRole('checkbox', { name: label })).not.toBeChecked();
});
