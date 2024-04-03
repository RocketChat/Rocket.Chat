import { MockedServerContext } from '@rocket.chat/mock-providers';
import type {
  UsersSelectElement as UsersSelectElementType,
  MultiUsersSelectElement as MultiUsersSelectElementType,
} from '@rocket.chat/ui-kit';
import { BlockContext } from '@rocket.chat/ui-kit';
import { render, screen } from '@testing-library/react';

import { contextualBarParser } from '../../surfaces';
import MultiUsersSelectElement from './MultiUsersSelectElement';
import UsersSelectElement from './UsersSelectElement';

const userBlock: UsersSelectElementType = {
  type: 'users_select',
  appId: 'test',
  blockId: 'test',
  actionId: 'test',
};

const multiUserBlock: MultiUsersSelectElementType = {
  type: 'multi_users_select',
  appId: 'test',
  blockId: 'test',
  actionId: 'test',
};

describe('UiKit UserSelect Element', () => {
  it('should render a UiKit user selector', async () => {
    render(
      <MockedServerContext>
        <UsersSelectElement
          index={0}
          block={userBlock}
          context={BlockContext.FORM}
          surfaceRenderer={contextualBarParser}
        />
      </MockedServerContext>
    );

    expect(await screen.findByRole('textbox')).toBeInTheDocument();
  });

  it('should render a UiKit multi user selector', async () => {
    render(
      <MockedServerContext>
        <MultiUsersSelectElement
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
