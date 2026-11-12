import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect, fn } from 'storybook/test';

import { ariaSnapshot, classContract, expectForwards, expectTabOrder } from '../../testing/g0';
import { Button, IconButton } from '../Button';
import ButtonGroup from './ButtonGroup';

// G0 characterization of ButtonGroup on its develop implementation. A rewrite passes these unedited, in jest and in the
// compiled zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/ButtonGroup',
	component: ButtonGroup,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof ButtonGroup>;

type Story = StoryObj<typeof ButtonGroup>;

const onClick = fn();
const forwardedRef = createRef<HTMLDivElement>();

export const Forwarding: Story = {
	render: () => (
		<ButtonGroup
			ref={forwardedRef}
			className='consumer-class'
			id='group-id'
			title='group title'
			data-qa='group-qa'
			data-anything='anything'
			aria-label='group label'
			onClick={onClick}
		>
			<Button>One</Button>
		</ButtonGroup>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, '.rcx-button-group', {
			'className': 'consumer-class',
			'id': 'group-id',
			'title': 'group title',
			'data-qa': 'group-qa',
			'data-anything': 'anything',
			'aria-label': 'group label',
			'ref': forwardedRef,
			'handlers': { onClick },
		});
	},
};

// Toolbars override the role: the group's own comes before the consumer's props
export const RoleIsTheConsumers: Story = {
	render: () => (
		<>
			<ButtonGroup aria-label='A group'>
				<Button>One</Button>
			</ButtonGroup>
			<ButtonGroup role='toolbar' aria-label='A toolbar'>
				<Button>One</Button>
			</ButtonGroup>
		</>
	),
	play: async ({ canvasElement }) => {
		const [group, toolbar] = [...canvasElement.querySelectorAll('.rcx-button-group')];
		await expect(group).toHaveAttribute('role', 'group');
		await expect(toolbar).toHaveAttribute('role', 'toolbar');
	},
};

export const CapturesToolbarEvents: Story = {
	render: () => (
		<ButtonGroup role='toolbar' aria-label='Toolbar' onKeyDownCapture={onClick} onFocusCapture={onClick} onBlurCapture={onClick}>
			<Button>One</Button>
			<Button>Two</Button>
		</ButtonGroup>
	),
	play: async ({ canvasElement }) => {
		const [first] = [...canvasElement.querySelectorAll('button')];
		onClick.mockClear();
		first.focus();
		await expect(onClick).toHaveBeenCalled();
	},
};

export const TabOrder: Story = {
	render: () => (
		<ButtonGroup>
			<Button>One</Button>
			<Button>Two</Button>
			<IconButton icon='kebab' title='Three' />
		</ButtonGroup>
	),
	play: async ({ canvasElement }) => {
		await expectTabOrder([...canvasElement.querySelectorAll('button')]);
	},
};

const everyVariation = (
	<>
		<ButtonGroup>
			<Button>Default</Button>
		</ButtonGroup>
		<ButtonGroup align='center' small>
			<Button>Center small</Button>
		</ButtonGroup>
		<ButtonGroup align='end' large wrap>
			<Button>End large wrap</Button>
		</ButtonGroup>
		<ButtonGroup stretch vertical>
			<Button>Stretch vertical</Button>
		</ButtonGroup>
		<ButtonGroup stretch='equal'>
			<Button>Stretch equal</Button>
			<Button square icon='kebab' aria-label='More' />
		</ButtonGroup>
	</>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- group:',
				'  - button "Default"',
				'- group:',
				'  - button "Center small"',
				'- group:',
				'  - button "End large wrap"',
				'- group:',
				'  - button "Stretch vertical"',
				'- group:',
				'  - button "Stretch equal"',
				'  - button "More"',
			].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > div[0]: rcx-button-group rcx-button-group--align-start',
				'root > div[0] > button: rcx-box rcx-box--full rcx-button',
				'root > div[0] > button > span: rcx-button--content',
				'root > div[1]: rcx-button-group rcx-button-group--align-center rcx-button-group--small',
				'root > div[1] > button: rcx-box rcx-box--full rcx-button',
				'root > div[1] > button > span: rcx-button--content',
				'root > div[2]: rcx-button-group rcx-button-group--align-end rcx-button-group--large rcx-button-group--wrap',
				'root > div[2] > button: rcx-box rcx-box--full rcx-button',
				'root > div[2] > button > span: rcx-button--content',
				'root > div[3]: rcx-button-group rcx-button-group--align-start rcx-button-group--stretch rcx-button-group--vertical',
				'root > div[3] > button: rcx-box rcx-box--full rcx-button',
				'root > div[3] > button > span: rcx-button--content',
				'root > div[4]: rcx-button-group rcx-button-group--align-start rcx-button-group--stretch rcx-button-group--stretch-equal',
				'root > div[4] > button[0]: rcx-box rcx-box--full rcx-button',
				'root > div[4] > button[0] > span: rcx-button--content',
				'root > div[4] > button[1]: rcx-box rcx-box--full rcx-button rcx-button--square',
				'root > div[4] > button[1] > span: rcx-button--content',
				'root > div[4] > button[1] > span > i: rcx-box rcx-box--full rcx-button__icon rcx-icon rcx-icon--name-kebab',
			].join('\n'),
		);
	},
};
