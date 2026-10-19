import { render } from '@testing-library/react';

import RedirectPage from './RedirectPage';

const onRedirect = jest.fn();

it('renders without crashing', () => {
	const { container } = render(<RedirectPage title='Ready' countDownSeconds={5} onRedirect={onRedirect} />);

	expect(container.firstChild).not.toBeNull();
});
