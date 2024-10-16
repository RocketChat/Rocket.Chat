import { OptionColumn, OptionContent } from '@rocket.chat/fuselage';
import React from 'react';

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
