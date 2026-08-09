import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { PlaceChatOnHoldModal } from './PlaceChatOnHoldModal';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { initialState } from './store/reducers';
import { ChatHoldStatus } from './store/types';

const mockStore = configureStore([]);

describe('PlaceChatOnHoldModal', () => {
  const history = createMemoryHistory();
  const store = mockStore(initialState);

  it('renders correctly with hyperlinks', () => {
    const { getByText } = render(
      <Provider store={store}>
        <Router history={history}>
          <PlaceChatOnHoldModal />
        </Router>
      </Provider>
    );

    expect(getByText('https://www.example.com')).toBeInTheDocument();
    expect(getByText('https://www.example.com')).toHaveAttribute('href', 'https://www.example.com');
  });

  it('renders correctly with hyperlinks and underscores', () => {
    const { getByText } = render(
      <Provider store={store}>
        <Router history={history}>
          <PlaceChatOnHoldModal />
        </Router>
      </Provider>
    );

    expect(getByText('https://www_example.com')).toBeInTheDocument();
    expect(getByText('https://www_example.com')).toHaveAttribute('href', 'https://www_example.com');
  });

  it('renders correctly with hyperlinks and multiple underscores', () => {
    const { getByText } = render(
      <Provider store={store}>
        <Router history={history}>
          <PlaceChatOnHoldModal />
        </Router>
      </Provider>
    );

    expect(getByText('https://www_example_com')).toBeInTheDocument();
    expect(getByText('https://www_example_com')).toHaveAttribute('href', 'https://www_example_com');
  });

  it('renders correctly with hyperlinks and special characters', () => {
    const { getByText } = render(
      <Provider store={store}>
        <Router history={history}>
          <PlaceChatOnHoldModal />
        </Router>
      </Provider>
    );

    expect(getByText('https://www.example.com!')).toBeInTheDocument();
    expect(getByText('https://www.example.com!')).toHaveAttribute('href', 'https://www.example.com!');
  });

  it('renders correctly with hyperlinks and spaces', () => {
    const { getByText } = render(
      <Provider store={store}>
        <Router history={history}>
          <PlaceChatOnHoldModal />
        </Router>
      </Provider>
    );

    expect(getByText('https://www.example.com ')).toBeInTheDocument();
    expect(getByText('https://www.example.com ')).toHaveAttribute('href', 'https://www.example.com ');
  });

  it('renders correctly with hyperlinks and trailing punctuation', () => {
    const { getByText } = render(
      <Provider store={store}>
        <Router history={history}>
          <PlaceChatOnHoldModal />
        </Router>
      </Provider>
    );

    expect(getByText('https://www.example.com.')).toBeInTheDocument();
    expect(getByText('https://www.example.com.')).toHaveAttribute('href', 'https://www.example.com.');
  });
});