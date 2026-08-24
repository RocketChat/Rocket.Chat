import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router-dom';
import { renderWithRouter } from '../test-utils';
import { mockChat } from '../__mocks__/chat.mock';
import { mockUser } from '../__mocks__/user.mock';
import RocketChat from './RocketChat';

describe('RocketChat component', () => {
  it('should render the chat', () => {
    const history = createMemoryHistory();
    const { getByText } = renderWithRouter(
      <Router history={history}>
        <RocketChat user={mockUser} chat={mockChat} />
      </Router>
    );

    const chatTitle = getByText(mockChat.title);
    expect(chatTitle).toBeInTheDocument();

    const message = getByText(mockChat.messages[0].text);
    expect(message).toBeInTheDocument();

    const link = getByText(mockChat.messages[0].text);
    expect(link).toHaveAttribute('href', mockChat.messages[0].link);

    const linkWithUnderscore = getByText(mockChat.messages[1].text);
    expect(linkWithUnderscore).toHaveAttribute('href', mockChat.messages[1].link);
  });
});