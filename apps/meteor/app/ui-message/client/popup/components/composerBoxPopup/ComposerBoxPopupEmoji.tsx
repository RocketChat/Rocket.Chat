import { OptionColumn, OptionContent } from '@rocket.chat/fuselage';
import React from 'react';

import Emoji from '../../../../../../client/components/Emoji';

export type ComposerBoxPopupEmojiProps = {
	_id: string;
};

const ComposerPopupEmoji = ({ _id }: ComposerBoxPopupEmojiProps) => {
	return (
		<>
			<OptionColumn>
				<Emoji emojiHandle={_id} />
			</OptionColumn>
			<OptionContent>{_id}</OptionContent>
		</>
	);
};

export default ComposerPopupEmoji;
