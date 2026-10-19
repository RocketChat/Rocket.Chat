import { render } from '@testing-library/react';

import RegisterServerPage from './RegisterServerPage';

it('renders without crashing', () => {
	const { container } = render(
		<RegisterServerPage currentStep={1} stepCount={1} onSubmit={() => undefined} onClickRegisterOffline={() => undefined} />,
	);

	expect(container.firstChild).not.toBeNull();
});
