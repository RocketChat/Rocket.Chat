import type { FC } from 'react';
import React from 'react';

import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
import AutoCompleteTagsMultiple from '../tags/AutoCompleteTagsMultiple';

type CurrentChatTagsProps = {
	value: Array<{ value: string; label: string }>;
	handler: any;
	department?: string;
	viewAll?: boolean;
	error?: boolean;
};

const CurrentChatTags: FC<CurrentChatTagsProps> = ({ value, handler, department, viewAll, error }) => {
	const hasLicense = useHasLicenseModule('livechat-enterprise');

	if (!hasLicense) {
		return null;
	}

	return <AutoCompleteTagsMultiple value={value} department={department} viewAll={viewAll} error={error} onChange={handler} />;
};

export default CurrentChatTags;
