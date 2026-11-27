import { act, render } from '@testing-library/react';

import InputBox from './InputBox.native';
import InputBoxSkeleton from './InputBoxSkeleton.native';
import InputBoxWrapper from './InputBoxWrapper.native';
import PasswordInput from '../PasswordInput/PasswordInput';

type Captured = { host: string; props: Record<string, any> };

const mockHosts: Captured[] = [];

jest.mock(
	'react-native',
	() => {
		const host = (name: string) => (props: Record<string, any>) => {
			mockHosts.push({ host: name, props });
			return props.children ?? null;
		};
		return { Image: host('Image'), Pressable: host('Pressable'), Text: host('Text'), TextInput: host('TextInput'), View: host('View') };
	},
	{ virtual: true },
);
jest.mock('../../helpers/resolveHost', () => jest.requireActual('../../helpers/resolveHost.native'));
jest.mock('../../helpers/bridgeInputProps', () => jest.requireActual('../../helpers/bridgeInputProps.native'));
jest.mock('../Box/useStylingProps', () => jest.requireActual('../Box/useStylingProps.native'));
jest.mock('./InputBox', () => jest.requireActual('./InputBox.native'));
jest.mock('./InputBoxAddon', () => jest.requireActual('./InputBoxAddon.native'));

const last = (host: string) => mockHosts.filter((captured) => captured.host === host).at(-1)?.props ?? {};
const wrapper = () => mockHosts.filter(({ props }) => props.className?.includes('rcx-input-box__wrapper')).at(-1)?.props ?? {};
const flatten = (style: unknown) => Object.assign({}, ...[style].flat());

beforeEach(() => {
	mockHosts.length = 0;
});

describe('InputBox on native', () => {
	it('draws the border, radius, background and padding the web stylesheet gives an input', () => {
		render(<InputBox type='text' />);

		expect(last('TextInput').multiline).toBeUndefined();
		expect(flatten(last('TextInput').style)).toMatchObject({
			borderWidth: 1,
			borderRadius: 4,
			minHeight: 40,
			paddingVertical: 8,
			paddingHorizontal: 15,
			borderColor: expect.stringMatching(/^#/),
			backgroundColor: expect.stringMatching(/^#/),
			color: expect.stringMatching(/^#/),
			fontSize: expect.any(Number),
			lineHeight: expect.any(Number),
		});
	});

	it('does not collapse to the caret: the field grows to fill its row', () => {
		render(<InputBox type='text' startAddon='a' />);

		expect(flatten(last('TextInput').style)).toMatchObject({ flexGrow: 1, flexShrink: 1, minWidth: 0 });
		expect(flatten(last('TextInput').style)).not.toHaveProperty('borderWidth');
	});

	it('gives the placeholder the hint colour', () => {
		render(<InputBox type='text' placeholder='Name' />);

		expect(last('TextInput').placeholder).toBe('Name');
		expect(last('TextInput').placeholderTextColor).toMatch(/^#/);
	});

	it('highlights the border and draws the focus ring while focused, and clears both on blur', () => {
		const onFocus = jest.fn();
		const onBlur = jest.fn();
		render(<InputBox type='text' onFocus={onFocus} onBlur={onBlur} />);
		const before = flatten(last('TextInput').style);

		act(() => last('TextInput').onFocus({ type: 'focus' }));

		const focused = flatten(last('TextInput').style);
		expect(focused.borderColor).not.toBe(before.borderColor);
		expect(focused.boxShadow).toMatch(/^0px 0px 0px 2px #/);
		expect(onFocus).toHaveBeenCalledTimes(1);

		act(() => last('TextInput').onBlur({ type: 'blur' }));

		expect(flatten(last('TextInput').style)).toEqual(before);
		expect(onBlur).toHaveBeenCalledTimes(1);
	});

	it('draws an error border, and a danger ring when focused', () => {
		render(<InputBox type='text' error='Required' />);
		const idle = flatten(last('TextInput').style);

		act(() => last('TextInput').onFocus({ type: 'focus' }));
		const focused = flatten(last('TextInput').style);

		expect(focused.borderColor).toBe(idle.borderColor);
		expect(focused.boxShadow).toMatch(/^0px 0px 0px 2px /);

		render(<InputBox type='text' />);
		expect(flatten(last('TextInput').style).borderColor).not.toBe(idle.borderColor);
	});

	it('draws a disabled input with the disabled colours, no ring, and not editable', () => {
		render(<InputBox type='text' disabled />);
		const idle = flatten(last('TextInput').style);
		expect(last('TextInput').editable).toBe(false);
		render(<InputBox type='text' />);
		const enabled = flatten(last('TextInput').style);

		expect(idle.backgroundColor).not.toBe(enabled.backgroundColor);
		expect(idle.color).not.toBe(enabled.color);
	});

	it('has no focus ring when disabled', () => {
		render(<InputBox type='text' disabled />);

		act(() => last('TextInput').onFocus({ type: 'focus' }));

		expect(flatten(last('TextInput').style)).not.toHaveProperty('boxShadow');
	});

	it('sizes a small input like the web', () => {
		render(<InputBox type='text' small />);

		expect(flatten(last('TextInput').style)).toMatchObject({ minHeight: 28, paddingVertical: 4, paddingHorizontal: 8 });
	});

	it('takes a multiline field as a text area with min and max height styles and no auto-grow', () => {
		const heights = { minHeight: 52, maxHeight: 155 };
		render(<InputBox type='textarea' rows={3} {...heights} />);

		expect(last('TextInput')).toMatchObject({ multiline: true, numberOfLines: 3 });
		expect(flatten(last('TextInput').style)).toMatchObject({ minHeight: 52, maxHeight: 155, textAlignVertical: 'top' });
		expect(last('TextInput')).not.toHaveProperty('onContentSizeChange');
	});

	it('hands the text to onChange and keeps the controlled selection untouched', () => {
		const onChange = jest.fn();
		const selection = { selection: { start: 1, end: 2 } };
		render(<InputBox type='text' onChange={onChange} {...selection} />);

		last('TextInput').onChangeText('hello');

		expect(onChange).toHaveBeenCalledWith('hello');
		expect(last('TextInput').selection).toEqual({ start: 1, end: 2 });
	});

	it('wraps the field and its addons in a row drawn as the input', () => {
		render(<InputBox type='text' startAddon='s' endAddon='e' />);

		expect(flatten(wrapper().style)).toMatchObject({
			flexDirection: 'row',
			alignItems: 'center',
			gap: 8,
			borderWidth: 1,
			borderRadius: 4,
			paddingHorizontal: 15,
		});
	});

	it('draws the focus ring on the wrapper, not on the field, when there is an addon', () => {
		render(<InputBox type='text' endAddon='e' />);

		act(() => last('TextInput').onFocus({ type: 'focus' }));

		expect(flatten(wrapper().style).boxShadow).toMatch(/^0px 0px 0px 2px #/);
		expect(flatten(last('TextInput').style)).not.toHaveProperty('boxShadow');
	});

	it('aligns a text area to the top of its wrapper and pads a flush end addon', () => {
		render(<InputBox type='textarea' endAddon='e' endAddonFlush />);

		expect(flatten(wrapper().style)).toMatchObject({ alignItems: 'flex-start', paddingVertical: 4, paddingEnd: 4 });
	});

	it('hides with display none', () => {
		render(<InputBox type='text' hidden />);

		expect(flatten(last('TextInput').style).display).toBe('none');
	});
});

describe('InputBoxWrapper and InputBoxSkeleton on native', () => {
	it('draw their own frame as a View, not as text', () => {
		render(<InputBoxWrapper />);
		render(<InputBoxSkeleton />);

		expect(mockHosts.map(({ host }) => host)).toEqual(['View', 'View']);
		expect(flatten(mockHosts[0].props.style)).toMatchObject({ borderWidth: 1, flexDirection: 'row' });
		expect(flatten(mockHosts[1].props.style)).toMatchObject({ borderWidth: 1, paddingVertical: 11 });
	});
});

describe('PasswordInput on native', () => {
	it('lays out the eye beside the field and toggles the secure entry on press', () => {
		render(<PasswordInput placeholder='Password' />);

		expect(last('TextInput').secureTextEntry).toBe(true);
		expect(last('Text').onPress).toEqual(expect.any(Function));

		act(() => last('Text').onPress());

		expect(last('TextInput').secureTextEntry).toBeUndefined();

		act(() => last('Text').onPress());

		expect(last('TextInput').secureTextEntry).toBe(true);
	});
});
