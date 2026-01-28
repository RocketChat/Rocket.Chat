import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import AutoCompleteAgent from '../components/AutoCompleteAgent';

type ContactManagerInputProps = {
	value: string;
	onChange: (currentValue: string) => void;
};

const ContactManagerInput = ({ value: userId, onChange }: ContactManagerInputProps) => {
	const { data: hasLicense = false } = useHasLicenseModule('livechat-enterprise');

	if (!hasLicense) {
		return null;
	}

	const handleChange = (currentValue: string) => {
		if (currentValue === 'no-agent-selected') {
			return onChange('');
		}

		onChange(currentValue);
	};

	return <AutoCompleteAgent haveNoAgentsSelectedOption value={userId} onChange={handleChange} />;
};

export default ContactManagerInput;
