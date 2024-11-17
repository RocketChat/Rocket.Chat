import React from 'react';

import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
import AutoCompleteTagsMultiple from '../tags/AutoCompleteTagsMultiple';

type CurrentChatTagsProps = { value: Array<{ value: string; label: string }>; handler: any; department?: string; viewAll?: boolean };

const CurrentChatTags = ({ value, handler, department, viewAll }: CurrentChatTagsProps) => {
	const hasLicense = useHasLicenseModule('livechat-enterprise');

	if (!hasLicense) {
		return null;
	}

	return <AutoCompleteTagsMultiple onChange={handler} value={value} department={department} viewAll={viewAll} />;
};

export default CurrentChatTags;
