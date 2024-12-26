import type { IIntegration, Serialized } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';

import { GenericTableCell, GenericTableRow } from '../../../components/GenericTable';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';

type IntegrationRowProps = {
	integration: Serialized<IIntegration>;
	isMobile: boolean;
	onClick: (_id: string, type: string) => () => void;
};

const IntegrationRow = ({ integration, onClick, isMobile }: IntegrationRowProps) => {
	const formatDateAndTime = useFormatDateAndTime();
	const { _id, name, type, username, _createdAt, _createdBy, channel } = integration;

	return (
		<GenericTableRow key={_id} onKeyDown={onClick(_id, type)} onClick={onClick(_id, type)} tabIndex={0} role='link' action>
			<GenericTableCell>
				<Box withTruncatedText>{name}</Box>
			</GenericTableCell>
			<GenericTableCell>
				<Box withTruncatedText>{channel.join(', ')}</Box>
			</GenericTableCell>
			<GenericTableCell>
				<Box withTruncatedText>{_createdBy?.username}</Box>
			</GenericTableCell>
			{!isMobile && (
				<GenericTableCell>
					<Box withTruncatedText>{formatDateAndTime(_createdAt)}</Box>
				</GenericTableCell>
			)}
			<GenericTableCell>
				<Box withTruncatedText>{username}</Box>
			</GenericTableCell>
		</GenericTableRow>
	);
};

export default IntegrationRow;
