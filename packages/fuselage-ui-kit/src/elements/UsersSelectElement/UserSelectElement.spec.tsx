import { MockedServerContext } from '@rocket.chat/mock-providers';
import type { UsersSelectElement as UsersSelectElementType } from '@rocket.chat/ui-kit';
import { BlockContext } from '@rocket.chat/ui-kit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import UsersSelectElement from './UsersSelectElement';
import { contextualBarParser } from '../../surfaces';
import { useUsersData } from './hooks/useUsersData';

const userBlock: UsersSelectElementType = {
  type: 'users_select',
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

describe('UiKit UserSelect Element', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    render(
      <MockedServerContext>
        <UsersSelectElement
          index={0}
          block={userBlock}
          context={BlockContext.FORM}
          surfaceRenderer={contextualBarParser}
        />
      </MockedServerContext>,
    );
  });

  it('should render a UiKit user selector', async () => {
    expect(await screen.findByRole('textbox')).toBeInTheDocument();
  });

  it('should open the user selector', async () => {
    const input = await screen.findByRole('textbox');
    input.focus();

    expect(await screen.findByRole('listbox')).toBeInTheDocument();
  });

  it('should select a user', async () => {
    const input = await screen.findByRole('textbox');

    input.focus();

    const option = (await screen.findAllByRole('option'))[0];
    await userEvent.click(option, { delay: null });

    const selected = await screen.findByRole('button');
    expect(selected).toHaveValue('user1_id');
  });
});
