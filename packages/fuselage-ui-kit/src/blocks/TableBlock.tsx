import { Box, Table, TableBody, TableCell, TableHead, TableRow } from '@rocket.chat/fuselage';
import * as UiKit from '@rocket.chat/ui-kit';
import { memo } from 'react';

import type { BlockProps } from '../utils/BlockProps';

export type TableBlockProps = BlockProps<UiKit.TableBlock>;

const alignments = { left: 'start', center: 'center', right: 'end' } as const;

const TableBlock = ({ className, block, surfaceRenderer }: TableBlockProps) => {
	const [header = [], ...rows] = block.rows;

	const renderCells = (cells: readonly UiKit.TableCell[]) =>
		cells.map((cell, index) => {
			const setting = block.column_settings?.[index];

			return (
				<TableCell
					key={index}
					align={setting?.align ? alignments[setting.align] : undefined}
					withTruncatedText={!setting?.is_wrapped}
					fontScale='p2'
				>
					{cell.type === 'raw_text' ? cell.text : surfaceRenderer.renderTextObject(cell, index, UiKit.BlockContext.NONE)}
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
