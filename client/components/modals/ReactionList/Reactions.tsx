import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { IUser } from '../../../../definition/IUser';
import { useSetting } from '../../../contexts/SettingsContext';
import Emoji from '../../Emoji';
import ScrollableContentWrapper from '../../ScrollableContentWrapper';
import ReactionUserTag from './ReactionUserTag';

type ReactionsProps = {
	reactions: ReactElement;
	onClick: (e: React.MouseEvent<HTMLElement>) => void;
};

const Reactions = ({ reactions, onClick }: ReactionsProps): ReactElement => {
	const useRealName = useSetting('UI_Use_Real_Name');
	return (
		<Box display='flex' flexDirection='column' minHeight='25vh'>
			<ScrollableContentWrapper>
				{Object.entries(reactions).map(([reaction, { names = [], usernames }]) => (
					<Box key={reaction}>
						<Box display='flex' alignItems='center' flexDirection='row' overflowX='hidden' mb='x8'>
							<Emoji emojiHandle={reaction} />
							<Box display='flex' flexWrap='wrap' paddingBlock='x4' mis='x4'>
								{usernames.map((username: IUser['username'], i: number) => (
									<ReactionUserTag
										key={username}
										displayName={useRealName ? names[i] || username : username}
										username={username}
										onClick={onClick}
									/>
								))}
							</Box>
						</Box>
					</Box>
				))}
			</ScrollableContentWrapper>
		</Box>
	);
};

export default Reactions;
