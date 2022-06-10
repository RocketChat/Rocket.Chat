import React, { FC } from 'react';

import AutoCompleteTagsMultiple from './AutoCompleteTagsMultiple';

const CurrentChatTags: FC<{ value: Array<string>; handler: () => void }> = ({ value, handler }) => (
	<AutoCompleteTagsMultiple onChange={handler} value={value} />
);

export default CurrentChatTags;
