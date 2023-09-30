import type { FC } from 'react';
import React from 'react';

import AutoCompleteTagsMultiple from './AutoCompleteTagsMultiple';

type CurrentChatTagsProps = { value: Array<string>; handler: () => void; department?: string; viewAll?: boolean };

const CurrentChatTags: FC<CurrentChatTagsProps> = ({ value, handler, department, viewAll }) => (
	<AutoCompleteTagsMultiple onChange={handler} value={value} department={department} viewAll={viewAll} />
);

export default CurrentChatTags;
