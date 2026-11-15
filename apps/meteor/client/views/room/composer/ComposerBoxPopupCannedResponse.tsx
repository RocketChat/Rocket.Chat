import { ItemContent, ItemDescription, ItemTitle } from '@rocket.chat/fuselage';

export type ComposerBoxPopupCannedResponseProps = {
	_id: string;
	text: string;
	shortcut: string;
};

function ComposerBoxPopupCannedResponse({ shortcut, text }: ComposerBoxPopupCannedResponseProps) {
	return (
		<ItemContent>
			<ItemTitle>
				{shortcut}
				<ItemDescription inline>{text}</ItemDescription>
			</ItemTitle>
		</ItemContent>
	);
}

export default ComposerBoxPopupCannedResponse;
