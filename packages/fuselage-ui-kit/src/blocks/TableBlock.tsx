import { Box, Table, TableBody, TableCell, TableHead, TableRow } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import { memo } from 'react';

import type { BlockProps } from '../utils/BlockProps';
import { isTextObject } from '../utils/isTextObject';

export type TableBlockProps = BlockProps<UiKit.TableBlock>;

const alignments = { left: 'start', center: 'center', right: 'end' } as const;

const isRawTextCell = (cell: unknown): cell is UiKit.RawTextTableCell =>
	typeof cell === 'object' &&
	cell !== null &&
	'type' in cell &&
	cell.type === 'raw_text' &&
	'text' in cell &&
	typeof cell.text === 'string';

// Payloads reach the renderer unchecked: a cell that is not text renders empty, and a row that is not a list renders no cells.
const toList = <T,>(value: readonly T[] | undefined): readonly T[] => (Array.isArray(value) ? (value as readonly T[]) : []);

const TableBlock = ({ className, block, surfaceRenderer }: TableBlockProps) => {
	const [header = [], ...rows] = toList(block.rows);

	const renderCells = (cells: readonly UiKit.TableCell[]) =>
		toList(cells).map((cell, index) => {
			const setting = block.column_settings?.[index];

			return (
				<TableCell key={index} align={setting?.align ? alignments[setting.align] : undefined}>
					<Box fontScale='p2' withTruncatedText={!setting?.is_wrapped}>
						{isRawTextCell(cell) && cell.text}
						{isTextObject(cell) && surfaceRenderer.renderTextObject(cell, index, UiKit.BlockContext.NONE)}
					</Box>
				</TableCell>
			);
		});

	return (
		<Box className={className} overflowX='auto'>
			<Table>
				<TableHead>
					<TableRow>{renderCells(header)}</TableRow>
				</TableHead>
				<TableBody>
					{rows.map((cells, index) => (
						<TableRow key={index}>{renderCells(cells)}</TableRow>
					))}
				</TableBody>
			</Table>
		</Box>
	);
};

export default memo(TableBlock);
