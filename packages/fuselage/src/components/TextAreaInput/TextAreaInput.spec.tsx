import TextAreaInput from './TextAreaInput';
import { render } from '../../testing';

describe('[TextAreaInput]', () => {
	it('renders without crashing', () => {
		render(<TextAreaInput />);
	});
});
