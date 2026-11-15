import { ItemContent, ItemMedia, ItemTitle } from '@rocket.chat/fuselage';

import Emoji from '../../../components/Emoji';

export type ComposerBoxPopupEmojiProps = {
	_id: string;
};

function ComposerBoxPopupEmoji({ _id }: ComposerBoxPopupEmojiProps) {
	return (
		<>
			<ItemMedia aria-hidden>
				<Emoji emojiHandle={_id} />
			</ItemMedia>
			<ItemContent>
				<ItemTitle>{_id}</ItemTitle>
			</ItemContent>
		</>
	);
}

export default ComposerBoxPopupEmoji;
