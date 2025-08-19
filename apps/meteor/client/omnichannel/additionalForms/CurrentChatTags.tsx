import type { ComponentProps } from 'react';

import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
import AutoCompleteTagsMultiple from '../tags/AutoCompleteTagsMultiple';

type CurrentChatTagsProps = Pick<ComponentProps<typeof AutoCompleteTagsMultiple>, 'id' | 'aria-labelledby'> & {
	value: Array<{ value: string; label: string }>;
	handler: (value: { label: string; value: string }[]) => void;
	department?: string;
	viewAll?: boolean;
};

const CurrentChatTags = ({ value, handler, department, viewAll, ...props }: CurrentChatTagsProps) => {
	const hasLicense = useHasLicenseModule('livechat-enterprise');

	if (!hasLicense) {
		return null;
	}

	return (
		<AutoCompleteTagsMultiple
			{...props}
			onChange={handler as any} // FIXME: any
			value={value}
			department={department}
			viewAll={viewAll}
		/>
	);
};

export default CurrentChatTags;
