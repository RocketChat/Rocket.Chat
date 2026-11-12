import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect, fn, userEvent, waitFor } from 'storybook/test';

import Banner from './Banner';
import { ariaSnapshot, classContract, expectForwards, expectKeyboardActivation } from '../../testing/g0';
import { Icon } from '../Icon';

// G0 characterization of Banner on its develop implementation. A rewrite passes these unedited, in jest and in the compiled
// zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/Banner',
	component: Banner,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Banner>;

type Story = StoryObj<typeof Banner>;

const onAction = fn();
const onClose = fn();
const forwardedRef = createRef<HTMLDivElement>();

// The icon shows from 375px on, and jsdom has no layout: only a browser can measure it
const isJsdom = () => navigator.userAgent.includes('jsdom');

// `ref` is forwarded at runtime but absent from the props type, so it goes in through a spread
export const Forwarding: Story = {
	render: () => (
		<Banner
			{...{ ref: forwardedRef }}
			className='consumer-class'
			id='banner-id'
			title='Heads up'
			data-qa='banner-qa'
			data-anything='anything'
			aria-label='banner label'
		>
			Body
		</Banner>
	),
	play: async ({ canvasElement }) => {
		const banner = canvasElement.querySelector('.rcx-banner') as HTMLElement;
		await expectForwards(canvasElement, banner, {
			'className': 'consumer-class',
			'id': 'banner-id',
			'data-qa': 'banner-qa',
			'data-anything': 'anything',
			'aria-label': 'banner label',
			'ref': forwardedRef,
		});
		await expect(banner.tagName).toBe('DIV');
	},
};

export const RoleAndFocus: Story = {
	render: () => (
		<>
			<Banner>Passive</Banner>
			<Banner onAction={onAction}>Actionable</Banner>
			<Banner role='alert' tabIndex={-2}>
				Custom
			</Banner>
		</>
	),
	play: async ({ canvasElement }) => {
		const [passive, actionable, custom] = [...canvasElement.querySelectorAll('.rcx-banner')];
		await expect(passive).toHaveAttribute('role', 'banner');
		await expect(passive).toHaveAttribute('tabindex', '-1');
		await expect(actionable).toHaveAttribute('role', 'button');
		await expect(actionable).toHaveAttribute('tabindex', '0');
		await expect(custom).toHaveAttribute('role', 'alert');
		await expect(custom).toHaveAttribute('tabindex', '-2');
	},
};

export const Actions: Story = {
	render: () => (
		<Banner onAction={onAction} onClose={onClose} closeable title='Title'>
			Body
		</Banner>
	),
	play: async ({ canvasElement }) => {
		const banner = canvasElement.querySelector('.rcx-banner') as HTMLElement;
		const close = canvasElement.querySelector('.rcx-banner__close-button button') as HTMLElement;
		onAction.mockClear();
		onClose.mockClear();

		await userEvent.click(banner);
		await expect(onAction).toHaveBeenCalledTimes(1);

		// Closing must not also trigger the banner's own action
		await userEvent.click(close);
		await expect(onClose).toHaveBeenCalledTimes(1);
		await expect(onAction).toHaveBeenCalledTimes(1);
	},
};

export const KeyboardActivation: Story = {
	render: () => <Banner onAction={onAction}>Press</Banner>,
	play: async ({ canvasElement }) => {
		const banner = canvasElement.querySelector('.rcx-banner') as HTMLElement;
		await expectKeyboardActivation(banner, onAction);
	},
};

export const Slots: Story = {
	render: () => (
		<>
			<div style={{ width: 300 }}>
				<Banner title='Title' link='https://rocket.chat' linkText='Read more' linkTarget='_self' icon={<Icon name='info' size='x20' />}>
					Body
				</Banner>
			</div>
			<div style={{ width: 300 }}>
				<Banner link='https://rocket.chat' />
			</div>
			<div style={{ width: 300 }}>
				<Banner>Plain</Banner>
			</div>
		</>
	),
	play: async ({ canvasElement }) => {
		const [full, defaults, plain] = [...canvasElement.querySelectorAll('.rcx-banner')];

		await expect(full.querySelector('h6.rcx-banner__title')).toHaveTextContent('Title');
		await expect(full.querySelector('.rcx-banner__content')).toHaveTextContent('Body');
		const link = full.querySelector('a.rcx-banner__link') as HTMLAnchorElement;
		await expect(link).toHaveAttribute('href', 'https://rocket.chat');
		await expect(link).toHaveAttribute('target', '_self');
		await expect(link).toHaveTextContent('Read more');
		await expect(full.querySelector('.rcx-banner__close-button')).toBeNull();

		const defaultLink = defaults.querySelector('a.rcx-banner__link') as HTMLAnchorElement;
		await expect(defaultLink).toHaveAttribute('target', '_blank');
		await expect(defaultLink).toHaveTextContent('More info');

		await expect(plain.querySelector('.rcx-banner__title')).toBeNull();
		await expect(plain.querySelector('.rcx-banner__link')).toBeNull();
	},
};

export const IconVisibility: Story = {
	render: () => (
		<>
			<div id='wide' style={{ width: 600 }}>
				<Banner variant='info' icon={<Icon name='info' size='x20' />}>
					Wide
				</Banner>
			</div>
			<div id='inline' style={{ width: 600 }}>
				<Banner variant='danger' inline icon={<Icon name='info' size='x20' />}>
					Inline
				</Banner>
			</div>
			<div id='narrow' style={{ width: 300 }}>
				<Banner variant='info' icon={<Icon name='info' size='x20' />}>
					Narrow
				</Banner>
			</div>
		</>
	),
	play: async ({ canvasElement }) => {
		const wide = canvasElement.querySelector('#wide') as HTMLElement;
		const narrow = canvasElement.querySelector('#narrow') as HTMLElement;
		const inline = canvasElement.querySelector('#inline') as HTMLElement;
		if (isJsdom()) {
			await expect(wide.querySelector('.rcx-banner__icon')).toBeNull();
		} else {
			await waitFor(() => expect(wide.querySelector('.rcx-banner__icon')).not.toBeNull());
			await expect(wide.querySelector('.rcx-banner__icon')).toHaveClass('rcx-banner__icon--info');
			await expect(wide.querySelector('.rcx-banner__icon')).not.toHaveClass('rcx-banner__icon--inline');
			await waitFor(() => expect(inline.querySelector('.rcx-banner__icon')).not.toBeNull());
			await expect(inline.querySelector('.rcx-banner__icon')).toHaveClass('rcx-banner__icon--danger--inline');
		}
		await expect(narrow.querySelector('.rcx-banner__icon')).toBeNull();
	},
};

export const InvalidVariant: Story = {
	render: () => (
		// @ts-expect-error a consumer outside the type system
		<Banner variant='bogus'>Fallback</Banner>
	),
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelector('.rcx-banner')).toHaveClass('rcx-banner--neutral');
	},
};

const everyVariation = (
	<div style={{ width: 300 }}>
		<Banner>Neutral</Banner>
		<Banner variant='info' title='Info'>
			Description
		</Banner>
		<Banner variant='success' title='Success' closeable onClose={onClose}>
			Description
		</Banner>
		<Banner variant='warning' title='Warning' actionable onAction={onAction}>
			Description
		</Banner>
		<Banner variant='danger' inline title='Danger' closeable onClose={onClose} link='https://rocket.chat'>
			Description
		</Banner>
	</div>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- banner:',
				'  - text: "Neutral"',
				'- banner:',
				'  - heading "Info" [level=6]',
				'  - text: "Description"',
				'- banner:',
				'  - heading "Success" [level=6]',
				'  - text: "Description"',
				'  - button',
				'- button "Warning Description":',
				'  - heading "Warning" [level=6]',
				'- banner:',
				'  - heading "Danger" [level=6]',
				'  - text: "Description"',
				'  - link "More info"',
				'  - button',
			].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > div > div[0]: rcx-banner rcx-banner--neutral',
				'root > div > div[0] > div: rcx-banner__content',
				'root > div > div[1]: rcx-banner rcx-banner--info',
				'root > div > div[1] > div: rcx-banner__content',
				'root > div > div[1] > div > h6: rcx-banner__title',
				'root > div > div[2]: rcx-banner rcx-banner--success',
				'root > div > div[2] > div[0]: rcx-banner__content',
				'root > div > div[2] > div[0] > h6: rcx-banner__title',
				'root > div > div[2] > div[1]: rcx-banner__close-button',
				'root > div > div[2] > div[1] > button: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--small-square rcx-button--square',
				'root > div > div[2] > div[1] > button > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-cross',
				'root > div > div[3]: rcx-banner rcx-banner--actionable rcx-banner--warning',
				'root > div > div[3] > div: rcx-banner__content',
				'root > div > div[3] > div > h6: rcx-banner__title',
				'root > div > div[4]: rcx-banner rcx-banner--danger rcx-banner--inline',
				'root > div > div[4] > div[0]: rcx-banner__content rcx-banner__content--inline',
				'root > div > div[4] > div[0] > h6: rcx-banner__title rcx-banner__title--inline',
				'root > div > div[4] > div[0] > a: rcx-banner__link rcx-banner__link--danger',
				'root > div > div[4] > div[1]: rcx-banner__close-button rcx-banner__close-button--inline',
				'root > div > div[4] > div[1] > button: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--small-square rcx-button--square',
				'root > div > div[4] > div[1] > button > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-cross',
			].join('\n'),
		);
	},
};
