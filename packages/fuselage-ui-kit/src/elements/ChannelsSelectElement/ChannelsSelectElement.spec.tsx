import { MockedServerContext } from '@rocket.chat/mock-providers';
import type {
  ChannelsSelectElement as ChannelsSelectElementType,
  MultiChannelsSelectElement as MultiChannelsSelectElementType,
} from '@rocket.chat/ui-kit';
import { BlockContext } from '@rocket.chat/ui-kit';
import { render, screen } from '@testing-library/react';

import { contextualBarParser } from '../../surfaces';
import ChannelsSelectElement from './ChannelsSelectElement';
import MultiChannelsSelectElement from './MultiChannelsSelectElement';

const userBlock: ChannelsSelectElementType = {
  type: 'channels_select',
  appId: 'test',
  blockId: 'test',
  actionId: 'test',
};

const multiUserBlock: MultiChannelsSelectElementType = {
  type: 'multi_channels_select',
  appId: 'test',
  blockId: 'test',
  actionId: 'test',
};

describe('UiKit ChannelsSelect Element', () => {
  it('should render a UiKit channel selector', async () => {
    render(
      <MockedServerContext>
        <ChannelsSelectElement
          index={0}
          block={userBlock}
          context={BlockContext.FORM}
          surfaceRenderer={contextualBarParser}
        />
      </MockedServerContext>
    );

    expect(await screen.findByRole('textbox')).toBeInTheDocument();
  });

  it('should render a UiKit multi channel selector', async () => {
    render(
      <MockedServerContext>
        <MultiChannelsSelectElement
          index={0}
          block={multiUserBlock}
          context={BlockContext.FORM}
          surfaceRenderer={contextualBarParser}
        />
      </MockedServerContext>
    );

    expect(await screen.findByRole('textbox')).toBeInTheDocument();
  });
});
