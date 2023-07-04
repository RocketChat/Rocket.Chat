import type { FC } from 'react';
import React from 'react';

import AutoCompleteTagsMultiple from './AutoCompleteTagsMultiple';

const CurrentChatTags: FC<{ value: Array<string>; handler: () => void; department?: string }> = ({ value, handler, department }) => (
	<AutoCompleteTagsMultiple onChange={handler} value={value} department={department} />
);

export default CurrentChatTags;
