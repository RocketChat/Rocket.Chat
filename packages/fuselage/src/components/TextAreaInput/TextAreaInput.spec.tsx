import TextAreaInput from './TextAreaInput.js';
import { render } from '../../testing.js';

describe('[TextAreaInput]', () => {
	it('renders without crashing', () => {
		render(<TextAreaInput />);
	});
});
