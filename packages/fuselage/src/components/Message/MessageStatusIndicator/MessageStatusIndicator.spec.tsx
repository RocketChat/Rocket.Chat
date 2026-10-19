import { MessageStatusIndicator, MessageStatusIndicatorItem } from '.';
import { render } from '../../../testing';

it('renders without crashing', () => {
	render(
		<MessageStatusIndicator>
			<MessageStatusIndicatorItem name='star' variant='success' />
		</MessageStatusIndicator>,
	);
});
