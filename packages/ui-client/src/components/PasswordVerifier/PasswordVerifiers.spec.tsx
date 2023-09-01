import { mockAppRoot } from '@rocket.chat/mock-providers';
import { passwordVerificationsTemplate } from '@rocket.chat/ui-contexts/dist/hooks/useVerifyPassword';
import { render, waitFor } from '@testing-library/react';

import { PasswordVerifier } from './PasswordVerifier';

type Response = {
	enabled: boolean;
	policy: [
		name: string,
		value?:
			| {
					[x: string]: number;
			  }
			| undefined,
	][];
};

afterEach(() => {
	// restore the spy created with spyOn
	jest.restoreAllMocks();
});

it('should render no policy if its disabled ', () => {
	const response: Response = {
		enabled: false,
		policy: [],
	};

	const { queryByRole } = render(<PasswordVerifier password='' />, {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/pw.getPolicy', () => response)
			.build(),
	});

	expect(queryByRole('list')).toBeNull();
});

it('should render no policy if its enabled but empty', async () => {
	const response: Response = {
		enabled: true,
		policy: [],
	};

	const { queryByRole, queryByTestId } = render(<PasswordVerifier password='asasdfafdgsdffdf' />, {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/pw.getPolicy', () => response)
			.build(),
	});

	await waitFor(() => {
		expect(queryByTestId('password-verifier-skeleton')).toBeNull();
	});
	expect(queryByRole('list')).toBeNull();
});

it('should render policy list if its enabled and not empty', async () => {
	const response: Response = {
		enabled: true,
		policy: [['get-password-policy-minLength', { minLength: 10 }]],
	};

	const { queryByRole, queryByTestId } = render(<PasswordVerifier password='asasdfafdgsdffdf' />, {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/pw.getPolicy', () => response)
			.build(),
	});

	await waitFor(() => {
		expect(queryByTestId('password-verifier-skeleton')).toBeNull();
	});

	expect(queryByRole('list')).toBeVisible();
	expect(queryByRole('listitem')).toBeVisible();
});

it('should render all the policies when all policies are enabled', async () => {
	const response: Response = {
		enabled: true,
		policy: Object.keys(passwordVerificationsTemplate).map((item) => [item]),
	};

	const { queryByTestId, queryAllByRole } = render(<PasswordVerifier password='asasdfafdgsdffdf' />, {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/pw.getPolicy', () => response)
			.build(),
	});

	await waitFor(() => {
		expect(queryByTestId('password-verifier-skeleton')).toBeNull();
	});

	expect(queryAllByRole('listitem').length).toEqual(response.policy.length);
});

it("should render policy as invalid if password doesn't match the requirements", async () => {
	const response: Response = {
		enabled: true,
		policy: [['get-password-policy-minLength', { minLength: 10 }]],
	};

	const { queryByTestId, getByRole } = render(<PasswordVerifier password='asd' />, {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/pw.getPolicy', () => response)
			.build(),
	});

	await waitFor(() => {
		expect(queryByTestId('password-verifier-skeleton')).toBeNull();
	});

	expect(getByRole('listitem', { name: 'get-password-policy-minLength-label' })).toHaveAttribute('aria-invalid', 'true');
});

it('should render policy as valid if password matches the requirements', async () => {
	const response: Response = {
		enabled: true,
		policy: [['get-password-policy-minLength', { minLength: 2 }]],
	};

	const { queryByTestId, getByRole } = render(<PasswordVerifier password='asd' />, {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/pw.getPolicy', () => response)
			.build(),
	});

	await waitFor(() => {
		expect(queryByTestId('password-verifier-skeleton')).toBeNull();
	});
	expect(getByRole('listitem', { name: 'get-password-policy-minLength-label' })).toHaveAttribute('aria-invalid', 'false');
});
