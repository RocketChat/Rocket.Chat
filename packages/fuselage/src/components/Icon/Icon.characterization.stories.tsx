import nameToCharacterMapping from '@rocket.chat/icons';
import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect, fn } from 'storybook/test';

import Icon from './Icon';
import { ariaSnapshot, classContract, expectForwards } from '../../testing/g0';

// G0 characterization of Icon on its develop implementation. A rewrite passes these unedited, in jest and in the compiled
// zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/Icon',
	component: Icon,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Icon>;

type Story = StoryObj<typeof Icon>;

const forwardedRef = createRef<HTMLElement>();
const onClick = fn();
const onMouseEnter = fn();

export const Forwarding: Story = {
	render: () => (
		<Icon
			ref={forwardedRef}
			name='chat'
			className='consumer-class'
			id='icon-id'
			title='icon title'
			data-qa='icon-qa'
			data-anything='anything'
			aria-label='icon label'
			onClick={onClick}
			onMouseEnter={onMouseEnter}
		/>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, 'i', {
			'className': 'consumer-class',
			'id': 'icon-id',
			'title': 'icon title',
			'data-qa': 'icon-qa',
			'data-anything': 'anything',
			'aria-label': 'icon label',
			'ref': forwardedRef,
			'handlers': { onClick, onMouseEnter },
		});
	},
};

export const Glyph: Story = {
	render: () => (
		<div>
			<Icon name='chat' />
			<Icon name='bell' />
		</div>
	),
	play: async ({ canvasElement }) => {
		const [chat, bell] = Array.from(canvasElement.querySelectorAll('i'));
		await expect(chat).toHaveTextContent(nameToCharacterMapping.chat);
		await expect(bell).toHaveTextContent(nameToCharacterMapping.bell);
		await expect(chat.tagName).toBe('I');
	},
};

export const Decorative: Story = {
	render: () => <Icon name='chat' />,
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelector('i')).toHaveAttribute('aria-hidden', 'true');
		await expect(ariaSnapshot(canvasElement)).toBe('');
	},
};

export const Informative: Story = {
	render: () => <Icon name='warning' role='img' aria-hidden={false} aria-label='Warning' />,
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelector('i')).toHaveAttribute('aria-hidden', 'false');
		await expect(ariaSnapshot(canvasElement)).toBe(['- img "Warning":', `  - text: "${nameToCharacterMapping.warning}"`].join('\n'));
	},
};

export const InformativeByUndefinedAriaHidden: Story = {
	render: () => <Icon name='warning' role='img' aria-hidden={undefined} aria-label='Warning' />,
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelector('i')).not.toHaveAttribute('aria-hidden');
	},
};

const everyVariation = (
	<div>
		<Icon name='chat' />
		<Icon name='chat' size='x16' />
		<Icon name='chat' size={24} />
		<Icon name='chat' size='60px' />
		<Icon name='chat' color='danger' />
		<Icon name='chat' color='hint' />
		<Icon name='chat' color='status-font-on-warning' />
	</div>
);

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		const rows = Array.from({ length: 7 }, (_, index) => `root > div > i[${index}]: rcx-box rcx-box--full rcx-icon rcx-icon--name-chat`);
		await expect(classContract(canvasElement)).toBe(rows.join('\n'));
	},
};
