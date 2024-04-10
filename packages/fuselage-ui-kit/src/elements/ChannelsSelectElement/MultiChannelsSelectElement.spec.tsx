import { MockedServerContext } from '@rocket.chat/mock-providers';
import type { MultiChannelsSelectElement as MultiChannelsSelectElementType } from '@rocket.chat/ui-kit';
import { BlockContext } from '@rocket.chat/ui-kit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { contextualBarParser } from '../../surfaces';
import MultiChannelsSelectElement from './MultiChannelsSelectElement';
import { useChannelsData } from './hooks/useChannelsData';

const userBlock: MultiChannelsSelectElementType = {
  type: 'multi_channels_select',
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
        <MultiChannelsSelectElement
          index={0}
          block={userBlock}
          context={BlockContext.FORM}
          surfaceRenderer={contextualBarParser}
        />
      </MockedServerContext>
    );
  });

  it('should render a UiKit multiple channels selector', async () => {
    expect(await screen.findByRole('textbox')).toBeInTheDocument();
  });

  it('should open the channels selector', async () => {
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

  it('should select channels', async () => {
    const input = await screen.findByRole('textbox');

    input.focus();

    const option1 = (await screen.findAllByRole('option'))[0];
    await userEvent.click(option1, { delay: null });

    const option2 = (await screen.findAllByRole('option'))[2];
    await userEvent.click(option2, { delay: null });

    const selected = await screen.findAllByRole('button');
    expect(selected[0]).toHaveValue('channel1_id');
    expect(selected[1]).toHaveValue('channel3_id');
  });

  it('should remove a selected channel', async () => {
    const input = await screen.findByRole('textbox');

    input.focus();

    const option1 = (await screen.findAllByRole('option'))[0];
    await userEvent.click(option1, { delay: null });

    const option2 = (await screen.findAllByRole('option'))[2];
    await userEvent.click(option2, { delay: null });

    const selected1 = (await screen.findAllByRole('button'))[0];
    expect(selected1).toHaveValue('channel1_id');
    await userEvent.click(selected1, { delay: null });

    const remainingSelected = (await screen.findAllByRole('button'))[0];
    expect(remainingSelected).toHaveValue('channel3_id');
  });
});
