import { screen } from '@testing-library/react';

import Tabs from './Tabs';
import TabsItem from './TabsItem';
import { render } from '../../testing';

describe('[Tabs Component]', () => {
	it('renders without crashing', () => {
		render(<Tabs />);

		expect(screen.getByRole('tablist')).toBeInTheDocument();
	});

	it('renders a disabled tab as a disabled button', () => {
		render(
			<Tabs>
				<TabsItem disabled>Tab</TabsItem>
			</Tabs>,
		);

		expect(screen.getByRole('tab')).toBeDisabled();
	});
});
