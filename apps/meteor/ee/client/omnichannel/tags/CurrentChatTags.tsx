import type { FC } from 'react';
import React from 'react';

import AutoCompleteTagsMultiple from './AutoCompleteTagsMultiple';

type CurrentChatTagsProps = { value: Array<{ value: string; label: string }>; handler: () => void; department?: string; viewAll?: boolean };

const CurrentChatTags: FC<CurrentChatTagsProps> = ({ value, handler, department, viewAll }) => (
	<AutoCompleteTagsMultiple onChange={handler} value={value} department={department} viewAll={viewAll} />
);

export default CurrentChatTags;
