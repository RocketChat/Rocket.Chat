import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect, fn, waitFor } from 'storybook/test';

import Callout from './Callout';
import { ariaSnapshot, classContract, expectForwards } from '../../testing/g0';
import { Button } from '../Button';

// G0 characterization of Callout on its develop implementation. A rewrite passes these unedited, in jest and in the compiled
// zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/Callout',
	component: Callout,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Callout>;

type Story = StoryObj<typeof Callout>;

const onClick = fn();
const forwardedRef = createRef<HTMLElement>();

export const Forwarding: Story = {
	render: () => (
		<Callout
			ref={forwardedRef}
			className='consumer-class'
			id='callout-id'
			title='Heads up'
			data-qa='callout-qa'
			data-anything='anything'
			aria-label='callout label'
			aria-live='polite'
			role='alert'
			type='warning'
			onClick={onClick}
		>
			Body
		</Callout>
	),
	play: async ({ canvasElement }) => {
		const callout = canvasElement.querySelector('section') as HTMLElement;
		await expectForwards(canvasElement, callout, {
			'className': 'consumer-class',
			'id': 'callout-id',
			'data-qa': 'callout-qa',
			'data-anything': 'anything',
			'aria-label': 'callout label',
			'ref': forwardedRef,
			'handlers': { onClick },
		});
		await expect(callout).toHaveAttribute('aria-live', 'polite');
		await expect(callout).toHaveAttribute('role', 'alert');
	},
};

export const Slots: Story = {
	render: () => (
		<>
			<Callout type='danger' title='Title' actions={<Button size='small'>Retry</Button>}>
				Description
			</Callout>
			<Callout>Description only</Callout>
			<Callout title='Title only' />
			<Callout icon='hash'>Custom icon</Callout>
			<Callout type='info' />
		</>
	),
	play: async ({ canvasElement }) => {
		const [full, bare, titleOnly, custom, empty] = [...canvasElement.querySelectorAll('section')];

		await expect(full.querySelector('.rcx-callout__title')).toHaveTextContent('Title');
		await expect(full.querySelector('.rcx-callout__content')).toHaveTextContent('Description');
		await expect(full.querySelector('.rcx-callout__actions button')).toHaveTextContent('Retry');
		await expect(full.querySelector('.rcx-callout__icon')).toHaveClass('rcx-icon--name-ban');

		await expect(bare.querySelector('.rcx-callout__title')).toBeNull();
		await expect(bare.querySelector('.rcx-callout__actions')).toBeNull();
		await expect(bare.querySelector('.rcx-callout__icon')).toHaveClass('rcx-icon--name-info-circled');

		await expect(titleOnly.querySelector('.rcx-callout__content')).toBeNull();
		await expect(custom.querySelector('.rcx-callout__icon')).toHaveClass('rcx-icon--name-hash');

		await expect(empty.querySelector('.rcx-callout__title')).toBeNull();
		await expect(empty.querySelector('.rcx-callout__content')).toBeNull();
	},
};

export const DefaultIcons: Story = {
	render: () => (
		<>
			<Callout type='info'>info</Callout>
			<Callout type='success'>success</Callout>
			<Callout type='warning'>warning</Callout>
			<Callout type='danger'>danger</Callout>
		</>
	),
	play: async ({ canvasElement }) => {
		const icons = [...canvasElement.querySelectorAll('.rcx-callout__icon')];
		await expect(icons.map((icon) => [...icon.classList].find((name) => name.startsWith('rcx-icon--name-')))).toEqual([
			'rcx-icon--name-info-circled',
			'rcx-icon--name-checkmark-circled',
			'rcx-icon--name-warning',
			'rcx-icon--name-ban',
		]);
	},
};

// The wrapper turns into a row at 420px; jsdom has no layout, so only a browser can measure it
export const WideLayout: Story = {
	render: () => (
		<div style={{ width: 640 }}>
			<Callout type='info' title='Title' actions={<Button size='small'>Action</Button>}>
				Description
			</Callout>
		</div>
	),
	play: async ({ canvasElement }) => {
		const wrapper = canvasElement.querySelector('.rcx-callout__wrapper') as HTMLElement;
		if (navigator.userAgent.includes('jsdom')) {
			await expect(wrapper).not.toHaveClass('rcx-callout__wrapper--large');
			return;
		}
		await waitFor(() => expect(wrapper).toHaveClass('rcx-callout__wrapper--large'));
	},
};

const everyVariation = (
	<div style={{ width: 300 }}>
		<Callout>Default</Callout>
		<Callout type='info' title='Info'>
			Description
		</Callout>
		<Callout type='success' title='Success' actions={<Button size='small'>Action</Button>}>
			Description
		</Callout>
		<Callout type='warning' title='Warning' icon='hash' />
		<Callout type='danger'>Danger</Callout>
	</div>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- text: "Default"',
				'- text: "Info"',
				'- text: "Description"',
				'- text: "Success"',
				'- text: "Description"',
				'- button "Action"',
				'- text: "Warning"',
				'- text: "Danger"',
			].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > div > section[0]: rcx-box rcx-box--full rcx-callout',
				'root > div > section[0] > i: rcx-box rcx-box--full rcx-callout__icon rcx-icon rcx-icon--name-info-circled',
				'root > div > section[0] > div: rcx-box rcx-box--full rcx-callout__wrapper',
				'root > div > section[0] > div > div: rcx-box rcx-box--full rcx-callout__wrapper-content',
				'root > div > section[0] > div > div > div: rcx-box rcx-box--full rcx-callout__content',
				'root > div > section[1]: rcx-box rcx-box--full rcx-callout rcx-callout--info',
				'root > div > section[1] > i: rcx-box rcx-box--full rcx-callout__icon rcx-icon rcx-icon--name-info-circled',
				'root > div > section[1] > div: rcx-box rcx-box--full rcx-callout__wrapper',
				'root > div > section[1] > div > div: rcx-box rcx-box--full rcx-callout__wrapper-content',
				'root > div > section[1] > div > div > div[0]: rcx-box rcx-box--full rcx-callout__title',
				'root > div > section[1] > div > div > div[1]: rcx-box rcx-box--full rcx-callout__content',
				'root > div > section[2]: rcx-box rcx-box--full rcx-callout rcx-callout--success',
				'root > div > section[2] > i: rcx-box rcx-box--full rcx-callout__icon rcx-icon rcx-icon--name-checkmark-circled',
				'root > div > section[2] > div: rcx-box rcx-box--full rcx-callout__wrapper',
				'root > div > section[2] > div > div[0]: rcx-box rcx-box--full rcx-callout__wrapper-content',
				'root > div > section[2] > div > div[0] > div[0]: rcx-box rcx-box--full rcx-callout__title',
				'root > div > section[2] > div > div[0] > div[1]: rcx-box rcx-box--full rcx-callout__content',
				'root > div > section[2] > div > div[1]: rcx-box rcx-box--full rcx-callout__actions',
				'root > div > section[2] > div > div[1] > button: rcx-box rcx-box--full rcx-button rcx-button--small',
				'root > div > section[2] > div > div[1] > button > span: rcx-button--content',
				'root > div > section[3]: rcx-box rcx-box--full rcx-callout rcx-callout--warning',
				'root > div > section[3] > i: rcx-box rcx-box--full rcx-callout__icon rcx-icon rcx-icon--name-hash',
				'root > div > section[3] > div: rcx-box rcx-box--full rcx-callout__wrapper',
				'root > div > section[3] > div > div: rcx-box rcx-box--full rcx-callout__wrapper-content',
				'root > div > section[3] > div > div > div: rcx-box rcx-box--full rcx-callout__title',
				'root > div > section[4]: rcx-box rcx-box--full rcx-callout rcx-callout--danger',
				'root > div > section[4] > i: rcx-box rcx-box--full rcx-callout__icon rcx-icon rcx-icon--name-ban',
				'root > div > section[4] > div: rcx-box rcx-box--full rcx-callout__wrapper',
				'root > div > section[4] > div > div: rcx-box rcx-box--full rcx-callout__wrapper-content',
				'root > div > section[4] > div > div > div: rcx-box rcx-box--full rcx-callout__content',
			].join('\n'),
		);
	},
};
