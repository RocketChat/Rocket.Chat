import { render, screen } from '@testing-library/react';

import CodeSettingInput from './CodeSettingInput';

const baseProps = {
	_id: 'Test_JSON',
	label: 'Test JSON',
	hint: '',
	value: '{}',
	code: 'application/json',
	packageValue: '{}',
	readonly: false,
	disabled: false,
	hasResetButton: false,
	onChangeValue: () => undefined,
} as const;

describe('CodeSettingInput', () => {
	it('renders the error message when error is set', () => {
		render(<CodeSettingInput {...baseProps} error='Invalid JSON' />);
		expect(screen.getByText('Invalid JSON')).toBeInTheDocument();
	});

	it('does not render an error message when error is absent', () => {
		render(<CodeSettingInput {...baseProps} />);
		expect(screen.queryByText('Invalid JSON')).not.toBeInTheDocument();
	});
});
