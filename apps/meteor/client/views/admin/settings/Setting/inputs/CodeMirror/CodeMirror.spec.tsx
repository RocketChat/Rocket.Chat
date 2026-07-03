import { act, render, waitFor } from '@testing-library/react';

import CodeMirror from './CodeMirror';

type ChangeHandler = (doc: { getValue: () => string }) => void;

const editor = {
	on: jest.fn<void, [string, ChangeHandler]>(),
	off: jest.fn<void, [string, ChangeHandler]>(),
	setOption: jest.fn(),
	setValue: jest.fn<void, [string]>(),
	getValue: jest.fn<string, []>(),
	toTextArea: jest.fn(),
};

const fromTextArea = jest.fn(() => editor);

jest.mock('codemirror', () => ({
	__esModule: true,
	default: { fromTextArea: (...args: unknown[]) => fromTextArea(...(args as [])) },
}));

jest.mock('codemirror/addon/edit/matchbrackets', () => ({}), { virtual: true });
jest.mock('codemirror/addon/edit/closebrackets', () => ({}), { virtual: true });
jest.mock('codemirror/addon/edit/matchtags', () => ({}), { virtual: true });
jest.mock('codemirror/addon/edit/trailingspace', () => ({}), { virtual: true });
jest.mock('codemirror/addon/search/match-highlighter', () => ({}), { virtual: true });
jest.mock('codemirror/lib/codemirror.css', () => ({}), { virtual: true });
jest.mock('../../../../../../../app/ui/client/lib/codeMirror/codeMirror', () => ({}), { virtual: true });

const flushAsync = () => act(() => Promise.resolve());

beforeEach(() => {
	editor.on.mockClear();
	editor.off.mockClear();
	editor.setOption.mockClear();
	editor.setValue.mockClear();
	editor.getValue.mockReset();
	editor.getValue.mockReturnValue('');
	editor.toTextArea.mockClear();
	fromTextArea.mockClear();
});

it('initializes CodeMirror on mount with the initial value', async () => {
	render(<CodeMirror id='cm' readOnly={false} value='hello' onChange={jest.fn()} />);

	await waitFor(() => expect(fromTextArea).toHaveBeenCalledTimes(1));
	expect(editor.setValue).toHaveBeenCalledWith('hello');
	expect(editor.on).toHaveBeenCalledWith('change', expect.any(Function));
});

it('tears down the editor on unmount', async () => {
	const { unmount } = render(<CodeMirror id='cm' readOnly={false} value='' onChange={jest.fn()} />);

	await waitFor(() => expect(fromTextArea).toHaveBeenCalledTimes(1));

	unmount();

	expect(editor.off).toHaveBeenCalledWith('change', expect.any(Function));
	expect(editor.toTextArea).toHaveBeenCalledTimes(1);
});

it('updates options without recreating the editor', async () => {
	const { rerender } = render(<CodeMirror id='cm' readOnly={false} mode='javascript' value='' onChange={jest.fn()} />);

	await waitFor(() => expect(fromTextArea).toHaveBeenCalledTimes(1));
	editor.setOption.mockClear();

	rerender(<CodeMirror id='cm' readOnly mode='xml' value='' onChange={jest.fn()} />);
	await flushAsync();

	expect(fromTextArea).toHaveBeenCalledTimes(1);
	expect(editor.toTextArea).not.toHaveBeenCalled();
	expect(editor.setOption).toHaveBeenCalledWith('mode', 'xml');
	expect(editor.setOption).toHaveBeenCalledWith('readOnly', true);
});

it('syncs external value changes into the editor', async () => {
	const { rerender } = render(<CodeMirror id='cm' readOnly={false} value='a' onChange={jest.fn()} />);

	await waitFor(() => expect(fromTextArea).toHaveBeenCalledTimes(1));
	editor.getValue.mockReturnValue('a');
	editor.setValue.mockClear();

	rerender(<CodeMirror id='cm' readOnly={false} value='b' onChange={jest.fn()} />);
	await flushAsync();

	expect(editor.setValue).toHaveBeenCalledWith('b');
});

it('does not re-set the value when it already matches the editor content', async () => {
	const { rerender } = render(<CodeMirror id='cm' readOnly={false} value='a' onChange={jest.fn()} />);

	await waitFor(() => expect(fromTextArea).toHaveBeenCalledTimes(1));
	editor.getValue.mockReturnValue('a');
	editor.setValue.mockClear();

	rerender(<CodeMirror id='cm' readOnly={false} value='a' onChange={jest.fn()} />);
	await flushAsync();

	expect(editor.setValue).not.toHaveBeenCalled();
});

it('forwards editor changes to onChange', async () => {
	const onChange = jest.fn();
	render(<CodeMirror id='cm' readOnly={false} value='' onChange={onChange} />);

	await waitFor(() => expect(editor.on).toHaveBeenCalled());

	const handler = editor.on.mock.calls[0][1];
	act(() => handler({ getValue: () => 'typed' }));

	expect(onChange).toHaveBeenCalledWith('typed');
});
