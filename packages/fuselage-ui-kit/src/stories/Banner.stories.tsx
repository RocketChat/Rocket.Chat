/* eslint-disable new-cap */
import { Banner, Icon } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { Meta, StoryObj } from '@storybook/react';
import { action } from 'storybook/actions';

import { UiKitContext, UiKitBanner } from '..';
import * as payloads from './payloads';

type StoryArgs = {
	blocks: readonly UiKit.LayoutBlock[];
	type: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
	errors: Record<string, string>;
};

export default {
	argTypes: {
		blocks: { control: 'object' },
		type: {
			control: {
				type: 'radio',
			},
			options: ['neutral', 'info', 'success', 'warning', 'danger'],
		},
		errors: { control: 'object' },
	},
	args: {
		type: 'neutral',
	},
	render: ({ blocks, type, errors }) => (
		<UiKitContext.Provider
			value={{
				action: action('action'),
				updateState: action('updateState'),
				values: {},
				errors,
			}}
		>
			<Banner icon={<Icon name='info' size='x20' />} closeable variant={type}>
				{UiKitBanner(blocks)}
			</Banner>
		</UiKitContext.Provider>
	),
} satisfies Meta<StoryArgs>;

const createStory = (blocks: readonly UiKit.LayoutBlock[], errors: Record<string, string> = {}): StoryObj<StoryArgs> => ({
	args: {
		blocks,
		errors,
	},
});

export const Divider = createStory(payloads.divider);

export const SectionWithPlainText = createStory(payloads.sectionWithPlainText);

export const SectionWithMrkdwn = createStory(payloads.sectionWithMrkdwn);

export const SectionWithTextFields = createStory(payloads.sectionWithTextFields);

export const SectionWithButtonAccessory = createStory(payloads.sectionWithButtonAccessory);

export const SectionWithImageAccessory = createStory(payloads.sectionWithImageAccessory);

export const SectionWithOverflowMenuAccessory = createStory(payloads.sectionWithOverflowMenuAccessory);

export const SectionWithDatePickerAccessory = createStory(payloads.sectionWithDatePickerAccessory);

export const ImageWithTitle = createStory(payloads.imageWithTitle);

export const ImageWithoutTitle = createStory(payloads.imageWithoutTitle);

export const ActionsWithAllSelects = createStory(payloads.actionsWithAllSelects);

export const ActionsWithFilteredConversationsSelect = createStory(payloads.actionsWithFilteredConversationsSelect);

export const ActionsWithInitializedSelects = createStory(payloads.actionsWithInitializedSelects);

export const ActionsWithButton = createStory(payloads.actionsWithButton);

export const ActionsWithButtonAsLink = createStory(payloads.actionsWithButtonAsLink);

export const ActionsWithDatePicker = createStory(payloads.actionsWithDatePicker);

export const ContextWithPlainText = createStory(payloads.contextWithPlainText);

export const ContextWithMrkdwn = createStory(payloads.contextWithMrkdwn);

export const ContextWithTextAndImages = createStory(payloads.contextWithTextAndImages);

export const InputWithMultilinePlainTextInput = createStory(payloads.inputWithMultilinePlainTextInput, {
	'input-0': 'Error',
});

export const InputWithPlainTextInput = createStory(payloads.inputWithPlainTextInput, {
	'input-0': 'Error',
});

export const InputWithMultiUsersSelect = createStory(payloads.inputWithMultiUsersSelect, {
	'input-0': 'Error',
});

export const InputWithStaticSelect = createStory(payloads.inputWithStaticSelect, {
	'input-0': 'Error',
});

export const InputWithDatePicker = createStory(payloads.inputWithDatePicker, {
	'input-0': 'Error',
});

export const InputWithLinearScale = createStory(payloads.inputWithLinearScale, {
	'input-0': 'Error',
});

export const Conditional = createStory(payloads.conditional);
