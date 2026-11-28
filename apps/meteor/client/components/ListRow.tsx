import type { CSSProperties, ReactNode, Ref } from 'react';

export type ListRowProps = {
	'ref'?: Ref<HTMLDivElement>;
	'className'?: string;
	'style'?: CSSProperties;
	'aria-label'?: string;
	'data-id'?: unknown;
	'data-time'?: unknown;
	'children'?: ReactNode;
};

/**
 * One row of a `role='list'` container whose rows are not a Fuselage list item, such as a virtualized list.
 */
const ListRow = (props: ListRowProps) => <div role='listitem' {...props} />;

export default ListRow;
