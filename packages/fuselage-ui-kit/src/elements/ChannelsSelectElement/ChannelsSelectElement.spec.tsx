import { MockedServerContext } from '@rocket.chat/mock-providers';
import type { ChannelsSelectElement as ChannelsSelectElementType } from '@rocket.chat/ui-kit';
import { BlockContext } from '@rocket.chat/ui-kit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { contextualBarParser } from '../../surfaces';
import ChannelsSelectElement from './ChannelsSelectElement';
import { useChannelsData } from './hooks/useChannelsData';

const userBlock: ChannelsSelectElementType = {
  type: 'channels_select',
  appId: 'test',
  blockId: 'test',
  actionId: 'test',
};

jest.mock('./hooks/useChannelsData');

const mockedOptions = [
  {
    value: 'channel1_id',
    label: {
      name: 'Channel 1',
      avatarETag: 'test',
      type: 'c',
    },
  },
  {
    value: 'channel2_id',
    label: {
      name: 'Channel 2',
      avatarETag: 'test',
      type: 'c',
    },
  },
  {
    value: 'channel3_id',
    label: {
      name: 'Channel 3',
      avatarETag: 'test',
      type: 'c',
    },
  },
];

const mockUseChannelsData = jest.mocked(useChannelsData);
mockUseChannelsData.mockReturnValue(mockedOptions);

describe('UiKit ChannelsSelect Element', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
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
  });

  it('should render a UiKit channel selector', async () => {
    expect(await screen.findByRole('textbox')).toBeInTheDocument();
  });

  it('should open the channel selector', async () => {
    const input = await screen.findByRole('textbox');
    input.focus();

    expect(await screen.findByRole('listbox')).toBeInTheDocument();
  });

  it('should filter channels', async () => {
    const input = (await screen.findByRole('textbox')) as HTMLInputElement;

    await userEvent.type(input, 'Channel 2', { delay: null });

    mockUseChannelsData.mockReturnValueOnce(
      mockedOptions.filter((option) => option.label.name === input.value)
    );

    await waitFor(async () => {
      const option = (await screen.findAllByRole('option'))[0];
      expect(option).toHaveTextContent('Channel 2');
    });
  });

  it('should select a channel', async () => {
    const input = await screen.findByRole('textbox');

    input.focus();

    const option = (await screen.findAllByRole('option'))[0];
    await userEvent.click(option, { delay: null });

    const selected = await screen.findByRole('button');
    expect(selected).toHaveValue('channel1_id');
  });
});
