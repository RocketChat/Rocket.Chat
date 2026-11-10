import { render } from '@testing-library/react';

import LoaderPage from './LoaderPage';

const subtitles = [
	'Bringing rocket to launch position',
	'Loading rocket propellant',
	'Performing final go/no go poll with flight crew',
	'All systems nominal, switching to internal computer',
	'Beginning countdown, 5...4...3...2...1',
	'Transitioning to liftoff',
];

it('renders without crashing', () => {
	render(<LoaderPage title='Kapai' subtitles={subtitles} isReady={false} />);
});
