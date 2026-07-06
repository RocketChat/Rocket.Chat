import type { ComponentProps } from 'react';

import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import AutoCompleteTagsMultiple from '../tags/AutoCompleteTagsMultiple';

type CurrentChatTagsProps = Pick<ComponentProps<typeof AutoCompleteTagsMultiple>, 'id' | 'aria-labelledby'> & {
	value: NonNullable<ComponentProps<typeof AutoCompleteTagsMultiple>['value']>;
	handler: NonNullable<ComponentProps<typeof AutoCompleteTagsMultiple>['onChange']>;
	department?: string;
	viewAll?: boolean;
	error?: string;
};

const CurrentChatTags = ({ value, handler, department, viewAll, error, ...props }: CurrentChatTagsProps) => {
	const { data: hasLicense = false } = useHasLicenseModule('livechat-enterprise');

	if (!hasLicense) {
		return null;
	}

	return <AutoCompleteTagsMultiple {...props} onChange={handler} value={value} department={department} viewAll={viewAll} error={!!error} />;
};

export default CurrentChatTags;
