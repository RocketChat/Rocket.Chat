import { Table, TableBody, TableCell, TableHead, TableRow } from '@rocket.chat/fuselage';
import type * as MessageParser from '@rocket.chat/message-parser';

import InlineElements from '../elements/InlineElements';

type TableBlockProps = {
	header: MessageParser.TableCell[];
	rows: MessageParser.TableRow[];
};

const alignMap = {
	left: 'start',
	center: 'center',
	right: 'end',
} as const;

const toAlign = (align: MessageParser.TableCell['align']) => (align ? alignMap[align] : undefined);

const TableBlock = ({ header, rows }: TableBlockProps) => (
	<Table striped fixed={false}>
		<TableHead>
			<TableRow>
				{header.map((cell, index) => (
					<TableCell key={index} align={toAlign(cell.align)}>
						<InlineElements>{cell.value}</InlineElements>
					</TableCell>
				))}
			</TableRow>
		</TableHead>
		<TableBody>
			{rows.map((row, rowIndex) => (
				<TableRow key={rowIndex}>
					{row.value.map((cell, cellIndex) => (
						<TableCell key={cellIndex} align={toAlign(cell.align)}>
							<InlineElements>{cell.value}</InlineElements>
						</TableCell>
					))}
				</TableRow>
			))}
		</TableBody>
	</Table>
);

export default TableBlock;
