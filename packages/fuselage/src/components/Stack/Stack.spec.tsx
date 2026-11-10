import { composeStories } from '@storybook/react-webpack5';

import * as stories from './Stack.stories';
import { render } from '../../testing';

const { Default, Row } = composeStories(stories);

describe('[Stack Component]', () => {
	it('renders without crashing', () => {
		render(<Default />);
	});

	it('lays out a column by default', () => {
		const { container } = render(<Default />);
		expect(getComputedStyle(container.firstElementChild as Element)).toMatchObject({ display: 'flex', flexDirection: 'column' });
	});

	it('maps align and justify to flex values', () => {
		const { container } = render(<Row />);
		expect(getComputedStyle(container.firstElementChild as Element)).toMatchObject({
			flexDirection: 'row',
			alignItems: 'flex-start',
			justifyContent: 'space-between',
		});
	});
});
