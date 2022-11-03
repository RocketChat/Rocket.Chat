/* eslint-disable new-cap */
import { Message, Avatar } from '@rocket.chat/fuselage';
import type * as UiKit from '@rocket.chat/ui-kit';
import { action } from '@storybook/addon-actions';
import React from 'react';

import { kitContext, UiKitMessage } from '..';
import * as payloads from './payloads';

export default {
  title: 'Surfaces/Message',
  argTypes: {
    blocks: { control: 'object' },
  },
};

const createStory = (blocks: readonly UiKit.LayoutBlock[]) => {
  const story = ({
    blocks,
    errors,
  }: {
    blocks: readonly UiKit.LayoutBlock[];
    errors: Record<string, string>;
  }) => (
    <Message clickable>
      <Message.LeftContainer>
        <Avatar
          url='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC
              4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMj
              IyMjIyMjIyMjIyMjIyMjL/wAARCAAoACgDASIAAhEBAxEB/8QAGwAAAgIDAQAAAAAAAAAAAAAAAAcEBgIDBQj/xAAuEAACAQQAAwcEAQUAAA
              AAAAABAgMABAUREiExBhMUIkFRYQcWcYGhFTJSgpH/xAAYAQADAQEAAAAAAAAAAAAAAAACAwQBAP/EAB4RAAIBBQEBAQAAAAAAAAAAAAABAg
              MREiExE0HR/9oADAMBAAIRAxEAPwBuXuIkhBuMe5ib/AHQP49q4L3mLitryTLTSpOiHQI5k/HzXa/qbFOEudVTu1dumWvcTaNCZYZ7vU6g6L
              xqjOU/24dfs1Ouh9FnkMpd3Reeyx83hAxZZEhkdV9/MBrX71WGPvJcqrJBGveKATtuXXqNU0pu02bTHXD/AGvJAluyxxRd6F4x00o+NdKoVr
              jbzJdvVe1t5cVLc2ck8qjnohgpPtz2v7G6JtPQ2VJwjlcw+37mchpnK6GtIuv5NFWeTsLNPvxWTvpfjvOEfwKKzEVkSct2vscS/BIzSN0YRk
              eX81UpPqO8masJETu7OOccY4dswYFQeftv096XV5knuJGdm2T1+agvMXj8jEaHX905QihabvcbuS7X566mLWLwSY8PuRnk/u4eZ0deTl71Ef
              6hY+0yM88TzeNZY4luYwpVYyduOfrvhPTnr0pXSX9y5mCsyJMdyxxvwq599em+taItqCSNc90ChvZRUruUcT0JiO18Elpk7t8v41LWzacxkB
              SuvjQ/FFJayjDWrCTepAQ2vUH0oo/Jk3ovpwJJeVCP5CN+lFFaaMqy+nAyuChvrTI2kN9JAsi2ZOy4IBHMnkSCP+iqBexSWdxLazoUljJVlP
              UH2oorkV10pRc7b1zXb/hZOzuJvM86QWEXeELxOzHSIPcmiiiunVlF2RNTpRkrs//Z'
          size={'x36'}
        />
      </Message.LeftContainer>
      <Message.Container>
        <Message.Header>
          <Message.Name>Haylie George</Message.Name>
          <Message.Username>@haylie.george</Message.Username>
          <Message.Role>Admin</Message.Role>
          <Message.Role>User</Message.Role>
          <Message.Role>Owner</Message.Role>
          <Message.Timestamp>12:00 PM</Message.Timestamp>
        </Message.Header>
        <Message.Body>
          <kitContext.Provider
            value={{
              action: action('action'),
              state: action('state'),
              values: {},
              appId: 'core',
              errors,
            }}
          >
            {UiKitMessage(blocks)}
          </kitContext.Provider>
        </Message.Body>
      </Message.Container>
      <Message.Toolbox.Wrapper>
        <Message.Toolbox>
          <Message.Toolbox.Item icon='quote' />
          <Message.Toolbox.Item icon='clock' />
          <Message.Toolbox.Item icon='thread' />
        </Message.Toolbox>
      </Message.Toolbox.Wrapper>
    </Message>
  );
  story.args = {
    blocks,
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

export const Conditional = createStory(payloads.conditional);

export const Preview = createStory(payloads.preview);
export const PreviewWithExternalUrl = createStory(
  payloads.previewWithExternalUrl
);
