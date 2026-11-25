import type * as uikit from '@rocket.chat/ui-kit';

import Block from '../Block';
import { cx } from './helpers';
import type { Parser } from './helpers';

const toList = <T,>(value: readonly T[] | undefined): readonly T[] => (Array.isArray(value) ? value : []);

export const TableBlock = ({ appId, blockId, rows, column_settings: columnSettings, parser }: uikit.TableBlock & { parser: Parser }) => {
	const [header = [], ...body] = toList(rows);

	const renderCell = (cell: uikit.TableCell | null, key: number) => {
		if (!cell || typeof cell !== 'object') {
			return null;
		}
		return cell.type === 'raw_text' ? cell.text : parser.renderTextObject(cell, key);
	};
	const cellStyle = (column: number) => ({ textAlign: columnSettings?.[column]?.align });

	return (
		<Block appId={appId} blockId={blockId}>
			<div className={cx('uikit-table')}>
				<table>
					<thead>
						<tr>
							{toList(header).map((cell, column) => (
								<th key={column} style={cellStyle(column)}>
									{renderCell(cell, column)}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{body.map((row, r) => (
							<tr key={r}>
								{toList(row).map((cell, column) => (
									<td key={column} style={cellStyle(column)}>
										{renderCell(cell, column)}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</Block>
	);
};
