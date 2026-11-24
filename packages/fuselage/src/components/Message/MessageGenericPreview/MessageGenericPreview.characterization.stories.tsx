import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn } from 'storybook/test';

import MessageGenericPreview from './MessageGenericPreview';
import MessageGenericPreviewContent from './MessageGenericPreviewContent';
import MessageGenericPreviewCoverImage from './MessageGenericPreviewCoverImage';
import MessageGenericPreviewDescription from './MessageGenericPreviewDescription';
import MessageGenericPreviewFooter from './MessageGenericPreviewFooter';
import MessageGenericPreviewIcon from './MessageGenericPreviewIcon';
import MessageGenericPreviewImage from './MessageGenericPreviewImage';
import MessageGenericPreviewThumb from './MessageGenericPreviewThumb';
import MessageGenericPreviewTitle from './MessageGenericPreviewTitle';
import { ariaSnapshot, classContract, computed, expectComputed, expectForwards, forcePseudo, isJsdom } from '../../../testing/g0';
import { Icon } from '../../Icon';

// G0 characterization of the generic link preview on its develop implementation. A rewrite passes these unedited, in jest and in
// the compiled zero-runtime Storybook; see src/testing/README.md. The specs set no inline `style` on any part (removed by the
// migration): a consumer that needs a width wraps the preview in a `MessageBlock fixedWidth`.
export default {
	title: 'Characterization/MessageGenericPreview',
	component: MessageGenericPreview,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof MessageGenericPreview>;

type Story = StoryObj<typeof MessageGenericPreview>;

const forwarded = (name: string) => ({
	'className': `${name}-class`,
	'id': `${name}-id`,
	'data-qa': `${name}-qa`,
	'data-anything': `${name}-anything`,
	'aria-label': `${name} label`,
});

const handlers = () => ({ onClick: fn(), onMouseEnter: fn() });
const rootHandlers = handlers();
const titleHandlers = handlers();
const imageHandlers = { onClick: fn(), onLoad: fn() };
const descriptionHandlers = handlers();
const footerHandlers = handlers();
const thumbHandlers = handlers();

const pixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';

export const Forwarding: Story = {
	render: () => (
		<MessageGenericPreview {...forwarded('root')} title='root title' {...rootHandlers}>
			<MessageGenericPreviewContent thumb={<MessageGenericPreviewThumb {...forwarded('thumb')} {...thumbHandlers} />}>
				<MessageGenericPreviewTitle {...forwarded('title')} {...titleHandlers}>
					Title
				</MessageGenericPreviewTitle>
				<MessageGenericPreviewTitle {...forwarded('link')} externalUrl='https://rocket.chat' {...titleHandlers}>
					Link
				</MessageGenericPreviewTitle>
				<MessageGenericPreviewDescription {...forwarded('description')} {...descriptionHandlers}>
					Description
				</MessageGenericPreviewDescription>
				<MessageGenericPreviewFooter {...forwarded('footer')} {...footerHandlers}>
					Footer
				</MessageGenericPreviewFooter>
			</MessageGenericPreviewContent>
			<MessageGenericPreviewImage {...forwarded('image')} url={pixel} {...imageHandlers} />
			<MessageGenericPreviewCoverImage className='cover-class' url={pixel} width={20} height={10} />
		</MessageGenericPreview>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, '.rcx-message-generic-preview', {
			...forwarded('root'),
			title: 'root title',
			handlers: rootHandlers,
		});
		await expectForwards(canvasElement, '.rcx-message-generic-preview__thumb', { ...forwarded('thumb'), handlers: thumbHandlers });
		await expectForwards(canvasElement, '#title-id', { ...forwarded('title'), handlers: titleHandlers });
		await expectForwards(canvasElement, '#link-id', { ...forwarded('link'), handlers: titleHandlers });
		await expectForwards(canvasElement, '.rcx-message-generic-preview__description', {
			...forwarded('description'),
			handlers: descriptionHandlers,
		});
		await expectForwards(canvasElement, '.rcx-message-generic-preview__footer', { ...forwarded('footer'), handlers: footerHandlers });
		await expectForwards(canvasElement, '.rcx-message-generic-preview__image', {
			...forwarded('image'),
			handlers: { onClick: imageHandlers.onClick },
		});
		await expectForwards(canvasElement, '.rcx-message-generic-preview__preview', { className: 'cover-class' });
	},
};

export const TitleLinkOrText: Story = {
	render: () => (
		<>
			<MessageGenericPreviewTitle id='text'>Text</MessageGenericPreviewTitle>
			<MessageGenericPreviewTitle id='link' externalUrl='https://rocket.chat' download='report.pdf'>
				Link
			</MessageGenericPreviewTitle>
			<MessageGenericPreviewTitle id='custom' externalUrl='https://rocket.chat' target='_self' rel='noopener'>
				Custom
			</MessageGenericPreviewTitle>
		</>
	),
	play: async ({ canvasElement }) => {
		const el = (id: string) => canvasElement.querySelector(`#${id}`) as HTMLElement;
		await expect(el('text').tagName).toBe('SPAN');
		await expect(el('text')).not.toHaveAttribute('href');
		await expect(el('text')).toHaveClass('rcx-message-generic-preview__title');
		await expect(el('text')).not.toHaveClass('rcx-message-generic-preview__title-link');

		await expect(el('link').tagName).toBe('A');
		await expect(el('link')).toHaveAttribute('href', 'https://rocket.chat');
		await expect(el('link')).toHaveAttribute('target', '_blank');
		await expect(el('link')).toHaveAttribute('download', 'report.pdf');
		await expect(el('link')).toHaveClass('rcx-message-generic-preview__title', 'rcx-message-generic-preview__title-link');

		// A consumer's target wins over the default one
		await expect(el('custom')).toHaveAttribute('target', '_self');
		await expect(el('custom')).toHaveAttribute('rel', 'noopener');
	},
};

export const ImageDefaults: Story = {
	render: () => (
		<>
			<MessageGenericPreviewImage id='plain' url={pixel} />
			<MessageGenericPreviewImage id='described' url={pixel} alt='A cat' className='preview-image' loading='lazy' />
		</>
	),
	play: async ({ canvasElement }) => {
		const el = (id: string) => canvasElement.querySelector(`#${id}`) as HTMLImageElement;
		await expect(el('plain')).toHaveAttribute('src', pixel);
		await expect(el('plain')).toHaveAttribute('alt', '');
		await expect(el('described')).toHaveAttribute('alt', 'A cat');
		await expect(el('described')).toHaveClass('rcx-message-generic-preview__image', 'preview-image');
		await expect(el('described')).toHaveAttribute('loading', 'lazy');
	},
};

const everyVariation = (
	<MessageGenericPreview>
		<MessageGenericPreviewCoverImage url={pixel} width={20} height={10} />
		<MessageGenericPreviewContent thumb={<MessageGenericPreviewThumb />}>
			<MessageGenericPreviewTitle externalUrl='https://rocket.chat'>Rocket.Chat</MessageGenericPreviewTitle>
			<MessageGenericPreviewDescription clamp>Description</MessageGenericPreviewDescription>
			<MessageGenericPreviewFooter>rocket.chat</MessageGenericPreviewFooter>
		</MessageGenericPreviewContent>
		<MessageGenericPreviewContent>
			<MessageGenericPreviewTitle>Plain title</MessageGenericPreviewTitle>
			<MessageGenericPreviewDescription>Description</MessageGenericPreviewDescription>
		</MessageGenericPreviewContent>
		<MessageGenericPreviewIcon name='attachment-file' type='pdf' />
		<MessageGenericPreviewImage url={pixel} />
	</MessageGenericPreview>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement).replace(/\p{Co}/gu, '')).toBe(
			[
				'- link "Rocket.Chat"',
				'- text: "Description"',
				'- text: "rocket.chat"',
				'- text: "Plain title"',
				'- text: "Description"',
				'- text: "pdf"',
				'- img',
			].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > div: rcx-message-generic-preview',
				'root > div > div[0]: rcx-message-generic-preview__preview',
				'root > div > div[1]: rcx-message-generic-preview__content',
				'root > div > div[1] > div[0]: rcx-message-generic-preview__thumb',
				'root > div > div[1] > div[1]: rcx-message-generic-preview__content-wrapper',
				'root > div > div[1] > div[1] > a: rcx-message-generic-preview__title rcx-message-generic-preview__title-link',
				'root > div > div[1] > div[1] > div[0]: rcx-message-generic-preview__description rcx-message-generic-preview__description--clamp',
				'root > div > div[1] > div[1] > div[1]: rcx-message-generic-preview__footer',
				'root > div > div[2]: rcx-message-generic-preview__content',
				'root > div > div[2] > div: rcx-message-generic-preview__content-wrapper',
				'root > div > div[2] > div > span: rcx-message-generic-preview__title',
				'root > div > div[2] > div > div: rcx-message-generic-preview__description',
				'root > div > div[3]: rcx-message-generic-preview__icon',
				'root > div > div[3] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-attachment-file',
				'root > div > div[3] > div: rcx-message-generic-preview__icon-title',
				'root > div > img: rcx-message-generic-preview__image',
			].join('\n'),
		);
	},
};

const el = (root: HTMLElement, id: string) => root.querySelector(`#${id}`) as HTMLElement;
const longText = 'A preview description that is far too long to fit on a single line of this width, so it must wrap or be cut. '.repeat(3);

export const Frame: Story = {
	render: () => (
		<div style={{ width: 368 }}>
			<MessageGenericPreview id='root'>
				<MessageGenericPreviewContent thumb={<MessageGenericPreviewThumb id='thumb' />}>
					<MessageGenericPreviewTitle id='title'>{longText}</MessageGenericPreviewTitle>
					<MessageGenericPreviewDescription id='description'>{longText}</MessageGenericPreviewDescription>
					<MessageGenericPreviewFooter id='footer'>{longText}</MessageGenericPreviewFooter>
				</MessageGenericPreviewContent>
			</MessageGenericPreview>
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const rect = (id: string) => el(canvasElement, id).getBoundingClientRect();
		const root = el(canvasElement, 'root');
		await expect(computed(root, 'display')).toBe('flex');
		await expect(computed(root, 'flex-direction')).toBe('column');
		await expect(computed(root, 'overflow-x')).toBe('hidden');
		await expect(computed(root, 'border-top-width')).toBe('1px');
		await expect(computed(root, 'border-top-style')).toBe('solid');
		await expect(computed(root, 'border-top-left-radius')).toBe('4px');

		const content = canvasElement.querySelector('.rcx-message-generic-preview__content') as HTMLElement;
		await expect(computed(content, 'display')).toBe('flex');
		const wrapper = canvasElement.querySelector('.rcx-message-generic-preview__content-wrapper') as HTMLElement;
		await expect(computed(wrapper, 'flex-direction')).toBe('column');
		await expect(computed(wrapper, 'justify-content')).toBe('center');
		await expect(computed(wrapper, 'flex-grow')).toBe('1');
		await expect(computed(wrapper, 'padding-top')).toBe('8px');
		await expect(computed(wrapper, 'padding-left')).toBe('16px');

		// The thumbnail is a 96px square that never shrinks, and the text truncates beside it
		await expect(rect('thumb').width).toBe(96);
		await expect(rect('thumb').height).toBe(96);
		await expect(computed(el(canvasElement, 'thumb'), 'flex-shrink')).toBe('0');
		for (const id of ['title', 'description', 'footer']) {
			await expect([id, computed(el(canvasElement, id), 'white-space')]).toEqual([id, 'nowrap']);
			await expect([id, computed(el(canvasElement, id), 'text-overflow')]).toEqual([id, 'ellipsis']);
			await expect(rect(id).right).toBeLessThanOrEqual(rect('root').right);
		}
		await expect(computed(el(canvasElement, 'title'), 'display')).toBe('block');
		await expect(computed(el(canvasElement, 'title'), 'margin-bottom')).toBe('4px');
		await expect(computed(el(canvasElement, 'description'), 'margin-bottom')).toBe('4px');
	},
};

// Two lines tall, however much text there is; `display` is how the cut is done and stays out of the contract
export const DescriptionClamp: Story = {
	render: () => (
		<div style={{ width: 300 }}>
			<MessageGenericPreview>
				<MessageGenericPreviewContent>
					<MessageGenericPreviewDescription id='clamped' clamp>
						{longText}
					</MessageGenericPreviewDescription>
					<MessageGenericPreviewDescription id='single'>{longText}</MessageGenericPreviewDescription>
				</MessageGenericPreviewContent>
			</MessageGenericPreview>
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const clamped = el(canvasElement, 'clamped');
		const lineHeight = parseFloat(computed(clamped, 'line-height'));
		await expect(clamped.getBoundingClientRect().height).toBeCloseTo(lineHeight * 2, 0);
		await expect(el(canvasElement, 'single').getBoundingClientRect().height).toBeCloseTo(lineHeight, 0);
		await expect(clamped.scrollHeight).toBeGreaterThanOrEqual(clamped.clientHeight);
	},
};

export const CoverImage: Story = {
	render: () => (
		<div style={{ width: 300 }}>
			<MessageGenericPreview>
				<MessageGenericPreviewCoverImage url={pixel} width={200} height={100} />
				<MessageGenericPreviewCoverImage className='second' url={pixel} width={100} height={100} />
			</MessageGenericPreview>
		</div>
	),
	play: async ({ canvasElement }) => {
		const [wide, square] = [...canvasElement.querySelectorAll<HTMLElement>('.rcx-message-generic-preview__preview')];
		await expect(wide.querySelector('div')).not.toBeNull();
		if (isJsdom()) return;
		await expect(computed(wide, 'background-image')).toMatch(/data:image\/gif/);
		await expect(computed(wide, 'background-size')).toBe('cover');
		await expect(computed(wide, 'background-repeat')).toBe('no-repeat');
		await expect(computed(wide, 'max-width')).toBe('100%');
		// The ratio box keeps the image's aspect ratio at the width it is given
		await expect(wide.getBoundingClientRect().height).toBeCloseTo(wide.getBoundingClientRect().width / 2, 0);
		await expect(square.getBoundingClientRect().height).toBeCloseTo(square.getBoundingClientRect().width, 0);
	},
};

export const IconBadge: Story = {
	render: () => (
		<div style={{ width: 368 }}>
			<MessageGenericPreview>
				<MessageGenericPreviewContent thumb={<MessageGenericPreviewIcon type='a-very-long-file-type' name='attachment-file' />}>
					Text
				</MessageGenericPreviewContent>
			</MessageGenericPreview>
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const badge = canvasElement.querySelector('.rcx-message-generic-preview__icon') as HTMLElement;
		const title = canvasElement.querySelector('.rcx-message-generic-preview__icon-title') as HTMLElement;
		await expect(badge.getBoundingClientRect().width).toBe(48);
		await expect(badge.getBoundingClientRect().height).toBe(52);
		await expect(computed(badge, 'flex-shrink')).toBe('0');
		await expect(computed(badge, 'align-items')).toBe('center');
		await expect(computed(badge, 'margin-top')).toBe('12px');
		await expect(computed(badge, 'margin-inline-start')).toBe('16px');
		await expect(computed(badge, 'border-top-left-radius')).toBe('4px');
		await expect(title.getBoundingClientRect().width).toBeLessThanOrEqual(40);
		await expect(computed(title, 'text-overflow')).toBe('ellipsis');
	},
};

export const ImageIsClickable: Story = {
	render: () => <MessageGenericPreviewImage id='image' url={pixel} />,
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		await expect(computed(el(canvasElement, 'image'), 'cursor')).toBe('pointer');
	},
};

export const TitleLinkColors: Story = {
	render: () => (
		<>
			<Icon id='info' name='star' color='info' />
			<MessageGenericPreviewTitle id='link' externalUrl='#anchor'>
				Link
			</MessageGenericPreviewTitle>
			<MessageGenericPreviewTitle id='text'>Text</MessageGenericPreviewTitle>
			<MessageGenericPreviewFooter>
				<a id='footer-link' href='#anchor'>
					footer link
				</a>
			</MessageGenericPreviewFooter>
		</>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const link = el(canvasElement, 'link');
		const info = computed(el(canvasElement, 'info'), 'color');
		// The link takes the link color; the plain title and the footer's links read differently
		await expect(computed(link, 'color')).toBe(info);
		await expect(computed(el(canvasElement, 'text'), 'color')).not.toBe(info);
		await expect(computed(el(canvasElement, 'footer-link'), 'color')).not.toBe(info);

		// Hover, press and keyboard focus keep the link color
		forcePseudo(link, 'hover');
		await expectComputed(link, 'color', info);
		forcePseudo(link, 'active');
		await expectComputed(link, 'color', info);
		forcePseudo(link, 'focus');
		await expectComputed(link, 'color', info);
	},
};
