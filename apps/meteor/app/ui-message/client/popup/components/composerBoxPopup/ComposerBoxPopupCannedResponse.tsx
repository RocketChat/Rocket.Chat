import React from 'react';
import { Box, OptionColumn } from '@rocket.chat/fuselage';

type ComposerBoxPopupCannedResponseProps = {
	_id: string;
	text: string;
	shortcut: string;
};

const ComposerPopupCannedResponse = ({ shortcut, text }: ComposerBoxPopupCannedResponseProps) => {
	return (
		<>
			<OptionColumn>
				<strong>{shortcut}</strong>
			</OptionColumn>
			<Box withTruncatedText flexGrow={1} width={0}>
				{text}
			</Box>
		</>
	);
};

export default ComposerPopupCannedResponse;
