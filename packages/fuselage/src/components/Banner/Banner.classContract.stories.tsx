import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn } from 'storybook/test';

import Banner from './Banner';
import { classContract } from '../../testing/g0';

// The class contract of Banner with the IconButton frame in it, which holds its glyph in a content part: `button > span > i`.
export default {
	title: 'Characterization/BannerClassContract',
	component: Banner,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Banner>;

type Story = StoryObj<typeof Banner>;

const onAction = fn();
const onClose = fn();

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
