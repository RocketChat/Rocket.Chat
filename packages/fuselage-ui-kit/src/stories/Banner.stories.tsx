/* eslint-disable new-cap */
import { Banner, Icon } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import { action } from '@storybook/addon-actions';
import React from 'react';

import { kitContext, UiKitBanner } from '..';
import * as payloads from './payloads';

export default {
  title: 'Surfaces/Banner',
  argTypes: {
    blocks: { control: 'object' },
    type: {
      control: {
        type: 'radio',
      },
      options: ['neutral', 'info', 'success', 'warning', 'danger'],
      defaultValue: 'neutral',
    },
    errors: { control: 'object' },
  },
};

const createStory = (blocks: readonly UiKit.LayoutBlock[], errors = {}) => {
  const story = ({
    blocks,
    type,
    errors,
  }: {
    blocks: readonly UiKit.LayoutBlock[];
    type: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
    errors: Record<string, string>;
  }) => (
    <kitContext.Provider
      value={{
        action: action('action'),
        state: action('state'),
        values: {},
        appId: 'core',
        errors,
      }}
    >
      <Banner icon={<Icon name='info' size='x20' />} closeable variant={type}>
        {UiKitBanner(blocks)}
      </Banner>
    </kitContext.Provider>
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
