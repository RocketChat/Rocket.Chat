import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import type { MouseEvent } from 'react';
import { expect, fn } from 'storybook/test';

import { ariaSnapshot, classContract, expectForwards, expectKeyboardActivation } from '../../testing/g0';
import { ButtonGroup } from '../ButtonGroup';
import IconButton from './IconButton';

// G0 characterization of IconButton on its develop implementation. A rewrite passes these unedited, in jest and in the compiled
// zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/IconButton',
	component: IconButton,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof IconButton>;

type Story = StoryObj<typeof IconButton>;

const onClick = fn();
const forwardedRef = createRef<HTMLButtonElement>();
const callbackRef = fn();
const onLinkClick = fn((event: MouseEvent<HTMLElement>) => event.preventDefault());

export const Forwarding: Story = {
	render: () => (
		<>
			<IconButton
				ref={forwardedRef}
				icon='kebab'
				className='consumer-class'
				id='button-id'
				title='button title'
				data-qa='button-qa'
				data-anything='anything'
				aria-label='button label'
				onClick={onClick}
				onFocus={fn()}
			/>
			<IconButton
				is='a'
				icon='link'
				href='/somewhere'
				ref={callbackRef}
				className='consumer-link'
				id='link-id'
				title='link title'
				data-qa='link-qa'
				data-anything='link-anything'
				aria-label='link label'
				onClick={onLinkClick}
			/>
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
		await expectForwards(canvasElement, 'a', {
			'className': 'consumer-link',
			'id': 'link-id',
			'title': 'link title',
			'data-qa': 'link-qa',
			'data-anything': 'link-anything',
			'aria-label': 'link label',
			'ref': callbackRef,
			'handlers': { onClick: onLinkClick },
		});
	},
};

export const Handlers: Story = {
	render: () => (
		<>
			<IconButton icon='kebab' title='Enabled' onClick={onClick} />
			<IconButton icon='kebab' title='Disabled' disabled onClick={onClick} />
		</>
	),
	play: async ({ canvasElement }) => {
		const [enabled, disabled] = [...canvasElement.querySelectorAll('button')];
		onClick.mockClear();

		enabled.click();
		await expect(onClick).toHaveBeenCalledTimes(1);

		disabled.click();
		await expect(onClick).toHaveBeenCalledTimes(1);
	},
};

export const KeyboardActivation: Story = {
	render: () => <IconButton icon='kebab' title='Press' onClick={onClick} />,
	play: async ({ canvasElement }) => {
		const button = canvasElement.querySelector('button') as HTMLButtonElement;
		await expect(button).toHaveAttribute('type', 'button');
		await expectKeyboardActivation(button, onClick);
	},
};

export const Pressed: Story = {
	render: () => (
		<>
			<IconButton icon='bell' title='Following' pressed aria-pressed />
			<IconButton icon='bell' title='Not following' aria-pressed={false} />
		</>
	),
	play: async ({ canvasElement }) => {
		const [following, notFollowing] = [...canvasElement.querySelectorAll('button')];
		await expect(following).toHaveAttribute('aria-pressed', 'true');
		await expect(notFollowing).toHaveAttribute('aria-pressed', 'false');
	},
};

export const BadgeIsHiddenFromAssistiveTechnology: Story = {
	render: () => <IconButton icon='bell' aria-label='Notifications, 3 unread' badge='3' />,
	play: async ({ canvasElement }) => {
		const badge = canvasElement.querySelector('.rcx-button__badge') as HTMLElement;
		await expect(badge).toHaveAttribute('aria-hidden', 'true');
		await expect(badge).toHaveTextContent('3');
	},
};

const everyVariation = (
	<ButtonGroup>
		<IconButton icon='kebab' title='Default' />
		<IconButton icon='kebab' title='Primary' variant='primary' size='medium' />
		<IconButton icon='kebab' title='Secondary' variant='secondary' size='small' />
		<IconButton icon='kebab' title='Info' variant='info' size='tiny' />
		<IconButton icon='kebab' title='Danger' variant='danger' size='mini' />
		<IconButton icon='kebab' title='Secondary danger' variant='secondary-danger' />
		<IconButton icon='kebab' title='Pressed' pressed variant='secondary-warning' />
		<IconButton icon='kebab' title='Colored' color='danger' />
		<IconButton icon='kebab' title='Disabled' disabled />
		<IconButton icon='bell' title='Badged' badge='1' />
		<IconButton icon='bell' title='Badged bottom' badge='1' badgePosition='bottom-end' />
		<IconButton is='a' icon='link' href='/somewhere' title='Link' external />
	</ButtonGroup>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- group:',
				'  - button "Default"',
				'  - button "Primary"',
				'  - button "Secondary"',
				'  - button "Info"',
				'  - button "Danger"',
				'  - button "Secondary danger"',
				'  - button "Pressed"',
				'  - button "Colored"',
				'  - button "Disabled" [disabled]',
				'  - button "Badged"',
				'  - button "Badged bottom"',
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
				'root > div > button[0]: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--large-square rcx-button--square',
				'root > div > button[0] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-kebab',
				'root > div > button[1]: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--icon-secondary-info rcx-button--medium-square rcx-button--square',
				'root > div > button[1] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-kebab',
				'root > div > button[2]: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--icon-secondary rcx-button--small-square rcx-button--square',
				'root > div > button[2] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-kebab',
				'root > div > button[3]: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--icon-info rcx-button--square rcx-button--tiny-square',
				'root > div > button[3] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-kebab',
				'root > div > button[4]: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--icon-danger rcx-button--mini-square rcx-button--square',
				'root > div > button[4] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-kebab',
				'root > div > button[5]: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--icon-secondary-danger rcx-button--large-square rcx-button--square',
				'root > div > button[5] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-kebab',
				'root > div > button[6]: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--icon-pressed rcx-button--icon-secondary-warning rcx-button--icon-secondary-warning-pressed rcx-button--large-square rcx-button--square',
				'root > div > button[6] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-kebab',
				'root > div > button[7]: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--large-square rcx-button--square',
				'root > div > button[7] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-kebab',
				'root > div > button[8]: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--large-square rcx-button--square',
				'root > div > button[8] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-kebab',
				'root > div > button[9]: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--large-square rcx-button--square rcx-button--with-badge',
				'root > div > button[9] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-bell',
				'root > div > button[9] > span: rcx-button__badge rcx-button__badge--top-end',
				'root > div > button[10]: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--large-square rcx-button--square rcx-button--with-badge',
				'root > div > button[10] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-bell',
				'root > div > button[10] > span: rcx-button__badge rcx-button__badge--bottom-end',
				'root > div > a: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--large-square rcx-button--square',
				'root > div > a > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-link',
			].join('\n'),
		);
	},
};
