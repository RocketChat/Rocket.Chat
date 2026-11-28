import type { Meta, StoryObj } from '@storybook/react';
import { expect } from 'storybook/test';

import {
	Contextualbar,
	ContextualbarAction,
	ContextualbarActions,
	ContextualbarContent,
	ContextualbarEmptyContent,
	ContextualbarFooter,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarSection,
	ContextualbarTitle,
} from '.';
import { classContract } from '../../testing/g0';

// The class contract of Contextualbar with the IconButton frame in it, which holds its glyph in a content part: `button > span > i`.
export default {
	title: 'Characterization/ContextualbarClassContract',
	component: Contextualbar,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Contextualbar>;

type Story = StoryObj<typeof Contextualbar>;

const everyVariation = (
	<>
		<Contextualbar>
			<ContextualbarHeader>
				<ContextualbarIcon name='info' />
				<ContextualbarTitle>Title</ContextualbarTitle>
				<ContextualbarActions>
					<ContextualbarAction name='cross' title='Close' />
				</ContextualbarActions>
			</ContextualbarHeader>
			<ContextualbarSection>Section</ContextualbarSection>
			<ContextualbarContent spaced>Spaced</ContextualbarContent>
			<ContextualbarContent flush>Flush</ContextualbarContent>
			<ContextualbarEmptyContent title='Empty' />
			<ContextualbarFooter>Footer</ContextualbarFooter>
		</Contextualbar>
		<Contextualbar stretch position='absolute' />
		<Contextualbar position='fixed' />
		<Contextualbar position='relative' />
		<Contextualbar position='static' />
	</>
);

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > div[0]: rcx-box rcx-box--full rcx-vertical-bar',
				'root > div[0] > div[0]: rcx-box rcx-box--full rcx-vertical-bar__header',
				'root > div[0] > div[0] > div: rcx-box rcx-box--full rcx-vertical-bar__header-inner',
				'root > div[0] > div[0] > div > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-info',
				'root > div[0] > div[0] > div > h5: rcx-box rcx-box--full rcx-vertical-bar__title',
				'root > div[0] > div[0] > div > div: rcx-button-group rcx-button-group--align-start',
				'root > div[0] > div[0] > div > div > button: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--small-square rcx-button--square',
				'root > div[0] > div[0] > div > div > button > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-cross',
				'root > div[0] > div[1]: rcx-box rcx-box--full rcx-vertical-bar__section',
				'root > div[0] > div[2]: rcx-box rcx-box--full rcx-vertical-bar__content rcx-vertical-bar__content--spaced',
				'root > div[0] > div[3]: rcx-box rcx-box--full rcx-vertical-bar__content rcx-vertical-bar__content--flush',
				'root > div[0] > div[4]: rcx-box rcx-box--full rcx-vertical-bar__content',
				'root > div[0] > div[4] > div: rcx-box rcx-box--full rcx-vertical-bar__empty',
				'root > div[0] > div[4] > div > div: rcx-states',
				'root > div[0] > div[4] > div > div > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-magnifier rcx-states__icon',
				'root > div[0] > div[4] > div > div > h3: rcx-states__title',
				'root > div[0] > div[5]: rcx-box rcx-box--full rcx-vertical-bar__footer',
				'root > div[1]: rcx-box rcx-box--full rcx-vertical-bar rcx-vertical-bar--position-absolute rcx-vertical-bar--stretch',
				'root > div[2]: rcx-box rcx-box--full rcx-vertical-bar rcx-vertical-bar--position-fixed',
				'root > div[3]: rcx-box rcx-box--full rcx-vertical-bar rcx-vertical-bar--position-relative',
				'root > div[4]: rcx-box rcx-box--full rcx-vertical-bar rcx-vertical-bar--position-static',
			].join('\n'),
		);
	},
};
