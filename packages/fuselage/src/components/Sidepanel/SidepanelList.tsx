import { css } from '@rocket.chat/css-in-js';
import type { HTMLAttributes, RefAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';
import { useStyle } from '../../hooks/useStyle';
import { ItemGroup } from '../Item';

export type SidepanelListProps = HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;

const listPadding = css`
	padding-block: 0.5rem;
`;

function SidepanelList({ className, ...props }: SidepanelListProps) {
	const paddingClassName = useStyle(listPadding, undefined);

	return (
		<ItemGroup
			role='list'
			{...(props as Omit<SidepanelListProps, 'is'>)}
			className={cx('rcx-sidepanel-list', paddingClassName, className)}
		/>
	);
}

export default SidepanelList;
