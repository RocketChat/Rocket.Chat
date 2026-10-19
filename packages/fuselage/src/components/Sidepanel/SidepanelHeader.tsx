import type { HTMLAttributes } from 'react';

import { Divider } from '../Divider';

export type SidepanelHeaderProps = HTMLAttributes<HTMLDivElement>;

const SidepanelHeader = ({ className, ...props }: SidepanelHeaderProps) => (
	<div className='rcx-sidepanel-header-wrapper'>
		<div className={['rcx-sidepanel-header', className].filter(Boolean).join(' ')} {...props} />
		<Divider rcx-sidepanel--divider marginBlockStart={-2} marginBlockEnd={0} />
	</div>
);

export default SidepanelHeader;
