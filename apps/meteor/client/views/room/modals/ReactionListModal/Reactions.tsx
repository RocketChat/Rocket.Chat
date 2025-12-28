import type { IMessage } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import ReactionUserTag from './ReactionUserTag';
import Emoji from '../../../../components/Emoji';

const Reactions = ({ reactions }: { reactions: Required<IMessage>['reactions'] }): ReactElement => {
	const useRealName = useSetting('UI_Use_Real_Name');

	return (
		<Box display='flex' flexDirection='column'>
			{Object.entries(reactions).map(([reaction, { names = [], usernames }]) => (
				<Box key={reaction} display='flex' alignItems='center' flexDirection='row' overflowX='hidden' mb={8}>
					<Emoji emojiHandle={reaction} />
					<Box display='flex' flexWrap='wrap' paddingBlock={4} mis={4}>
						{usernames.map((username, i: number) => (
							<ReactionUserTag key={username} displayName={useRealName ? names[i] || username : username} />
						))}
					</Box>
				</Box>
			))}
		</Box>
	);
};

export default Reactions;
