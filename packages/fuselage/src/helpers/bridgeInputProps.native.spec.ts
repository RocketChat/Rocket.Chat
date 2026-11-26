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
});

describe('bridgeInputProps on web', () => {
	it('returns the props as they are', () => {
		const props = { onChange: jest.fn() };
		expect(bridgeWebInputProps(props)).toBe(props);
	});
});
