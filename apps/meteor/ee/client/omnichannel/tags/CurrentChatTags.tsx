import React, { FC } from 'react';

import AutoCompleteTagsMultiple from './AutoCompleteTagsMultiple';

const CurrentChatTags: FC<{ value: Array<string>; handler: () => void; control: Record<string, unknown> }> = ({
	value,
	handler,
	control,
}) => <AutoCompleteTagsMultiple control={control} name='tags' onChange={handler} value={value} />;

export default CurrentChatTags;
