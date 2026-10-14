import { after, before, beforeEach, describe, it, mock } from 'node:test';

import { act, render, waitFor } from '@testing-library/react';
import { expect } from 'expect';
import { fn } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';

import CodeMirror from './CodeMirror';
import { enterModuleScope, leaveModuleScope } from '../../../../../../../tests/mocks/moduleScope';

type ChangeHandler = (doc: { getValue: () => string }) => void;

const editor = {
	on: fn<(...args: [string, ChangeHandler]) => void>(),
	off: fn<(...args: [string, ChangeHandler]) => void>(),
	setOption: fn<FunctionLike>(),
	setValue: fn<(...args: [string]) => void>(),
	getValue: fn<(...args: []) => string>(),
	toTextArea: fn<FunctionLike>(),
};

const fromTextArea = fn<FunctionLike>(() => editor);

const flushAsync = () => act(() => Promise.resolve());

describe('CodeMirror', () => {
	before(() => {
		enterModuleScope();
		mock.module(require.resolve('codemirror'), {
			exports: {
				default: {
					__esModule: true,
					default: { fromTextArea: (...args: unknown[]) => fromTextArea(...(args as [])) },
				},
			},
		});
		mock.module(require.resolve('codemirror/addon/edit/matchbrackets'), { exports: {} });
		mock.module(require.resolve('codemirror/addon/edit/closebrackets'), { exports: {} });
		mock.module(require.resolve('codemirror/addon/edit/matchtags'), { exports: {} });
		mock.module(require.resolve('codemirror/addon/edit/trailingspace'), { exports: {} });
		mock.module(require.resolve('codemirror/addon/search/match-highlighter'), { exports: {} });
		mock.module(require.resolve('codemirror/lib/codemirror.css'), { exports: {} });
		mock.module('../../../../../../lib/codeMirror', { exports: {} });
	});

	after(leaveModuleScope);

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
		render(<CodeMirror id='cm' readOnly={false} value='hello' onChange={fn<FunctionLike>()} />);

		await waitFor(() => expect(fromTextArea).toHaveBeenCalledTimes(1));
		expect(editor.setValue).toHaveBeenCalledWith('hello');
		expect(editor.on).toHaveBeenCalledWith('change', expect.any(Function));
	});

	it('tears down the editor on unmount', async () => {
		const { unmount } = render(<CodeMirror id='cm' readOnly={false} value='' onChange={fn<FunctionLike>()} />);

		await waitFor(() => expect(fromTextArea).toHaveBeenCalledTimes(1));

		unmount();

		expect(editor.off).toHaveBeenCalledWith('change', expect.any(Function));
		expect(editor.toTextArea).toHaveBeenCalledTimes(1);
	});

	it('updates options without recreating the editor', async () => {
		const { rerender } = render(<CodeMirror id='cm' readOnly={false} mode='javascript' value='' onChange={fn<FunctionLike>()} />);

		await waitFor(() => expect(fromTextArea).toHaveBeenCalledTimes(1));
		editor.setOption.mockClear();

		rerender(<CodeMirror id='cm' readOnly mode='xml' value='' onChange={fn<FunctionLike>()} />);
		await flushAsync();

		expect(fromTextArea).toHaveBeenCalledTimes(1);
		expect(editor.toTextArea).not.toHaveBeenCalled();
		expect(editor.setOption).toHaveBeenCalledWith('mode', 'xml');
		expect(editor.setOption).toHaveBeenCalledWith('readOnly', true);
	});

	it('syncs external value changes into the editor', async () => {
		const { rerender } = render(<CodeMirror id='cm' readOnly={false} value='a' onChange={fn<FunctionLike>()} />);

		await waitFor(() => expect(fromTextArea).toHaveBeenCalledTimes(1));
		editor.getValue.mockReturnValue('a');
		editor.setValue.mockClear();

		rerender(<CodeMirror id='cm' readOnly={false} value='b' onChange={fn<FunctionLike>()} />);
		await flushAsync();

		expect(editor.setValue).toHaveBeenCalledWith('b');
	});

	it('does not re-set the value when it already matches the editor content', async () => {
		const { rerender } = render(<CodeMirror id='cm' readOnly={false} value='a' onChange={fn<FunctionLike>()} />);

		await waitFor(() => expect(fromTextArea).toHaveBeenCalledTimes(1));
		editor.getValue.mockReturnValue('a');
		editor.setValue.mockClear();

		rerender(<CodeMirror id='cm' readOnly={false} value='a' onChange={fn<FunctionLike>()} />);
		await flushAsync();

		expect(editor.setValue).not.toHaveBeenCalled();
	});

	it('forwards editor changes to onChange', async () => {
		const onChange = fn<FunctionLike>();
		render(<CodeMirror id='cm' readOnly={false} value='' onChange={onChange} />);

		await waitFor(() => expect(editor.on).toHaveBeenCalled());

		const handler = editor.on.mock.calls[0][1];
		act(() => handler({ getValue: () => 'typed' }));

		expect(onChange).toHaveBeenCalledWith('typed');
	});
});
