import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect, fn, userEvent } from 'storybook/test';

import { Sidebar } from './Sidebar';
import { SidebarBanner } from './SidebarBanner';
import { SidebarButtonGroup } from './SidebarButtonGroup';
import { SidebarDivider } from './SidebarDivider';
import { SidebarFooter, SidebarFooterContent } from './SidebarFooter';
import { SidebarMedia, SidebarMediaController, SidebarMediaTitle } from './SidebarMedia';
import { SidebarSection } from './SidebarSection';
import { ariaSnapshot, computed, expectForwards, isJsdom, shellClasses } from '../../testing/g0';
import { IconButton } from '../Button';

// G0 characterization of the Sidebar root, Section, Footer, Banner and Media on their develop implementation. A rewrite passes
// these unedited, in jest and in the compiled zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/Sidebar',
	component: Sidebar,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Sidebar>;

type Story = StoryObj<typeof Sidebar>;

const attributes = (name: string) => ({
	'className': `consumer-${name}`,
	'id': `${name}-id`,
	'title': `${name} title`,
	'data-qa': `${name}-qa`,
	'data-anything': `${name}-anything`,
	'aria-label': `${name} label`,
});

const handlers = () => ({
	onClick: fn(),
	onKeyDown: fn(),
	onMouseEnter: fn(),
	onMouseLeave: fn(),
	onFocus: fn(),
	onBlur: fn(),
});

const refs = {
	sidebar: createRef<HTMLElement>(),
	content: createRef<HTMLDivElement>(),
};
const sidebarHandlers = handlers();
const sectionHandlers = handlers();
const footerHandlers = handlers();
const contentHandlers = handlers();
const mediaHandlers = handlers();
const mediaTitleHandlers = handlers();

export const PartsForwarding: Story = {
	render: () => (
		<Sidebar {...attributes('sidebar')} ref={refs.sidebar} {...sidebarHandlers}>
			<SidebarSection {...attributes('section')} {...sectionHandlers} />
			<SidebarMedia {...attributes('media')} {...mediaHandlers} />
			<SidebarMediaTitle {...attributes('mediatitle')} {...mediaTitleHandlers} />
			<SidebarFooter {...attributes('footer')} {...footerHandlers}>
				<SidebarFooterContent {...attributes('content')} ref={refs.content} {...contentHandlers}>
					Powered by Rocket.Chat
				</SidebarFooterContent>
			</SidebarFooter>
		</Sidebar>
	),
	play: async ({ canvasElement }) => {
		const parts = [
			['sidebar', 'NAV', refs.sidebar, sidebarHandlers],
			['section', 'DIV', undefined, sectionHandlers],
			['media', 'DIV', undefined, mediaHandlers],
			['mediatitle', 'DIV', undefined, mediaTitleHandlers],
			['footer', 'FOOTER', undefined, footerHandlers],
			['content', 'DIV', refs.content, contentHandlers],
		] as const;
		for (const [name, tag, ref, partHandlers] of parts) {
			const element = canvasElement.querySelector(`#${name}-id`) as HTMLElement;
			await expect(element.tagName).toBe(tag);
			await expectForwards(canvasElement, element, { ...attributes(name), ref, handlers: partHandlers });
		}
		// The section's own element is the inner one: the outer one only holds it with the divider
		const section = canvasElement.querySelector('#section-id') as HTMLElement;
		await expect(section.nextElementSibling).toHaveAttribute('role', 'separator');
	},
};

export const BannerForwarding: Story = {
	render: () => (
		<>
			<SidebarBanner
				data-testid='banner'
				data-qa='banner-qa'
				aria-label='Banner label'
				className='consumer-banner'
				title='Workspace'
				linkText='Learn more'
				linkProps={{ href: 'https://example.com/docs', target: '_blank', rel: 'noopener noreferrer', onClick: fn(), tabIndex: 3 }}
				addon={<span data-testid='addon'>addon</span>}
			>
				<span data-testid='children'>body</span>
			</SidebarBanner>
			<SidebarBanner data-testid='closable' linkText='Act' linkProps={{ onClick: fn(), tabIndex: 0 }} onClose={fn()} />
		</>
	),
	play: async ({ canvasElement }) => {
		const banner = canvasElement.querySelector('[data-testid=banner]') as HTMLElement;
		await expect(banner).toHaveAttribute('data-qa', 'banner-qa');
		await expect(banner).toHaveAttribute('aria-label', 'Banner label');
		await expect(banner).toHaveClass('rcx-sidebar-banner', 'consumer-banner');
		await expect(banner.querySelector('h5')).toHaveTextContent('Workspace');
		await expect(banner).toContainElement(canvasElement.querySelector<HTMLElement>('[data-testid=children]'));
		await expect(banner).toContainElement(canvasElement.querySelector<HTMLElement>('[data-testid=addon]'));

		const link = banner.querySelector('a') as HTMLAnchorElement;
		await expect(link).toHaveTextContent('Learn more');
		await expect(link).toHaveAttribute('href', 'https://example.com/docs');
		await expect(link).toHaveAttribute('target', '_blank');
		await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
		await expect(link).toHaveAttribute('tabindex', '3');

		// Without an href the action is a native button: the app's StatusDisabledBanner takes the click and the tab stop from it
		const closable = canvasElement.querySelector('[data-testid=closable]') as HTMLElement;
		const action = closable.querySelector('.rcx-sidebar-banner__link') as HTMLButtonElement;
		await expect(action.tagName).toBe('BUTTON');
		await expect(action).not.toHaveAttribute('href');
		await expect(action).toHaveAttribute('tabindex', '0');
	},
};

const onClose = fn();
const onLink = fn();

export const BannerHandlers: Story = {
	render: () => (
		<SidebarBanner data-testid='banner' linkText='Act' linkProps={{ onClick: onLink }} onClose={onClose} title='Title' variant='warning' />
	),
	play: async ({ canvasElement }) => {
		await userEvent.click(canvasElement.querySelector('.rcx-sidebar-banner__link') as HTMLElement);
		await expect(onLink).toHaveBeenCalledTimes(1);
		await userEvent.click(canvasElement.querySelector('[aria-label=Close]') as HTMLElement);
		await expect(onClose).toHaveBeenCalledTimes(1);
	},
};

export const MediaController: Story = {
	render: () => (
		<SidebarMedia>
			<SidebarMediaTitle>Now playing</SidebarMediaTitle>
			<SidebarMediaController label='Stream' className='consumer-controller'>
				<IconButton icon='pause' aria-label='Pause' />
				<IconButton icon='stop' aria-label='Stop' />
			</SidebarMediaController>
		</SidebarMedia>
	),
	play: async ({ canvasElement }) => {
		const controller = canvasElement.querySelector('.rcx-sidebar-media__controller') as HTMLElement;
		await expect(controller).toHaveClass('consumer-controller');
		await expect(controller.querySelector('.rcx-sidebar-media__controller__label')).toHaveTextContent('Stream');
		await expect(controller.querySelectorAll('button')).toHaveLength(2);
	},
};

export const ClassContract: Story = {
	render: () => (
		<Sidebar className='rcx-sidebar--main sidebar-region-item'>
			<SidebarSection>
				<span>section</span>
			</SidebarSection>
			<SidebarBanner title='Info' linkText='Link' linkProps={{ href: '#' }} variant='info' />
			<SidebarBanner title='Success' variant='success' />
			<SidebarBanner title='Warning' variant='warning' />
			<SidebarBanner title='Danger' variant='danger' />
			<SidebarBanner title='Default' />
			<SidebarMedia>
				<SidebarMediaTitle>Title</SidebarMediaTitle>
				<SidebarMediaController label='Label'>
					<IconButton icon='pause' aria-label='Pause' />
				</SidebarMediaController>
			</SidebarMedia>
			<SidebarDivider />
			<SidebarFooter>
				<SidebarFooterContent>Footer</SidebarFooterContent>
			</SidebarFooter>
		</Sidebar>
	),
	play: async ({ canvasElement }) => {
		// PaletteStyleTag and the dark-theme selectors reach the roots through these classes
		await expect(shellClasses(canvasElement)).toBe(
			[
				'root > nav: rcx-sidebar rcx-sidebar--main',
				'root > nav > div[0] > div[0]: rcx-sidebar-section',
				'root > nav > div[0] > div[1]: rcx-sidebar--divider',
				'root > nav > div[1]: rcx-sidebar-banner rcx-sidebar-banner--info',
				'root > nav > div[1] > div[0]: rcx-sidebar-banner__content',
				'root > nav > div[1] > div[0] > h5: rcx-sidebar-banner__title',
				'root > nav > div[1] > div[0] > a: rcx-sidebar-banner__link',
				'root > nav > div[1] > div[1]: rcx-sidebar-banner__addon',
				'root > nav > div[2]: rcx-sidebar-banner rcx-sidebar-banner--success',
				'root > nav > div[2] > div[0]: rcx-sidebar-banner__content',
				'root > nav > div[2] > div[0] > h5: rcx-sidebar-banner__title',
				'root > nav > div[2] > div[1]: rcx-sidebar-banner__addon',
				'root > nav > div[3]: rcx-sidebar-banner rcx-sidebar-banner--warning',
				'root > nav > div[3] > div[0]: rcx-sidebar-banner__content',
				'root > nav > div[3] > div[0] > h5: rcx-sidebar-banner__title',
				'root > nav > div[3] > div[1]: rcx-sidebar-banner__addon',
				'root > nav > div[4]: rcx-sidebar-banner rcx-sidebar-banner--danger',
				'root > nav > div[4] > div[0]: rcx-sidebar-banner__content',
				'root > nav > div[4] > div[0] > h5: rcx-sidebar-banner__title',
				'root > nav > div[4] > div[1]: rcx-sidebar-banner__addon',
				'root > nav > div[5]: rcx-sidebar-banner rcx-sidebar-banner--default',
				'root > nav > div[5] > div[0]: rcx-sidebar-banner__content',
				'root > nav > div[5] > div[0] > h5: rcx-sidebar-banner__title',
				'root > nav > div[5] > div[1]: rcx-sidebar-banner__addon',
				'root > nav > div[6]: rcx-sidebar-media',
				'root > nav > div[6] > div[0]: rcx-sidebar-media__title',
				'root > nav > div[6] > div[1]: rcx-sidebar-media__controller',
				'root > nav > div[6] > div[1] > div[0]: rcx-sidebar-media__controller__label',
				'root > nav > div[7]: rcx-sidebar--divider',
				'root > nav > footer: rcx-sidebar-footer',
				'root > nav > footer > div: rcx-sidebar-footer__content',
			].join('\n'),
		);
	},
};

export const AccessibilityTree: Story = {
	render: () => (
		<Sidebar aria-label='Sidebar'>
			<SidebarSection>
				<span>Workspace</span>
				<SidebarButtonGroup>
					<IconButton icon='magnifier' aria-label='Search' />
				</SidebarButtonGroup>
			</SidebarSection>
			<SidebarBanner title='Maintenance' linkText='Read more' linkProps={{ href: '#news' }} variant='warning' />
			<SidebarFooter>
				<SidebarFooterContent>Powered by Rocket.Chat</SidebarFooterContent>
			</SidebarFooter>
		</Sidebar>
	),
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- navigation "Sidebar":',
				'  - text: "Workspace"',
				'  - group:',
				'    - button "Search"',
				'  - separator',
				'  - heading "Maintenance" [level=5]',
				'  - link "Read more"',
				'  - text: "Powered by Rocket.Chat"',
			].join('\n'),
		);
	},
};

export const ComputedLayout: Story = {
	render: () => (
		<div style={{ height: 400 }}>
			<Sidebar id='root'>
				<SidebarSection id='section'>
					<span>section</span>
				</SidebarSection>
				<SidebarBanner data-testid='banner-default' title='Default' />
				<SidebarBanner data-testid='banner-info' title='Info' variant='info' />
				<SidebarBanner data-testid='banner-success' title='Success' variant='success' />
				<SidebarBanner data-testid='banner-warning' title='Warning' variant='warning' />
				<SidebarBanner data-testid='banner-danger' title='Danger' variant='danger' />
				<SidebarMedia id='media'>
					<SidebarMediaTitle>Title</SidebarMediaTitle>
				</SidebarMedia>
				<SidebarFooter id='footer'>
					<SidebarFooterContent>Footer</SidebarFooterContent>
				</SidebarFooter>
			</Sidebar>
		</div>
	),
	play: async ({ canvasElement }) => {
		// jsdom loads no stylesheet
		if (isJsdom()) return;
		const read = (selector: string, property: string) => computed(canvasElement.querySelector(selector) as Element, property);

		await expect(read('#root', 'display')).toBe('flex');
		await expect(read('#root', 'flex-direction')).toBe('column');
		await expect(read('#root', 'position')).toBe('relative');
		await expect(read('#root', 'background-color')).not.toBe('rgba(0, 0, 0, 0)');

		await expect(read('.rcx-sidebar-section', 'height')).toBe('44px');
		await expect(read('.rcx-sidebar-section', 'display')).toBe('flex');
		await expect(read('.rcx-sidebar-section', 'padding-left')).toBe('16px');

		await expect(read('#footer', 'display')).toBe('flex');
		await expect(read('#footer', 'flex-direction')).toBe('column');
		await expect(read('#footer', 'padding-left')).toBe('16px');

		await expect(read('#media', 'padding-top')).toBe('8px');
		await expect(read('#media', 'border-bottom-width')).toBe('1px');

		for (const id of ['default', 'info', 'success', 'warning', 'danger']) {
			await expect(read(`[data-testid=banner-${id}]`, 'display')).toBe('flex');
			await expect(read(`[data-testid=banner-${id}]`, 'padding-top')).toBe('16px');
			await expect(read(`[data-testid=banner-${id}]`, 'border-bottom-width')).toBe('1px');
		}
		const backgrounds = ['default', 'info', 'success', 'warning', 'danger'].map((id) =>
			read(`[data-testid=banner-${id}]`, 'background-color'),
		);
		await expect(new Set(backgrounds).size).toBe(5);
	},
};
