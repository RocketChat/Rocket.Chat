import ProgressBar from './ProgressBar';
import { render } from '../../testing';

describe('[ProgressBar Component]', () => {
	it('renders without crashing', () => {
		render(<ProgressBar percentage={0} />);
	});
});
