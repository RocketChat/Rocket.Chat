import { OptionColumn, OptionContent } from '@rocket.chat/fuselage';

type ComposerBoxPopupCannedResponseProps = {
	_id: string;
	text: string;
	shortcut: string;
};

function ComposerBoxPopupCannedResponse({ shortcut, text }: ComposerBoxPopupCannedResponseProps) {
	return (
		<>
			<OptionColumn>
				<strong>{shortcut}</strong>
			</OptionColumn>
			<OptionContent>{text}</OptionContent>
		</>
	);
}

export default ComposerBoxPopupCannedResponse;
