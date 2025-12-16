import {
	GenericTable,
	GenericTableHeaderCell,
	GenericTableCell,
	GenericTableRow,
	GenericTableHeader,
	GenericTableBody,
	// GenericTableLoadingTable,
} from '@rocket.chat/ui-client';

const headers = (
	<>
		<GenericTableHeaderCell key='contact'>Contact</GenericTableHeaderCell>
		<GenericTableHeaderCell key='direction'>Direction</GenericTableHeaderCell>
	</>
);

const results = Array.from({ length: 100 }).map((_, index) => ({
	contact: `User ${index}`,
	direction: index % 2 ? 'outbound' : 'inbound',
}));
const MediaCallHistoryPage = () => {
	return (
		<GenericTable>
			<GenericTableHeader>{headers}</GenericTableHeader>
			<GenericTableBody>
				{results.map(({ contact, direction }) => (
					<GenericTableRow key={contact}>
						<GenericTableCell>{contact}</GenericTableCell>
						<GenericTableCell>{direction}</GenericTableCell>
					</GenericTableRow>
				))}
			</GenericTableBody>
		</GenericTable>
	);
};

export default MediaCallHistoryPage;
