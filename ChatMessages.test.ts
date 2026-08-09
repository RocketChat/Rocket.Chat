import { render, screen } from '@testing-library/react';
import React from 'react';
import { ChatMessages } from './ChatMessages';

describe('ChatMessages component', () => {
  it('renders messages', () => {
    const messages = [
      { id: 1, text: 'Hello', sender: { id: 1, name: 'John' } },
      { id: 2, text: 'Hi', sender: { id: 2, name: 'Jane' } },
    ];

    render(<ChatMessages messages={messages} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi')).toBeInTheDocument();
  });

  it('renders messages with different sender', () => {
    const messages = [
      { id: 1, text: 'Hello', sender: { id: 1, name: 'John' } },
      { id: 2, text: 'Hi', sender: { id: 2, name: 'Jane' } },
      { id: 3, text: 'Hey', sender: { id: 1, name: 'John' } },
    ];

    render(<ChatMessages messages={messages} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi')).toBeInTheDocument();
    expect(screen.getByText('Hey')).toBeInTheDocument();
  });

  it('renders messages with different sender and scrolls to top left when scrolling thread messages', () => {
    const messages = [
      { id: 1, text: 'Hello', sender: { id: 1, name: 'John' } },
      { id: 2, text: 'Hi', sender: { id: 2, name: 'Jane' } },
      { id: 3, text: 'Hey', sender: { id: 1, name: 'John' } },
      { id: 4, text: 'How are you?', sender: { id: 2, name: 'Jane' } },
      { id: 5, text: 'I am good', sender: { id: 1, name: 'John' } },
    ];

    render(<ChatMessages messages={messages} />);
    const chatMessagesElement = screen.getByTestId('chat-messages');
    const userCardElement = screen.getByTestId('user-card');

    // Scroll to the last message
    chatMessagesElement.scrollIntoView({ behavior: 'smooth' });
    userCardElement.scrollIntoView({ behavior: 'smooth' });

    // Check if the user card is at the top left
    expect(userCardElement).toHaveStyle({
      top: '0px',
      left: '0px',
    });
  });
});