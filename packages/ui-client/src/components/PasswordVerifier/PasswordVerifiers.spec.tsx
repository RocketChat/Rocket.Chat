import { mockAppRoot } from '@rocket.chat/mock-providers';
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

jest.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (str: string) => str,
		i18n: {
			changeLanguage: () => new Promise(() => undefined),
		},
	}),
}));

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
		policy: [['get-password-policy-minLength', { minLength: 10 }]],
		// policy: [],
	};
	const mock = mockAppRoot();
	const spyMock = jest.spyOn(mock, 'withEndpoint');

	const { debug, queryByRole } = render(<PasswordVerifier password='asdf' />, {
		wrapper: mock.withEndpoint('GET', '/v1/pw.getPolicy', () => response).build(),
	});

	await waitFor(() => {
		debug();
		expect(spyMock).toHaveBeenCalled();
		expect(queryByRole('list')).not.toBeInTheDocument();
	});
});

it('should render policy if its enabled', async () => {
	const response: Response = {
		enabled: true,
		policy: [['get-password-policy-minLength', { minLength: 10 }]],
		// policy: [],
	};
	const mock = mockAppRoot();
	const spyMock = jest.spyOn(mock, 'withEndpoint');

	const { debug, queryByRole } = render(<PasswordVerifier password='asdf' />, {
		wrapper: mock.withEndpoint('GET', '/v1/pw.getPolicy', () => response).build(),
	});

	await waitFor(() => {
		debug();
		expect(spyMock).toHaveBeenCalled();
		expect(queryByRole('list')).toBeInTheDocument();
	});
});

it("should render policy as invalid if password doesn't match the requirements", async () => {
	const response: Response = {
		enabled: true,
		policy: [['get-password-policy-minLength', { minLength: 10 }]],
	};
	const { getByText } = render(<PasswordVerifier password='asdf' />, {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/pw.getPolicy', () => response)
			.build(),
	});

	await waitFor(() => {
		expect(getByText('get-password-policy-minLength-label').parentElement?.dataset.invalid).toBe('true');
	});
});

it('should render policy as valid if password match the requirements', async () => {
	const response: Response = {
		enabled: true,
		policy: [['get-password-policy-minLength', { minLength: 2 }]],
	};
	const { getByText } = render(<PasswordVerifier password='asdf' />, {
		wrapper: mockAppRoot()
			.withEndpoint('GET', '/v1/pw.getPolicy', () => response)
			.build(),
	});

	await waitFor(() => {
		expect(getByText('get-password-policy-minLength-label').parentElement?.dataset.invalid).toBe(undefined);
	});
});
