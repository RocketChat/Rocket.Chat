import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React from 'react';

import Textarea from './Textarea';
import Toolbox from './Toolbox';

type TextEditorType = {
	Toolbox?: FC;
	Textarea?: FC;
};

const TextEditor: FC<TextEditorType> = ({ children }) => (
	<Box display='flex' flexDirection='column' pbs='12px' pi='16px' pbe='16px' rcx-box--animated rcx-input-box__wrapper>
		{children}
	</Box>
);

export default Object.assign(TextEditor, {
	Toolbox,
	Textarea,
});
