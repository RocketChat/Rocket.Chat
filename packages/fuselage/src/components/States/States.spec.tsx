import States from './States';
import StatesLink from './StatesLink';
import { render, screen } from '../../testing';

describe('[States Component]', () => {
	it('renders without crashing', () => {
		render(<States />);
	});
});

describe('[StatesLink children]', () => {
	it('renders text children', () => {
		render(<StatesLink href='#'>Learn more</StatesLink>);
		expect(screen.getByText('Learn more')).toBeInTheDocument();
	});
});
