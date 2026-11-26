import { bridgeInputProps as bridgeWebInputProps } from './bridgeInputProps';
import { bridgeInputProps } from './bridgeInputProps.native';

describe('bridgeInputProps on native', () => {
	it('fires onChange with the text when the input changes', () => {
		const onChange = jest.fn();
		const props = bridgeInputProps({ onChange, placeholder: 'Name' });

		props.onChangeText?.('Ada');

		expect(onChange).toHaveBeenCalledWith('Ada');
		expect(props).not.toHaveProperty('onChange');
		expect(props).toHaveProperty('placeholder', 'Name');
	});

	it('adds nothing when there is no onChange', () => {
		expect(bridgeInputProps({ onChange: undefined, placeholder: 'Name' })).toEqual({ placeholder: 'Name' });
	});

	describe('password', () => {
		it('hides the text', () => {
			const props = bridgeInputProps({ type: 'password', value: 'hunter2' });

			expect(props).toHaveProperty('secureTextEntry', true);
			expect(props).not.toHaveProperty('type');
		});

		it('hides the text whatever else the props ask for', () => {
			const asked = { type: 'password', readOnly: true, onChange: jest.fn(), secureTextEntry: false };
			const props = bridgeInputProps(asked);

			expect(props.secureTextEntry).toBe(true);
		});

		it('shows the text for any other type', () => {
			expect(bridgeInputProps({ type: 'text' })).not.toHaveProperty('secureTextEntry');
			expect(bridgeInputProps({})).not.toHaveProperty('secureTextEntry');
		});
	});

	it.each([
		['email', { keyboardType: 'email-address', autoCapitalize: 'none' }],
		['number', { keyboardType: 'numeric' }],
		['url', { keyboardType: 'url', autoCapitalize: 'none' }],
		['search', { returnKeyType: 'search' }],
		['tel', { keyboardType: 'phone-pad' }],
		['text', {}],
	])('maps type %s to its keyboard', (type, expected) => {
		expect(bridgeInputProps({ type })).toEqual(expected);
	});

	it('lets an explicit autoCapitalize win over the type', () => {
		expect(bridgeInputProps({ type: 'email', autoCapitalize: 'words' })).toEqual({
			keyboardType: 'email-address',
			autoCapitalize: 'words',
		});
	});

	it('passes autoComplete and autoCapitalize through', () => {
		const asked = { type: 'text', autoComplete: 'username', autoCapitalize: 'sentences' };
		expect(bridgeInputProps(asked)).toEqual({ autoComplete: 'username', autoCapitalize: 'sentences' });
	});

	it.each([
		['on', true],
		['off', false],
	] as const)('maps autoCorrect %s to %s', (autoCorrect, expected) => {
		expect(bridgeInputProps({ autoCorrect })).toEqual({ autoCorrect: expected });
	});

	it.each(['readOnly', 'disabled'] as const)('makes the input not editable when %s', (key) => {
		const props = bridgeInputProps({ [key]: true });

		expect(props).toEqual({ editable: false });
	});

	it('keeps the input editable when neither readOnly nor disabled', () => {
		expect(bridgeInputProps({ readOnly: false, disabled: false })).not.toHaveProperty('editable');
	});

	describe('textarea', () => {
		it('is multiline with its rows as the lines', () => {
			expect(bridgeInputProps({ is: 'textarea', rows: 4 })).toEqual({ is: 'textarea', multiline: true, numberOfLines: 4 });
		});

		it('is multiline without rows', () => {
			expect(bridgeInputProps({ is: 'textarea' })).toEqual({ is: 'textarea', multiline: true });
		});

		it('leaves a single-line input single-line', () => {
			expect(bridgeInputProps({ is: 'input', rows: 4 })).not.toHaveProperty('multiline');
		});
	});
});

describe('bridgeInputProps on web', () => {
	it('returns the props as they are', () => {
		const props = { onChange: jest.fn(), type: 'password' };
		expect(bridgeWebInputProps(props)).toBe(props);
	});
});
