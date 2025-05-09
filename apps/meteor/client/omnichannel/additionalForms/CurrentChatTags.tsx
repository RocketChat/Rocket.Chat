import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';
import AutoCompleteTagsMultiple from '../tags/AutoCompleteTagsMultiple';

type CurrentChatTagsProps = {
	id?: string;
	value: Array<{ value: string; label: string }>;
	handler: (value: { label: string; value: string }[]) => void;
	department?: string;
	viewAll?: boolean;
};

const CurrentChatTags = ({ id, value, handler, department, viewAll }: CurrentChatTagsProps) => {
	const hasLicense = useHasLicenseModule('livechat-enterprise');

	if (!hasLicense) {
		return null;
	}

	return (
		<AutoCompleteTagsMultiple
			id={id}
			onChange={handler as any} // FIXME: any
			value={value}
			department={department}
			viewAll={viewAll}
		/>
	);
};

export default CurrentChatTags;
