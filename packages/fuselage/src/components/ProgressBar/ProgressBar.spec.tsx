import ProgressBar from './ProgressBar.js';
import { render } from '../../testing.js';

describe('[ProgressBar Component]', () => {
	it('renders without crashing', () => {
		render(<ProgressBar percentage={0} />);
	});
});
