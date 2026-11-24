import { Text, Throbber } from '@rocket.chat/fuselage';

const LoadingMessagesIndicator = () => (
	<Text color='default'>
		<Throbber inheritColor />
	</Text>
);

export default LoadingMessagesIndicator;
