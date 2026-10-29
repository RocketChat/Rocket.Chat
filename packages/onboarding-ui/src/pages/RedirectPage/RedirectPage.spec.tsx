import { render } from '@testing-library/react';

import RedirectPage from './RedirectPage';

const onRedirect = jest.fn();

it('renders without crashing', () => {
	render(<RedirectPage title='Ready' countDownSeconds={5} onRedirect={onRedirect} />);
});
