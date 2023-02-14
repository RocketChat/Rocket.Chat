import React from 'react';
import { OptionColumn, OptionContent } from '@rocket.chat/fuselage';

export type ComposerBoxPopupSlashCommandProps = {
	_id: string;
	description?: string;
	params?: string;
};

const ComposerPopupSlashCommand = ({ _id, description, params }: ComposerBoxPopupSlashCommandProps) => {
	return (
		<>
			<OptionColumn>
				<strong>{_id}</strong> {params}
			</OptionColumn>
			<OptionContent>{description}</OptionContent>
		</>
	);
};

export default ComposerPopupSlashCommand;
