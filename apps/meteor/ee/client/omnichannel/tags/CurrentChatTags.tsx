import type { FC } from 'react';
import React from 'react';

import AutoCompleteTagsMultiple from './AutoCompleteTagsMultiple';

const CurrentChatTags: FC<{ value: Array<string>; handler: () => void }> = ({ value, handler }) => (
	<AutoCompleteTagsMultiple onChange={handler} value={value} />
);

export default CurrentChatTags;
