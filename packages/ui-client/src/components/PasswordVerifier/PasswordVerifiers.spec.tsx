import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, waitFor } from '@testing-library/react';

import { PasswordVerifier } from './PasswordVerifier';

afterEach(() => {
	// restore the spy created with spyOn
	jest.restoreAllMocks();
});

it('should render no policy if its disabled ', () => {
	const { queryByRole } = render(<PasswordVerifier password='' />, {
		wrapper: mockAppRoot().withSetting('Accounts_Password_Policy_Enabled', 'true').build(),
	});

	expect(queryByRole('list')).toBeNull();
});

it('should render no policy if its enabled but empty', async () => {
	const { queryByRole, queryByTestId } = render(<PasswordVerifier password='asasdfafdgsdffdf' />, {
		wrapper: mockAppRoot().build(),
	});

	await waitFor(() => {
		expect(queryByTestId('password-verifier-skeleton')).toBeNull();
	});
	expect(queryByRole('list')).toBeNull();
});

it('should render policy list if its enabled and not empty', async () => {
	const { queryByRole, queryByTestId } = render(<PasswordVerifier password='asasdfafdgsdffdf' />, {
		wrapper: mockAppRoot()
			.withSetting('Accounts_Password_Policy_Enabled', 'true')
			.withSetting('Accounts_Password_Policy_MinLength', '6')
			.build(),
	});

	await waitFor(() => {
		expect(queryByTestId('password-verifier-skeleton')).toBeNull();
	});

	expect(queryByRole('list')).toBeVisible();
	expect(queryByRole('listitem')).toBeVisible();
});

it('should render all the policies when all policies are enabled', async () => {
	const { queryByTestId, queryAllByRole } = render(<PasswordVerifier password='asasdfafdgsdffdf' />, {
		wrapper: mockAppRoot()
			.withSetting('Accounts_Password_Policy_Enabled', 'true')
			.withSetting('Accounts_Password_Policy_MinLength', '6')
			.withSetting('Accounts_Password_Policy_MaxLength', '24')
			.withSetting('Accounts_Password_Policy_ForbidRepeatingCharacters', 'true')
			.withSetting('Accounts_Password_Policy_ForbidRepeatingCharactersCount', '3')
			.withSetting('Accounts_Password_Policy_AtLeastOneLowercase', 'true')
			.withSetting('Accounts_Password_Policy_AtLeastOneUppercase', 'true')
			.withSetting('Accounts_Password_Policy_AtLeastOneNumber', 'true')
			.withSetting('Accounts_Password_Policy_AtLeastOneSpecialCharacter', 'true')
			.build(),
	});

	await waitFor(() => {
		expect(queryByTestId('password-verifier-skeleton')).toBeNull();
	});

	expect(queryAllByRole('listitem').length).toEqual(7);
});

it("should render policy as invalid if password doesn't match the requirements", async () => {
	const { queryByTestId, getByRole } = render(<PasswordVerifier password='asd' />, {
		wrapper: mockAppRoot()
			.withSetting('Accounts_Password_Policy_Enabled', 'true')
			.withSetting('Accounts_Password_Policy_MinLength', '10')
			.build(),
	});

	await waitFor(() => {
		expect(queryByTestId('password-verifier-skeleton')).toBeNull();
	});

	expect(getByRole('listitem', { name: 'get-password-policy-minLength-label' })).toHaveAttribute('aria-invalid', 'true');
});

it('should render policy as valid if password matches the requirements', async () => {
	const { queryByTestId, getByRole } = render(<PasswordVerifier password='asd' />, {
		wrapper: mockAppRoot()
			.withSetting('Accounts_Password_Policy_Enabled', 'true')
			.withSetting('Accounts_Password_Policy_MinLength', '2')
			.build(),
	});

	await waitFor(() => {
		expect(queryByTestId('password-verifier-skeleton')).toBeNull();
	});
	expect(getByRole('listitem', { name: 'get-password-policy-minLength-label' })).toHaveAttribute('aria-invalid', 'false');
});
