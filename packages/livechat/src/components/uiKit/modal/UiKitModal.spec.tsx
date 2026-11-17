import { render } from 'preact';
import { act } from 'preact/test-utils';

import { UiKitModal } from './UiKitModal';
import type { UiKitModalView } from './UiKitModal';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../message/Surface', () => ({ __esModule: true, default: ({ children }: any) => <div>{children}</div> }));
jest.mock('../message/Block', () => ({
	__esModule: true,
	default: ({ children }: any) => <div>{children}</div>,
	useBlockActionDispatcher: () => () => undefined,
	usePerformAction: () => [() => undefined, false],
}));

let root: HTMLElement;

beforeEach(() => {
	root = document.body.appendChild(document.createElement('div'));
});

afterEach(() => {
	render(null, root);
	root.remove();
});

const viewWith = (actionId: string, initialValue: string): UiKitModalView => ({
	id: 'v',
	title: { text: 'Title' },
	blocks: [
		{
			type: 'input',
			blockId: 'b',
			label: { type: 'plain_text', text: 'L' },
			element: { type: 'plain_text_input', actionId, initialValue },
		},
	],
});

const draw = (props: Partial<Parameters<typeof UiKitModal>[0]> & { view: UiKitModalView }) =>
	// oxlint-disable-next-line testing-library/no-unnecessary-act
	act(() => {
		render(
			<UiKitModal
				appId='app'
				dispatchBlockAction={async () => undefined}
				onSubmit={() => undefined}
				onClose={() => undefined}
				{...props}
			/>,
			root,
		);
	});

describe('UiKitModal', () => {
	it('shows the initial value of an input that replaces another at the same position', () => {
		draw({ view: viewWith('a', 'x') });
		const input = () => root.querySelector('input') as HTMLInputElement;
		act(() => {
			input().value = 'typed';
			input().dispatchEvent(new Event('input', { bubbles: true }));
		});
		expect(input().value).toBe('typed');

		draw({ view: viewWith('b', 'y') });

		expect(input().value).toBe('y');
	});

	it('ignores Escape while a request is in flight', async () => {
		const onClose = jest.fn();
		draw({ view: viewWith('a', 'x'), onSubmit: () => new Promise(() => undefined), onClose });

		await act(() => {
			(Array.from(root.querySelectorAll('button')).pop() as HTMLButtonElement).click();
		});
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

		expect(onClose).not.toHaveBeenCalled();
	});
});
