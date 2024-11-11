import type { VoipSession } from '../definitions';
import { useVoipExtensionDetails } from './useVoipExtensionDetails';

export const useVoipContactId = ({ session, transferEnabled = true }: { session: VoipSession; transferEnabled?: boolean }) => {
	const { data: contact, isPending: isLoading } = useVoipExtensionDetails({ extension: session.contact.id });
	const { data: transferedByContact } = useVoipExtensionDetails({
		extension: session.transferedBy?.id,
		enabled: transferEnabled,
	});

	const getContactName = (data: ReturnType<typeof useVoipExtensionDetails>['data'], defaultValue?: string) => {
		const { name, username = '', callerName, callerNumber, extension } = data || {};
		return name || callerName || username || callerNumber || extension || defaultValue || '';
	};

	const name = getContactName(contact, session.contact.name || session.contact.id);
	const transferedBy = getContactName(transferedByContact, transferEnabled ? session.transferedBy?.id : '');

	return {
		name,
		username: contact?.username,
		transferedBy,
		isLoading,
	};
};
