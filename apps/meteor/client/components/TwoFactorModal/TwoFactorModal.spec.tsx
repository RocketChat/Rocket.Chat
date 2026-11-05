import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TwoFactorModal, { Method } from './TwoFactorModal';

const wrapper = mockAppRoot()
	.withTranslations('en', 'core', {
		Verify: 'Verify',
		Password: 'Password',
		Enter_code_here: 'Code',
		Invalid_two_factor_code: 'Wrong code',
		Invalid_password: 'Wrong password',
	})
	.build();

const methods = [
	{ method: Method.TOTP, field: 'Code', error: 'Wrong code' },
	{ method: Method.EMAIL, field: 'Code', error: 'Wrong code' },
	{ method: Method.PASSWORD, field: 'Password', error: 'Wrong password' },
] as const;

const submitWrongCode = async (method: Method, field: string) => {
	const onConfirm = jest.fn().mockRejectedValue(new Error('invalid'));
	render(
		method === Method.EMAIL ? (
			<TwoFactorModal method={method} emailOrUsername='john' onConfirm={onConfirm} onClose={jest.fn()} />
		) : (
			<TwoFactorModal method={method} onConfirm={onConfirm} onClose={jest.fn()} />
		),
		{ wrapper },
	);

	await userEvent.type(screen.getByPlaceholderText(field), '123456');
	await userEvent.click(screen.getByRole('button', { name: 'Verify' }));

	return onConfirm;
};

describe('TwoFactorModal', () => {
	it.each(methods)(
		'should keep the $method prompt open with an error and an empty field after a wrong code',
		async ({ method, field, error }) => {
			const onConfirm = await submitWrongCode(method, field);

			expect(onConfirm).toHaveBeenCalledWith('123456', method);
			expect(await screen.findByText(error)).toBeInTheDocument();
			expect(screen.getByPlaceholderText(field)).toHaveValue('');
		},
	);
});
