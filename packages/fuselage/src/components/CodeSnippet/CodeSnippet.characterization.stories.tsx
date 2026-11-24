import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect, fn } from 'storybook/test';

import CodeSnippet from './CodeSnippet';
import { ariaSnapshot, classContract, expectForwards } from '../../testing/g0';

// G0 characterization of CodeSnippet on its develop implementation. A rewrite passes these unedited, in jest and in the
// compiled zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/CodeSnippet',
	component: CodeSnippet,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof CodeSnippet>;

type Story = StoryObj<typeof CodeSnippet>;

const onClick = fn();
const empty = '';
const forwardedRef = createRef<HTMLPreElement>();

// `ref` is forwarded at runtime but absent from the type withBoxStyling exposes, so it goes in through a spread
export const Forwarding: Story = {
	render: () => (
		<CodeSnippet
			{...{ ref: forwardedRef }}
			className='consumer-class'
			id='snippet-id'
			title='snippet title'
			data-qa='snippet-qa'
			data-anything='anything'
			aria-label='snippet label'
		>
			yarn install
		</CodeSnippet>
	),
	play: async ({ canvasElement }) => {
		const snippet = canvasElement.querySelector('pre') as HTMLPreElement;
		await expectForwards(canvasElement, snippet, {
			'className': 'consumer-class',
			'id': 'snippet-id',
			'title': 'snippet title',
			'data-qa': 'snippet-qa',
			'data-anything': 'anything',
			'aria-label': 'snippet label',
			'ref': forwardedRef,
		});
	},
};

export const LoadingForwarding: Story = {
	render: () => (
		<CodeSnippet {...{ ref: forwardedRef }} className='consumer-class' id='loading-id' data-qa='loading-qa'>
			{empty}
		</CodeSnippet>
	),
	play: async ({ canvasElement }) => {
		const snippet = canvasElement.querySelector('pre') as HTMLPreElement;
		await expectForwards(canvasElement, snippet, {
			'className': 'consumer-class',
			'id': 'loading-id',
			'data-qa': 'loading-qa',
			'ref': forwardedRef,
		});
	},
};

export const CopyButton: Story = {
	render: () => (
		<>
			<CodeSnippet onClick={onClick} buttonText='Duplicate'>
				yarn install
			</CodeSnippet>
			<CodeSnippet onClick={onClick} buttonDisabled>
				yarn build
			</CodeSnippet>
			<CodeSnippet>yarn test</CodeSnippet>
		</>
	),
	play: async ({ canvasElement }) => {
		const [active, disabled, none] = [...canvasElement.querySelectorAll('pre')];
		onClick.mockClear();

		const button = active.querySelector('button') as HTMLButtonElement;
		await expect(button).toHaveTextContent('Duplicate');
		await expect(button).toBeEnabled();
		button.click();
		await expect(onClick).toHaveBeenCalledTimes(1);

		const off = disabled.querySelector('button') as HTMLButtonElement;
		await expect(off).toHaveTextContent('Copy');
		await expect(off).toBeDisabled();
		off.click();
		await expect(onClick).toHaveBeenCalledTimes(1);

		await expect(none.querySelector('button')).toBeNull();
	},
};

export const Content: Story = {
	render: () => <CodeSnippet>{'line one\nline two'}</CodeSnippet>,
	play: async ({ canvasElement }) => {
		const code = canvasElement.querySelector('[role="code"]') as HTMLElement;
		await expect(code.textContent).toBe('line one\nline two');
	},
};

const everyVariation = (
	<>
		<CodeSnippet>yarn install</CodeSnippet>
		<CodeSnippet onClick={onClick}>yarn install</CodeSnippet>
		<CodeSnippet onClick={onClick} buttonDisabled>
			yarn install
		</CodeSnippet>
		<CodeSnippet onClick={onClick}>{empty}</CodeSnippet>
	</>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- code:',
				'  - text: "yarn install"',
				'- code:',
				'  - text: "yarn install"',
				'- button "Copy"',
				'- code:',
				'  - text: "yarn install"',
				'- button "Copy" [disabled]',
			].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > pre[0]: rcx-box rcx-box--full rcx-code-snippet',
				'root > pre[0] > div: rcx-box rcx-box--full rcx-code-snippet__codebox',
				'root > pre[1]: rcx-box rcx-box--full rcx-code-snippet',
				'root > pre[1] > div[0]: rcx-box rcx-box--full rcx-code-snippet__codebox',
				'root > pre[1] > div[1]: rcx-box rcx-box--full',
				'root > pre[1] > div[1] > button: rcx-box rcx-box--full rcx-button rcx-button--primary rcx-button--small',
				'root > pre[1] > div[1] > button > span: rcx-button--content',
				'root > pre[2]: rcx-box rcx-box--full rcx-code-snippet',
				'root > pre[2] > div[0]: rcx-box rcx-box--full rcx-code-snippet__codebox',
				'root > pre[2] > div[1]: rcx-box rcx-box--full',
				'root > pre[2] > div[1] > button: rcx-box rcx-box--full rcx-button rcx-button--primary rcx-button--small',
				'root > pre[2] > div[1] > button > span: rcx-button--content',
				'root > pre[3]: rcx-box rcx-box--full rcx-code-snippet',
				'root > pre[3] > span: rcx-skeleton rcx-skeleton--text',
			].join('\n'),
		);
	},
};
