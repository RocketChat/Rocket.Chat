import type { Meta, StoryObj } from '@storybook/react';
import { expect } from 'storybook/test';

import IconButton from './IconButton';
import { classContract } from '../../testing/g0';
import { ButtonGroup } from '../ButtonGroup';

// The class contract of IconButton as a frame: the glyph sits in a content part, `button > span > i`, beside the badge.
export default {
	title: 'Characterization/IconButtonClassContract',
	component: IconButton,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof IconButton>;

type Story = StoryObj<typeof IconButton>;

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

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > div: rcx-button-group rcx-button-group--align-start',
				'root > div > button[0]: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--large-square rcx-button--square',
				'root > div > button[0] > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-kebab',
				'root > div > button[1]: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--icon-secondary-info rcx-button--medium-square rcx-button--square',
				'root > div > button[1] > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-kebab',
				'root > div > button[2]: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--icon-secondary rcx-button--small-square rcx-button--square',
				'root > div > button[2] > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-kebab',
				'root > div > button[3]: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--icon-info rcx-button--square rcx-button--tiny-square',
				'root > div > button[3] > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-kebab',
				'root > div > button[4]: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--icon-danger rcx-button--mini-square rcx-button--square',
				'root > div > button[4] > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-kebab',
				'root > div > button[5]: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--icon-secondary-danger rcx-button--large-square rcx-button--square',
				'root > div > button[5] > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-kebab',
				'root > div > button[6]: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--icon-pressed rcx-button--icon-secondary-warning rcx-button--icon-secondary-warning-pressed rcx-button--large-square rcx-button--square',
				'root > div > button[6] > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-kebab',
				'root > div > button[7]: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--large-square rcx-button--square',
				'root > div > button[7] > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-kebab',
				'root > div > button[8]: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--large-square rcx-button--square',
				'root > div > button[8] > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-kebab',
				'root > div > button[9]: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--large-square rcx-button--square rcx-button--with-badge',
				'root > div > button[9] > span[0] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-bell',
				'root > div > button[9] > span[1]: rcx-button__badge rcx-button__badge--top-end',
				'root > div > button[10]: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--large-square rcx-button--square rcx-button--with-badge',
				'root > div > button[10] > span[0] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-bell',
				'root > div > button[10] > span[1]: rcx-button__badge rcx-button__badge--bottom-end',
				'root > div > a: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--large-square rcx-button--square',
				'root > div > a > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-link',
			].join('\n'),
		);
	},
};
