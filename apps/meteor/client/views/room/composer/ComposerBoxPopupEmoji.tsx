import { OptionColumn, OptionContent } from '@rocket.chat/fuselage';

import Emoji from '../../../components/Emoji';

export type ComposerBoxPopupEmojiProps = {
	_id: string;
};

function ComposerBoxPopupEmoji({ _id }: ComposerBoxPopupEmojiProps) {
	return (
		<>
			<OptionColumn>
				<Emoji emojiHandle={_id} />
			</OptionColumn>
			<OptionContent>{_id}</OptionContent>
		</>
	);
}

export default ComposerBoxPopupEmoji;
