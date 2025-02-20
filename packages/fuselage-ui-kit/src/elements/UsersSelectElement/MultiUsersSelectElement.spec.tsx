import { MockedServerContext } from '@rocket.chat/mock-providers';
import type { MultiUsersSelectElement as MultiUsersSelectElementType } from '@rocket.chat/ui-kit';
import { BlockContext } from '@rocket.chat/ui-kit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import MultiUsersSelectElement from './MultiUsersSelectElement';
import { contextualBarParser } from '../../surfaces';
import { useUsersData } from './hooks/useUsersData';

const usersBlock: MultiUsersSelectElementType = {
  type: 'multi_users_select',
  appId: 'test',
  blockId: 'test',
  actionId: 'test',
};

jest.mock('./hooks/useUsersData');

const mockedOptions = [
  {
    value: 'user1_id',
    label: 'User 1',
  },
  {
    value: 'user2_id',
    label: 'User 2',
  },
  {
    value: 'user3_id',
    label: 'User 3',
  },
];

const mockUseUsersData = jest.mocked(useUsersData);
mockUseUsersData.mockReturnValue(mockedOptions);

describe('UiKit MultiUsersSelect Element', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    render(
      <MockedServerContext>
        <MultiUsersSelectElement
          index={0}
          block={usersBlock}
          context={BlockContext.FORM}
          surfaceRenderer={contextualBarParser}
        />
      </MockedServerContext>,
    );
  });

  it('should render a UiKit multiple users selector', async () => {
    expect(await screen.findByRole('textbox')).toBeInTheDocument();
  });

  it('should open the users selector', async () => {
    const input = await screen.findByRole('textbox');
    input.focus();

    expect(await screen.findByRole('listbox')).toBeInTheDocument();
  });

  it('should select users', async () => {
    const input = await screen.findByRole('textbox');

    input.focus();

    const option1 = (await screen.findAllByRole('option'))[0];
    await userEvent.click(option1, { delay: null });

    const option2 = (await screen.findAllByRole('option'))[2];
    await userEvent.click(option2, { delay: null });

    const selected = await screen.findAllByRole('button');
    expect(selected[0]).toHaveValue('user1_id');
    expect(selected[1]).toHaveValue('user3_id');
  });

  it('should remove a user', async () => {
    const input = await screen.findByRole('textbox');

    input.focus();

    const option1 = (await screen.findAllByRole('option'))[0];
    await userEvent.click(option1, { delay: null });

    const option2 = (await screen.findAllByRole('option'))[2];
    await userEvent.click(option2, { delay: null });

    const selected1 = (await screen.findAllByRole('button'))[0];
    expect(selected1).toHaveValue('user1_id');
    await userEvent.click(selected1, { delay: null });

    const remainingSelected = (await screen.findAllByRole('button'))[0];
    expect(remainingSelected).toHaveValue('user3_id');
  });
});
