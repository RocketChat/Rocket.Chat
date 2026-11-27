import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import { LoginForm } from './LoginForm.js';

const renderAfterOAuth = (oauthError: string, { showFormLogin = true } = {}) => {
	const navigate = jest.fn();

	const { container } = render(<LoginForm setLoginRoute={jest.fn()} />, {
		wrapper: mockAppRoot()
			.withSetting('Accounts_ShowFormLogin', showFormLogin)
			.withRouter({
				navigate,
				getLocationPathname: () => '/home',
				getSearchParameters: () => ({ oauthError, layout: 'embedded' }),
			})
			.build(),
	});

	return { navigate, container };
};

it('uses the translated password placeholder when no custom placeholder is configured', () => {
	render(<LoginForm setLoginRoute={jest.fn()} />, { wrapper: mockAppRoot().build() });

	expect(screen.getByPlaceholderText('registration.component.form.password')).toBeInTheDocument();
});

it('keeps the workspace password placeholder when one is configured', () => {
	render(<LoginForm setLoginRoute={jest.fn()} />, {
		wrapper: mockAppRoot().withSetting('Accounts_PasswordPlaceholder', 'Workspace password').build(),
	});

	expect(screen.getByPlaceholderText('Workspace password')).toBeInTheDocument();
});

it('should show why an OAuth sign-in was refused and take the reason out of the address', () => {
	const { navigate } = renderAfterOAuth('error-invalid-username');

	expect(screen.getByText('registration.page.login.errors.invalidUsername')).toBeInTheDocument();
	expect(navigate).toHaveBeenCalledWith({ pathname: '/home', search: { layout: 'embedded' } }, { replace: true });
});

it('should show a failed OAuth sign-in when the workspace hides the password form', () => {
	renderAfterOAuth('error-oauth-login-failed', { showFormLogin: false });

	expect(screen.queryByLabelText('registration.component.form.emailOrUsername', { exact: false })).not.toBeInTheDocument();
	expect(screen.getByText('registration.page.login.errors.serviceLoginFailed')).toBeInTheDocument();
});

it('should show no error message for an error code in the address that the form does not know', () => {
	const { container } = renderAfterOAuth('toString');

	// oxlint-disable-next-line testing-library/no-container, testing-library/no-node-access -- an empty error callout has no role or text to query by
	expect(container.querySelector('[aria-live="assertive"]')).toBeNull();
	expect(screen.getByRole('button', { name: 'registration.component.login' })).toBeInTheDocument();
});
