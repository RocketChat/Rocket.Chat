import { States, StatesIcon, StatesTitle, StatesSubtitle, StatesSuggestion } from '@rocket.chat/fuselage';
import { Link } from '@rocket.chat/layout';
import React from 'react';

const PageEmptyPrivateApps = () => {
	return (
		<>
			<States>
				<StatesIcon name='cube' />
				<StatesTitle>Title</StatesTitle>
				<StatesSubtitle>Subtitle</StatesSubtitle>
				<StatesSuggestion>
					<Link href='#'>Link</Link>
				</StatesSuggestion>
			</States>
		</>
	);
};

export default PageEmptyPrivateApps;
