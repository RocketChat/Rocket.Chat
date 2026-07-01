import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import CodeSettingInput from './CodeSettingInput';

const appRoot = mockAppRoot()
	.withTranslations('en', 'core', {
		Invalid_JSON: 'Invalid JSON',
	})
	.build();

const baseProps = {
	_id: 'Test_JSON',
	label: 'Test JSON',
	hint: '',
	code: 'application/json',
	packageValue: '{}',
	readonly: false,
	disabled: false,
	hasResetButton: false,
	onChangeValue: () => undefined,
} as const;

describe('CodeSettingInput', () => {
	it('renders the error when the value is invalid JSON', () => {
		render(<CodeSettingInput {...baseProps} value='{ invalid' />, { wrapper: appRoot });
		expect(screen.getByText('Invalid JSON')).toBeInTheDocument();
	});

	it('does not render an error when the value is valid JSON', () => {
		render(<CodeSettingInput {...baseProps} value='{}' />, { wrapper: appRoot });
		expect(screen.queryByText('Invalid JSON')).not.toBeInTheDocument();
	});
});
