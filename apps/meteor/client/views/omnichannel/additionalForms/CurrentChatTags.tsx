import type { ComponentProps } from 'react';

import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import AutoCompleteTagsMultiple from '../tags/AutoCompleteTagsMultiple';

type CurrentChatTagsProps = Pick<ComponentProps<typeof AutoCompleteTagsMultiple>, 'id' | 'aria-labelledby'> & {
	value: Array<{ value: string; label: string }>;
	handler: (value: { label: string; value: string }[]) => void;
	department?: string;
	viewAll?: boolean;
	error?: string;
};

const CurrentChatTags = ({ value, handler, department, viewAll, error, ...props }: CurrentChatTagsProps) => {
	const { data: hasLicense = false } = useHasLicenseModule('livechat-enterprise');

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
			error={!!error}
		/>
	);
};

export default CurrentChatTags;
