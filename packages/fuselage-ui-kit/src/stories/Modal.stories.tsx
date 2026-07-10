/* eslint-disable new-cap */
import {
	AnimatedVisibility,
	Button,
	ButtonGroup,
	Modal,
	ModalHeader,
	ModalThumb,
	ModalContent,
	ModalTitle,
	ModalFooter,
	ModalClose,
} from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { action } from 'storybook/actions';

import { UiKitContext, UiKitModal } from '..';
import * as payloads from './payloads';

type VisibilityType = 'hidden' | 'visible' | 'hiding' | 'unhiding' | undefined;

const DemoModal = ({ children, visible }: { children?: ReactNode; visible: boolean }) => (
	<AnimatedVisibility visibility={visible ? (AnimatedVisibility.VISIBLE as VisibilityType) : (AnimatedVisibility.HIDDEN as VisibilityType)}>
		<Modal open={visible}>
			<ModalHeader>
				<ModalThumb url='data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==' />
				<ModalTitle>Modal Header</ModalTitle>
				<ModalClose onClick={action('close')} />
			</ModalHeader>
			<ModalContent>{children}</ModalContent>
			<ModalFooter>
				<ButtonGroup align='end'>
					<Button onClick={action('cancel')}>Cancel</Button>
					<Button primary onClick={action('submit')}>
						Submit
					</Button>
				</ButtonGroup>
			</ModalFooter>
		</Modal>
	</AnimatedVisibility>
);

type StoryArgs = {
	blocks: readonly UiKit.LayoutBlock[];
	errors: Record<string, string>;
	visible: boolean;
};

export default {
	argTypes: {
		blocks: { control: 'object' },
		errors: { control: 'object' },
		visible: { control: 'boolean' },
	},
	args: {
		visible: true,
	},
	render: ({ blocks, errors, visible }) => (
		<DemoModal visible={visible}>
			<UiKitContext.Provider
				value={{
					action: action('action'),
					updateState: action('updateState'),
					values: {},
					errors,
				}}
			>
				{UiKitModal(blocks)}
			</UiKitContext.Provider>
		</DemoModal>
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

export const Callout = createStory(payloads.callout);

export const CalloutWithAction = createStory(payloads.calloutWithAction);
