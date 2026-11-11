import type { Meta, StoryObj } from '@storybook/react';
import type { FormEventHandler } from 'react';
import { createRef } from 'react';
import { expect, fireEvent, fn, userEvent, waitFor } from 'storybook/test';

import {
	Modal,
	ModalBackdrop,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterAnnotation,
	ModalFooterControllers,
	ModalHeader,
	ModalHeaderText,
	ModalHeroImage,
	ModalIcon,
	ModalTagline,
	ModalThumb,
	ModalTitle,
} from '.';
import { ariaSnapshot, atViewport, classContract, computed, expectForwards, isJsdom } from '../../testing/g0';
import { Button } from '../Button';
import { TextInput } from '../TextInput';

// G0 characterization of the Modal family on its develop implementation. A rewrite passes these unedited, in jest and in the
// compiled zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/Modal',
	component: Modal,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Modal>;

type Story = StoryObj<typeof Modal>;

const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const forwarded = (name: string) => ({
	'id': `${name}-id`,
	'title': `${name} title`,
	'data-qa': `${name}-qa`,
	'data-anything': `${name}-anything`,
	'aria-label': `${name} label`,
});

// The consumer's class sits among the generated ones of a part that takes a styling prop, so only its presence is contractual
const expectPart = async (canvas: HTMLElement, selector: string, name: string, extra: Parameters<typeof expectForwards>[2] = {}) => {
	await expectForwards(canvas, selector, { ...forwarded(name), ...extra });
	await expect(canvas.querySelector(selector)).toHaveClass(`${name}-class`);
};

const el = (root: ParentNode, selector: string) => root.querySelector(selector) as HTMLElement;

const onClick = fn();
const onAnimationEnd = fn();
const onKeyDown = fn();
const dialogRef = createRef<HTMLDialogElement>();

export const Forwarding: Story = {
	render: () => (
		<Modal
			ref={dialogRef}
			className='dialog-class'
			{...forwarded('dialog')}
			onClick={onClick}
			onAnimationEnd={onAnimationEnd}
			onKeyDown={onKeyDown}
		>
			<ModalHeader className='header-class' {...forwarded('header')}>
				<ModalHeaderText className='header-text-class' {...forwarded('header-text')}>
					<ModalTagline className='tagline-class' {...forwarded('tagline')}>
						Tagline
					</ModalTagline>
					<ModalTitle className='title-class' {...forwarded('title')}>
						Title
					</ModalTitle>
				</ModalHeaderText>
				<ModalIcon className='icon-class' name='info' {...forwarded('icon')} />
				<ModalClose className='close-class' {...forwarded('close')} />
			</ModalHeader>
			<ModalContent className='content-class' {...forwarded('content')}>
				Content
			</ModalContent>
			<ModalFooter className='footer-class' {...forwarded('footer')}>
				<ModalFooterAnnotation className='annotation-class' {...forwarded('annotation')}>
					Annotation
				</ModalFooterAnnotation>
			</ModalFooter>
		</Modal>
	),
	play: async ({ canvasElement }) => {
		await expectPart(canvasElement, 'dialog', 'dialog', {
			ref: dialogRef,
			handlers: { onClick, onAnimationEnd, onKeyDown },
		});
		await expectPart(canvasElement, 'header', 'header');
		await expectPart(canvasElement, '.rcx-modal__header-text', 'header-text');
		await expectPart(canvasElement, '.rcx-modal__tagline', 'tagline');
		await expectPart(canvasElement, 'h2.rcx-modal__title', 'title');
		await expectPart(canvasElement, '.rcx-modal__icon', 'icon');
		await expectPart(canvasElement, '.rcx-modal__footer', 'footer');
		await expectPart(canvasElement, '.rcx-modal__footer-annotation', 'annotation');
		// The close button is an icon button that takes its own props
		await expectForwards(canvasElement, 'button[aria-label="close label"]', {
			'id': 'close-id',
			'className': 'close-class',
			'data-qa': 'close-qa',
		});
		// The content props reach the part that wraps the children, inside the scrolling one
		await expectPart(canvasElement, '.rcx-modal__content-wrapper', 'content');
		await expect(el(canvasElement, '.rcx-modal__content > .rcx-modal__content-wrapper')).not.toBeNull();
	},
};

export const DialogAttributes: Story = {
	render: () => <Modal>Content</Modal>,
	play: async ({ canvasElement }) => {
		const dialog = el(canvasElement, 'dialog');
		await expect(dialog).toHaveAttribute('open');
		await expect(dialog).toHaveAttribute('aria-modal', 'true');
		await expect(dialog).toHaveClass('rcx-modal');
		await expect(el(dialog, ':scope > .rcx-modal__inner')).toHaveTextContent('Content');
	},
};

export const DialogAriaOverride: Story = {
	render: () => (
		<Modal aria-labelledby='heading' aria-describedby='description' aria-modal='false' role='alertdialog'>
			<ModalTitle id='heading'>Title</ModalTitle>
			<ModalContent id='description'>Body</ModalContent>
		</Modal>
	),
	play: async ({ canvasElement }) => {
		const dialog = el(canvasElement, 'dialog');
		await expect(dialog).toHaveAttribute('aria-labelledby', 'heading');
		await expect(dialog).toHaveAttribute('aria-describedby', 'description');
		await expect(dialog).toHaveAttribute('aria-modal', 'false');
		await expect(dialog).toHaveAttribute('role', 'alertdialog');
	},
};

export const BackdropForwarding: Story = {
	render: () => (
		<>
			<ModalBackdrop className='backdrop-class' {...forwarded('backdrop')} onClick={onClick} onKeyDown={onKeyDown} />
			<ModalBackdrop id='transparent' transparent />
		</>
	),
	play: async ({ canvasElement }) => {
		await expectPart(canvasElement, '.rcx-modal__backdrop', 'backdrop', { handlers: { onClick, onKeyDown } });
		await expect(el(canvasElement, '.rcx-modal__backdrop').tagName).toBe('DIV');
		if (isJsdom()) return;
		await expect(computed(el(canvasElement, '#transparent'), 'background-color')).toBe('rgba(0, 0, 0, 0)');
		await expect(computed(el(canvasElement, '.rcx-modal__backdrop'), 'background-color')).not.toBe('rgba(0, 0, 0, 0)');
	},
};

export const BackdropAndModal: Story = {
	render: () => (
		<ModalBackdrop>
			<Modal>Content</Modal>
		</ModalBackdrop>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const backdrop = el(canvasElement, '.rcx-modal__backdrop');
		await expect(computed(backdrop, 'position')).toBe('fixed');
		await expect(computed(backdrop, 'z-index')).toBe('100');
		await expect(computed(backdrop, 'display')).toBe('flex');
		await expect(computed(backdrop, 'flex-direction')).toBe('column');
		await expect(backdrop.getBoundingClientRect().width).toBe(window.innerWidth);
		await expect(backdrop.getBoundingClientRect().height).toBe(window.innerHeight);
	},
};

export const HeaderParts: Story = {
	render: () => (
		<Modal>
			<ModalHeader>
				<ModalThumb url={PIXEL} />
				<ModalHeaderText>
					<ModalTagline subtle>Tagline</ModalTagline>
					<ModalTitle>Title</ModalTitle>
				</ModalHeaderText>
				<ModalIcon name='info' variant='danger' />
				<ModalClose onClick={onClick} />
			</ModalHeader>
		</Modal>
	),
	play: async ({ canvasElement }) => {
		const header = el(canvasElement, 'header.rcx-modal__header');
		await expect(el(header, ':scope > .rcx-modal__header-inner')).not.toBeNull();
		await expect(el(header, '.rcx-modal__header-inner .rcx-avatar')).not.toBeNull();
		await expect(el(header, '.rcx-modal__header-inner .rcx-modal__header-text .rcx-modal__title')).toHaveTextContent('Title');

		onClick.mockClear();
		const close = el(header, 'button');
		await expect(close).toHaveAttribute('aria-label', 'Close');
		await userEvent.click(close);
		await expect(onClick).toHaveBeenCalledTimes(1);
	},
};

export const CloseLabelOverride: Story = {
	render: () => <ModalClose aria-label='Dismiss' />,
	play: async ({ canvasElement }) => {
		await expect(el(canvasElement, 'button')).toHaveAttribute('aria-label', 'Dismiss');
	},
};

export const IconVariants: Story = {
	render: () => (
		<>
			<ModalIcon id='plain' name='info' />
			<ModalIcon id='danger' name='info' variant='danger' />
			<ModalIcon id='warning' name='info' variant='warning' />
			<ModalIcon id='info' name='info' variant='info' />
			<ModalIcon id='success' name='info' variant='success' />
			<ModalIcon id='end' name='info' align='end' size='x32' />
		</>
	),
	play: async ({ canvasElement }) => {
		await expect(el(canvasElement, '#plain .rcx-icon, #plain.rcx-icon')).not.toBeNull();
		await expect(el(canvasElement, '#end .rcx-icon')).toHaveClass('rcx-icon--name-info');
		if (isJsdom()) return;
		const colour = (id: string) => computed(el(canvasElement, `#${id}`), 'color');
		const colours = ['plain', 'danger', 'warning', 'info', 'success'].map(colour);
		await expect(new Set(colours).size).toBe(5);
		await expect(computed(el(canvasElement, '#end'), 'align-items')).toBe('end');
		await expect(computed(el(canvasElement, '#plain'), 'align-items')).toBe('center');
	},
};

export const TaglineAndTitleStyles: Story = {
	render: () => (
		<>
			<ModalTagline id='plain'>Plain</ModalTagline>
			<ModalTagline id='subtle' subtle>
				Subtle
			</ModalTagline>
			<div id='box' style={{ width: 150 }}>
				<ModalHeaderText>
					<ModalTitle id='long'>A very long title that does not fit its header and must be cut</ModalTitle>
				</ModalHeaderText>
			</div>
		</>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		await expect(computed(el(canvasElement, '#subtle'), 'color')).not.toBe(computed(el(canvasElement, '#plain'), 'color'));
		const title = el(canvasElement, '#long');
		await expect(computed(title, 'text-overflow')).toBe('ellipsis');
		await expect(computed(title, 'white-space')).toBe('nowrap');
		await expect(title.scrollWidth).toBeGreaterThan(title.clientWidth);
	},
};

export const HeroImage: Story = {
	render: () => (
		<>
			<ModalHeroImage className='hero-class' id='hero' alt='Hero' src={PIXEL} data-qa='hero-qa' title='hero title' />
			<ModalHeroImage id='sized' alt='' src={PIXEL} width={300} height={200} />
			<ModalHeroImage id='wide' alt='' src={PIXEL} width='x256' height='x128' />
		</>
	),
	play: async ({ canvasElement }) => {
		const hero = el(canvasElement, '#hero');
		await expectForwards(canvasElement, hero, { 'className': 'hero-class', 'id': 'hero', 'title': 'hero title', 'data-qa': 'hero-qa' });
		await expect(hero.tagName).toBe('IMG');
		await expect(hero).toHaveAttribute('alt', 'Hero');
		await expect(hero.parentElement?.tagName).toBe('FIGURE');
		await expect(hero.parentElement).toHaveClass('rcx-modal__hero-image-wrapper');
		await expect(hero).toHaveClass('rcx-modal__hero-image');
		if (isJsdom()) return;
		await expect(computed(el(canvasElement, '#sized'), 'width')).toBe('300px');
		await expect(computed(el(canvasElement, '#sized'), 'height')).toBe('200px');
		await expect(computed(el(canvasElement, '#wide'), 'width')).toBe('256px');
		await expect(computed(el(canvasElement, '#wide'), 'height')).toBe('128px');
		await expect(computed(hero, 'display')).toBe('block');
	},
};

export const HeroImageBleed: Story = {
	render: () => (
		<div style={{ width: 600 }}>
			<Modal>
				<ModalHeroImage id='hero' alt='' src={PIXEL} />
			</Modal>
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		// The image bleeds to the modal's edges: its wrapper is 24px wider than the modal's padding box on each side
		const figure = el(canvasElement, 'figure');
		await expect(computed(figure, 'margin-left')).toBe('-24px');
		await expect(computed(figure, 'margin-right')).toBe('-24px');
		await expect(computed(figure, 'margin-bottom')).toBe('24px');
	},
};

export const SizesAndLayout: Story = {
	render: () => (
		<div style={{ width: 1000 }}>
			<div id='fluid'>
				<Modal>Fluid</Modal>
			</div>
			<div id='sized'>
				<Modal width='x480' height='x360'>
					Sized
				</Modal>
			</div>
			<div id='limited'>
				<Modal maxHeight={200}>
					<ModalContent>
						<div style={{ height: 600 }}>Tall</div>
					</ModalContent>
				</Modal>
			</div>
			<div id='numeric'>
				<Modal width={500} height={250}>
					Numeric
				</Modal>
			</div>
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const dialog = (id: string) => el(canvasElement, `#${id} dialog`);
		const rect = (id: string) => dialog(id).getBoundingClientRect();

		await expect(computed(dialog('fluid'), 'display')).toBe('flex');
		await expect(computed(dialog('fluid'), 'position')).toBe('static');
		await expect(rect('fluid').width).toBeLessThanOrEqual(1000);
		await expect(rect('sized').width).toBe(480);
		await expect(rect('sized').height).toBe(360);
		await expect(rect('numeric').width).toBe(500);
		await expect(rect('numeric').height).toBe(250);
		await expect(rect('limited').height).toBeLessThanOrEqual(200);

		// The inner frame fills the dialog, and the content scrolls inside it
		const inner = el(dialog('limited'), '.rcx-modal__inner');
		await expect(computed(inner, 'flex-direction')).toBe('column');
		await expect(inner.getBoundingClientRect().height).toBeLessThanOrEqual(200);
		const content = el(dialog('limited'), '.rcx-modal__content');
		await expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
	},
};

export const InnerFrame: Story = {
	render: () => (
		<Modal>
			<ModalContent>Content</ModalContent>
		</Modal>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const inner = el(canvasElement, '.rcx-modal__inner');
		await expect(computed(inner, 'background-color')).not.toBe('rgba(0, 0, 0, 0)');
		await expect(computed(inner, 'border-top-left-radius')).not.toBe('0px');
		// The surface is raised: it has a shadow, and the dialog around it has none of its own paint
		await expect(computed(inner, 'box-shadow')).not.toBe('none');
		await expect(computed(el(canvasElement, 'dialog'), 'background-color')).toBe('rgba(0, 0, 0, 0)');
	},
};

export const Hidden: Story = {
	render: () => (
		<>
			<Modal id='shown'>Shown</Modal>
			<Modal id='hidden' hidden>
				Hidden
			</Modal>
		</>
	),
	play: async ({ canvasElement }) => {
		await expect(el(canvasElement, '#hidden')).toHaveAttribute('hidden');
		await expect(el(canvasElement, '#hidden')).toHaveTextContent('Hidden');
		await expect(el(canvasElement, '#shown')).not.toHaveAttribute('hidden');
		await expect(ariaSnapshot(canvasElement)).toBe('- dialog:\n  - text: "Shown"');
		if (isJsdom()) return;
		await expect(computed(el(canvasElement, '#hidden'), 'display')).toBe('none');
		await expect(computed(el(canvasElement, '#shown'), 'display')).toBe('flex');
	},
};

export const ContentScroll: Story = {
	render: () => (
		<Modal height={200}>
			<ModalHeader>
				<ModalTitle>Title</ModalTitle>
			</ModalHeader>
			<ModalContent>
				<div style={{ height: 800 }}>Tall content</div>
			</ModalContent>
			<ModalFooter>
				<Button>Done</Button>
			</ModalFooter>
		</Modal>
	),
	play: async ({ canvasElement }) => {
		const content = el(canvasElement, '.rcx-modal__content');
		await expect(content).toBeInTheDocument();
		await expect(content.tagName).toBe('DIV');
		if (isJsdom()) return;
		await expect(computed(content, 'overflow-y')).toBe('auto');
		await expect(computed(content, 'position')).toBe('relative');
		await expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
		// Only the content scrolls: the header and the footer stay in view
		content.scrollTop = 100;
		await expect(content.scrollTop).toBe(100);
		await expect(el(canvasElement, 'header').getBoundingClientRect().top).toBeGreaterThanOrEqual(
			el(canvasElement, 'dialog').getBoundingClientRect().top,
		);
		await expect(el(canvasElement, '.rcx-modal__footer').getBoundingClientRect().bottom).toBeLessThanOrEqual(
			el(canvasElement, 'dialog').getBoundingClientRect().bottom,
		);
	},
};

const onScrollContent = fn();

export const ScrollCallback: Story = {
	render: () => (
		<Modal height={200}>
			<ModalContent onScrollContent={onScrollContent}>
				<div style={{ height: 800 }}>Tall content</div>
			</ModalContent>
		</Modal>
	),
	play: async ({ canvasElement }) => {
		onScrollContent.mockClear();
		const content = el(canvasElement, '.rcx-modal__content');
		if (isJsdom()) {
			await fireEvent.scroll(content);
			await expect(onScrollContent).toHaveBeenCalledWith(expect.objectContaining({ top: true }));
			return;
		}
		// Leaving the top reports `top: false`, coming back reports `top: true`
		content.scrollTop = 100;
		await waitFor(() => expect(onScrollContent).toHaveBeenLastCalledWith(expect.objectContaining({ top: false })));
		content.scrollTop = 0;
		await waitFor(() => expect(onScrollContent).toHaveBeenLastCalledWith(expect.objectContaining({ top: true })));
	},
};

export const ContentFill: Story = {
	render: () => (
		<Modal height={300}>
			<ModalContent id='fill' fill>
				Fill
			</ModalContent>
			<ModalContent id='plain'>Plain</ModalContent>
		</Modal>
	),
	play: async ({ canvasElement }) => {
		await expect(el(canvasElement, '#fill')).toHaveClass('rcx-modal__content-wrapper--fill');
		await expect(el(canvasElement, '#plain')).not.toHaveClass('rcx-modal__content-wrapper--fill');
		if (isJsdom()) return;
		await expect(computed(el(canvasElement, '#plain'), 'margin-left')).toBe('24px');
		await expect(computed(el(canvasElement, '#fill'), 'height')).not.toBe(computed(el(canvasElement, '#plain'), 'height'));
	},
};

export const FooterLayout: Story = {
	render: () => (
		<>
			<ModalFooter id='end'>
				<ModalFooterControllers>
					<Button>One</Button>
					<Button>Two</Button>
				</ModalFooterControllers>
			</ModalFooter>
			<ModalFooter id='between' justify='space-between'>
				<ModalFooterAnnotation>Annotation</ModalFooterAnnotation>
				<ModalFooterControllers>
					<Button>One</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</>
	),
	play: async ({ canvasElement }) => {
		await expect(el(canvasElement, '#between')).toHaveClass('rcx-modal__footer--justify-space-between');
		await expect(el(canvasElement, '#end')).toHaveClass('rcx-modal__footer--justify-end');
		await expect(canvasElement.querySelectorAll('#end .rcx-button-group button')).toHaveLength(2);
		if (isJsdom()) return;
		await expect(computed(el(canvasElement, '#end'), 'justify-content')).toBe('end');
		await expect(computed(el(canvasElement, '#between'), 'justify-content')).toBe('space-between');
		await expect(computed(el(canvasElement, '#end'), 'margin-left')).toBe('24px');
	},
};

const onSubmit = fn((event: Parameters<FormEventHandler>[0]) => event.preventDefault());

// The one place a story says how a modal becomes a form.
const asForm = (submit: FormEventHandler, id: string) => ({ onSubmit: submit, formId: id });

export const FormSubmit: Story = {
	render: () => (
		<Modal {...asForm(onSubmit, 'modal-form')}>
			<ModalContent>
				<TextInput aria-label='Name' defaultValue='Ada' />
			</ModalContent>
			<ModalFooter>
				<Button type='submit'>Save</Button>
				<Button type='button'>Cancel</Button>
			</ModalFooter>
		</Modal>
	),
	play: async ({ canvasElement }) => {
		onSubmit.mockClear();
		const form = el(canvasElement, 'dialog > form');
		await expect(form).toHaveAttribute('id', 'modal-form');
		await expect(form).toHaveClass('rcx-modal__inner');

		await userEvent.click(el(canvasElement, 'button[type="submit"]'));
		await expect(onSubmit).toHaveBeenCalledTimes(1);

		await userEvent.type(el(canvasElement, 'input'), '{Enter}');
		await expect(onSubmit).toHaveBeenCalledTimes(2);

		await userEvent.click(el(canvasElement, 'button[type="button"]'));
		await expect(onSubmit).toHaveBeenCalledTimes(2);
	},
};

export const FormInnerFrame: Story = {
	render: () => (
		<Modal {...asForm(onSubmit, 'modal-form')}>
			<ModalContent>Content</ModalContent>
		</Modal>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		// The form is the surface, not a bare wrapper around it
		const form = el(canvasElement, 'form');
		await expect(computed(form, 'display')).toBe('flex');
		await expect(computed(form, 'flex-direction')).toBe('column');
		await expect(computed(form, 'box-shadow')).not.toBe('none');
	},
};

const everyVariation = (
	<>
		<Modal>
			<ModalHeader>
				<ModalThumb url={PIXEL} />
				<ModalHeaderText>
					<ModalTagline subtle>Tagline</ModalTagline>
					<ModalTitle>Title</ModalTitle>
				</ModalHeaderText>
				<ModalIcon name='info' variant='warning' align='end' />
				<ModalClose />
			</ModalHeader>
			<ModalHeroImage alt='Hero' src={PIXEL} />
			<ModalContent>Content</ModalContent>
			<ModalContent fill>Filled</ModalContent>
			<ModalFooter justify='space-between'>
				<ModalFooterAnnotation>Annotation</ModalFooterAnnotation>
				<ModalFooterControllers>
					<Button>Cancel</Button>
					<Button>Save</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
		<ModalBackdrop transparent />
	</>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- dialog:',
				'  - img',
				'  - text: "Tagline"',
				'  - heading "Title" [level=2]',
				'  - button "Close"',
				'  - img "Hero"',
				'  - text: "Content"',
				'  - text: "Filled"',
				'  - text: "Annotation"',
				'  - group:',
				'    - button "Cancel"',
				'    - button "Save"',
			].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > dialog: rcx-box rcx-box--full rcx-modal',
				'root > dialog > div: rcx-box rcx-box--full rcx-modal__inner',
				'root > dialog > div > header: rcx-box rcx-box--full rcx-modal__header',
				'root > dialog > div > header > div: rcx-box rcx-box--full rcx-modal__header-inner',
				'root > dialog > div > header > div > div[0]: rcx-box rcx-box--full',
				'root > dialog > div > header > div > div[0] > figure: rcx-avatar rcx-avatar--x28 rcx-box rcx-box--full',
				'root > dialog > div > header > div > div[0] > figure > img: rcx-avatar__element rcx-avatar__element--x28',
				'root > dialog > div > header > div > div[1]: rcx-box rcx-box--full rcx-modal__header-text',
				'root > dialog > div > header > div > div[1] > div: rcx-box rcx-box--full rcx-modal__tagline',
				'root > dialog > div > header > div > div[1] > h2: rcx-box rcx-box--full rcx-modal__title',
				'root > dialog > div > header > div > div[2]: rcx-box rcx-box--full rcx-modal__icon rcx-modal__icon--align-end rcx-modal__icon--variant-warning',
				'root > dialog > div > header > div > div[2] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-info',
				'root > dialog > div > header > div > button: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--small-square rcx-button--square',
				'root > dialog > div > header > div > button > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-cross',
				'root > dialog > div > figure: rcx-modal__hero-image-wrapper',
				'root > dialog > div > figure > img: rcx-box rcx-box--full rcx-modal__hero-image',
				'root > dialog > div > div[0]: rcx-box rcx-box--full rcx-modal__content',
				'root > dialog > div > div[0] > div: rcx-box rcx-box--full rcx-modal__content-wrapper',
				'root > dialog > div > div[1]: rcx-box rcx-box--full rcx-modal__content',
				'root > dialog > div > div[1] > div: rcx-box rcx-box--full rcx-modal__content-wrapper rcx-modal__content-wrapper--fill',
				'root > dialog > div > div[2]: rcx-box rcx-box--full rcx-modal__footer rcx-modal__footer--justify-space-between',
				'root > dialog > div > div[2] > div[0]: rcx-box rcx-box--full rcx-modal__footer-annotation',
				'root > dialog > div > div[2] > div[1]: rcx-button-group rcx-button-group--align-end',
				'root > dialog > div > div[2] > div[1] > button[0]: rcx-box rcx-box--full rcx-button',
				'root > dialog > div > div[2] > div[1] > button[0] > span: rcx-button--content',
				'root > dialog > div > div[2] > div[1] > button[1]: rcx-box rcx-box--full rcx-button',
				'root > dialog > div > div[2] > div[1] > button[1] > span: rcx-button--content',
				'root > div: rcx-box rcx-box--full rcx-modal__backdrop',
			].join('\n'),
		);
	},
};

export const SurfaceFixture: Story = {
	render: () => (
		<ModalBackdrop>
			<Modal>
				<ModalContent>Content</ModalContent>
			</Modal>
		</ModalBackdrop>
	),
};

// Wide viewports cap the modal at 640px and pad the dialog; a narrow one lets it fill the width
export const ResponsiveWidth: Story = {
	play: async () => {
		if (isJsdom()) return;
		const measure = (width: number) =>
			atViewport(width, 'characterization-modal--surface-fixture', (frame) => {
				const dialog = el(frame, 'dialog');
				return { width: dialog.getBoundingClientRect().width, padding: computed(dialog, 'padding-left') };
			});
		const wide = await measure(1000);
		await expect(wide).toEqual({ width: 640, padding: '16px' });
		const narrow = await measure(500);
		await expect(narrow.width).toBeGreaterThan(400);
		await expect(narrow.width).toBeLessThanOrEqual(500);
	},
};
