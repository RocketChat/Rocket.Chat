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
import { action } from '@storybook/addon-actions';
import type { ReactNode } from 'react';
import React from 'react';

import { kitContext, UiKitModal } from '..';
import * as payloads from './payloads';

type VisibilityType = 'hidden' | 'visible' | 'hiding' | 'unhiding' | undefined;

const DemoModal = ({
  children,
  visible,
}: {
  children?: ReactNode;
  visible: boolean;
}) => (
  <AnimatedVisibility
    visibility={
      visible
        ? (AnimatedVisibility.VISIBLE as VisibilityType)
        : (AnimatedVisibility.HIDDEN as VisibilityType)
    }
  >
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

export default {
  title: 'Surfaces/Modal',
  argTypes: {
    blocks: { control: 'object' },
    errors: { control: 'object' },
    visible: { control: 'boolean', defaultValue: true },
  },
};

const createStory = (blocks: readonly UiKit.LayoutBlock[], errors = {}) => {
  const story = ({
    blocks,
    errors,
    visible,
  }: {
    blocks: readonly UiKit.LayoutBlock[];
    errors: Record<string, string>;
    visible: boolean;
  }) => (
    <DemoModal visible={visible}>
      <kitContext.Provider
        value={{
          action: action('action'),
          state: action('state'),
          values: {},
          appId: 'core',
          errors,
        }}
      >
        {UiKitModal(blocks)}
      </kitContext.Provider>
    </DemoModal>
  );
  story.args = {
    blocks,
    errors,
  };

  return story;
};

export const Divider = createStory(payloads.divider);

export const SectionWithPlainText = createStory(payloads.sectionWithPlainText);

export const SectionWithMrkdwn = createStory(payloads.sectionWithMrkdwn);

export const SectionWithTextFields = createStory(
  payloads.sectionWithTextFields
);

export const SectionWithButtonAccessory = createStory(
  payloads.sectionWithButtonAccessory
);

export const SectionWithImageAccessory = createStory(
  payloads.sectionWithImageAccessory
);

export const SectionWithOverflowMenuAccessory = createStory(
  payloads.sectionWithOverflowMenuAccessory
);

export const SectionWithDatePickerAccessory = createStory(
  payloads.sectionWithDatePickerAccessory
);

export const ImageWithTitle = createStory(payloads.imageWithTitle);

export const ImageWithoutTitle = createStory(payloads.imageWithoutTitle);

export const ActionsWithAllSelects = createStory(
  payloads.actionsWithAllSelects
);

export const ActionsWithFilteredConversationsSelect = createStory(
  payloads.actionsWithFilteredConversationsSelect
);

export const ActionsWithInitializedSelects = createStory(
  payloads.actionsWithInitializedSelects
);

export const ActionsWithButton = createStory(payloads.actionsWithButton);

export const ActionsWithButtonAsLink = createStory(
  payloads.actionsWithButtonAsLink
);

export const ActionsWithDatePicker = createStory(
  payloads.actionsWithDatePicker
);

export const ContextWithPlainText = createStory(payloads.contextWithPlainText);

export const ContextWithMrkdwn = createStory(payloads.contextWithMrkdwn);

export const ContextWithTextAndImages = createStory(
  payloads.contextWithTextAndImages
);

export const InputWithMultilinePlainTextInput = createStory(
  payloads.inputWithMultilinePlainTextInput,
  {
    'input-0': 'Error',
  }
);

export const InputWithPlainTextInput = createStory(
  payloads.inputWithPlainTextInput,
  {
    'input-0': 'Error',
  }
);

export const InputWithMultiUsersSelect = createStory(
  payloads.inputWithMultiUsersSelect,
  {
    'input-0': 'Error',
  }
);

export const InputWithStaticSelect = createStory(
  payloads.inputWithStaticSelect,
  {
    'input-0': 'Error',
  }
);

export const InputWithDatePicker = createStory(payloads.inputWithDatePicker, {
  'input-0': 'Error',
});

export const InputWithLinearScale = createStory(payloads.inputWithLinearScale, {
  'input-0': 'Error',
});

export const Conditional = createStory(payloads.conditional);
