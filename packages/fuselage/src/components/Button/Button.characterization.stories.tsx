import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect, fn } from 'storybook/test';

import { ariaSnapshot, classContract, expectForwards, expectKeyboardActivation } from '../../testing/g0';
import { ButtonGroup } from '../ButtonGroup';
import Button from './Button';

// G0 characterization of Button on its develop implementation. A rewrite passes these unedited, in jest and in the compiled
// zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/Button',
	component: Button,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Button>;

type Story = StoryObj<typeof Button>;

const onClick = fn();
const forwardedRef = createRef<HTMLButtonElement>();
const callbackRef = fn();

export const Forwarding: Story = {
	render: () => (
		<>
			<Button
				ref={forwardedRef}
				className='consumer-class'
				id='button-id'
				title='button title'
				data-qa='button-qa'
				data-anything='anything'
				aria-label='button label'
				onClick={onClick}
				onFocus={fn()}
			>
				Save
			</Button>
			<Button is='a' href='/somewhere' ref={callbackRef} className='consumer-link' data-qa='link-qa'>
				Go
			</Button>
		</>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, 'button', {
			'className': 'consumer-class',
			'id': 'button-id',
			'title': 'button title',
			'data-qa': 'button-qa',
			'data-anything': 'anything',
			'aria-label': 'button label',
			'ref': forwardedRef,
			'handlers': { onClick },
		});
		await expectForwards(canvasElement, 'a', { 'className': 'consumer-link', 'data-qa': 'link-qa', 'ref': callbackRef });
	},
};

export const Handlers: Story = {
	render: () => (
		<>
			<Button onClick={onClick}>Enabled</Button>
			<Button disabled onClick={onClick}>
				Disabled
			</Button>
			<Button loading onClick={onClick}>
				Loading
			</Button>
		</>
	),
	play: async ({ canvasElement }) => {
		const [enabled, disabled, loading] = [...canvasElement.querySelectorAll('button')];
		onClick.mockClear();

		enabled.click();
		await expect(onClick).toHaveBeenCalledTimes(1);

		disabled.click();
		loading.click();
		await expect(onClick).toHaveBeenCalledTimes(1);
	},
};

export const KeyboardActivation: Story = {
	render: () => <Button onClick={onClick}>Press</Button>,
	play: async ({ canvasElement }) => {
		const button = canvasElement.querySelector('button') as HTMLButtonElement;
		await expect(button).toHaveAttribute('type', 'button');
		await expectKeyboardActivation(button, onClick);
	},
};

const everyVariation = (
	<ButtonGroup>
		<Button>Default</Button>
		<Button variant='primary' size='large'>
			Primary large
		</Button>
		<Button variant='secondary-danger' size='small'>
			Secondary danger small
		</Button>
		<Button variant='success' icon='check'>
			With icon
		</Button>
		<Button square size='tiny' icon='plus' aria-label='Add' />
		<Button compact>OK</Button>
		<Button disabled>Disabled</Button>
		<Button loading>Loading</Button>
		<Button is='a' href='/somewhere' external>
			Link
		</Button>
	</ButtonGroup>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- group:',
				'  - button "Default"',
				'  - button "Primary large"',
				'  - button "Secondary danger small"',
				'  - button "With icon"',
				'  - button "Add"',
				'  - button "OK"',
				'  - button "Disabled" [disabled]',
				'  - button "Loading" [disabled]',
				'  - link "Link"',
			].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > div: rcx-button-group rcx-button-group--align-start',
				'root > div > button[0]: rcx-box rcx-box--full rcx-button',
				'root > div > button[0] > span: rcx-button--content',
				'root > div > button[1]: rcx-box rcx-box--full rcx-button rcx-button--large rcx-button--primary',
				'root > div > button[1] > span: rcx-button--content',
				'root > div > button[2]: rcx-box rcx-box--full rcx-button rcx-button--secondary-danger rcx-button--small',
				'root > div > button[2] > span: rcx-button--content',
				'root > div > button[3]: rcx-box rcx-box--full rcx-button rcx-button--success',
				'root > div > button[3] > span: rcx-button--content',
				'root > div > button[3] > span > i: rcx-box rcx-box--full rcx-button__icon rcx-icon rcx-icon--name-check',
				'root > div > button[4]: rcx-box rcx-box--full rcx-button rcx-button--square rcx-button--tiny-square',
				'root > div > button[4] > span: rcx-button--content',
				'root > div > button[4] > span > i: rcx-box rcx-box--full rcx-button__icon rcx-icon rcx-icon--name-plus',
				'root > div > button[5]: rcx-box rcx-box--full rcx-button rcx-button--compact',
				'root > div > button[5] > span: rcx-button--content',
				'root > div > button[6]: rcx-box rcx-box--full rcx-button',
				'root > div > button[6] > span: rcx-button--content',
				'root > div > button[7]: rcx-box rcx-box--full rcx-button rcx-button--loading',
				'root > div > button[7] > span: rcx-button--content',
				'root > div > button[7] > span > i: rcx-box rcx-box--full rcx-button__icon rcx-icon rcx-icon--name-loading',
				'root > div > a: rcx-box rcx-box--full rcx-button',
				'root > div > a > span: rcx-button--content',
			].join('\n'),
		);
	},
};
