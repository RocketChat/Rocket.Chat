import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

import EditingComposerHint from './EditingComposerHint';
import ReadOnlyComposerHint from './ReadOnlyComposerHint';

type ComposerHintProps = {
	isEditing: boolean;
	readOnly: boolean;
};

const ComposerHints = ({ isEditing, readOnly }: ComposerHintProps): ReactElement => {
	return (
		<>
			<Box marginBlockEnd='x4'>
				{isEditing && <EditingComposerHint />}
				{readOnly && <ReadOnlyComposerHint />}
			</Box>
		</>
	);
};

export default ComposerHints;
