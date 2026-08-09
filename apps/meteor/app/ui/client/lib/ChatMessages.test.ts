import { render, screen } from '@testing-library/react';
import { ChatMessages } from '../ChatMessages';
import { createClient } from 'meteor/apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloProvider } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing';
import { ChatMessage } from '../ChatMessage';
import { UserProfile } from '../UserProfile';

describe('ChatMessages', () => {
  const client = createClient({
    cache: new InMemoryCache(),
  });

  const mocks = [
    {
      request: {
        query: 'query GetChatMessages($threadId: ID!) { thread(id: $threadId) { messages { id text } } }',
        variables: { threadId: 'threadId' },
      },
      result: {
        data: {
          thread: {
            messages: [
              {
                id: 'message1',
                text: 'Message 1',
              },
              {
                id: 'message2',
                text: 'Message 2',
              },
            ],
          },
        },
      },
    },
  ];

  it('should render profile card in its original position', () => {
    render(
      <ApolloProvider client={client}>
        <MockedProvider mocks={mocks}>
          <ChatMessages threadId="threadId" />
        </MockedProvider>
      </ApolloProvider>
    );

    const profileCard = screen.getByRole('profile-card');
    const messages = screen.getByRole('message-list');

    expect(profileCard).toHaveStyle('top: 0px; left: 0px;');
    expect(messages).toHaveStyle('top: 50px; left: 0px;');
  });

  it('should render profile card in its original position when scrolling', () => {
    render(
      <ApolloProvider client={client}>
        <MockedProvider mocks={mocks}>
          <ChatMessages threadId="threadId" />
        </MockedProvider>
      </ApolloProvider>
    );

    const profileCard = screen.getByRole('profile-card');
    const messages = screen.getByRole('message-list');

    userEvent.scrollIntoView(messages, { behavior: 'smooth' });

    expect(profileCard).toHaveStyle('top: 0px; left: 0px;');
    expect(messages).toHaveStyle('top: 50px; left: 0px;');
  });

  it('should render profile card in its original position when scrolling with different thread lengths', () => {
    const mocks = [
      {
        request: {
          query: 'query GetChatMessages($threadId: ID!) { thread(id: $threadId) { messages { id text } } }',
          variables: { threadId: 'threadId' },
        },
        result: {
          data: {
            thread: {
              messages: [
                {
                  id: 'message1',
                  text: 'Message 1',
                },
                {
                  id: 'message2',
                  text: 'Message 2',
                },
                {
                  id: 'message3',
                  text: 'Message 3',
                },
              ],
            },
          },
        },
      },
    ];

    render(
      <ApolloProvider client={client}>
        <MockedProvider mocks={mocks}>
          <ChatMessages threadId="threadId" />
        </MockedProvider>
      </ApolloProvider>
    );

    const profileCard = screen.getByRole('profile-card');
    const messages = screen.getByRole('message-list');

    userEvent.scrollIntoView(messages, { behavior: 'smooth' });

    expect(profileCard).toHaveStyle('top: 0px; left: 0px;');
    expect(messages).toHaveStyle('top: 100px; left: 0px;');
  });
});