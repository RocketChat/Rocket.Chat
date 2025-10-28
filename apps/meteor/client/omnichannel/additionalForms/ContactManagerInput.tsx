import AutoCompleteAgent from '../../components/AutoCompleteAgent';
import { useHasLicenseModule } from '../../hooks/useHasLicenseModule';

type ContactManagerInputProps = {
	value: string;
	onChange: (currentValue: string) => void;
};

const ContactManagerInput = ({ value: userId, onChange }: ContactManagerInputProps) => {
	const hasLicense = useHasLicenseModule('livechat-enterprise');

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
