import type { Meta, StoryObj } from '@storybook/react';
import { expect } from 'storybook/test';

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
import { classContract } from '../../testing/g0';
import { Button } from '../Button';

// The class contract of Modal with the IconButton frame in it, which holds its glyph in a content part: `button > span > i`.
export default {
	title: 'Characterization/ModalClassContract',
	component: Modal,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Modal>;

type Story = StoryObj<typeof Modal>;

const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

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
