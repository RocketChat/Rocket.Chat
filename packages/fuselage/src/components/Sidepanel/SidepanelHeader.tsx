import type { HTMLAttributes } from 'react';

import SidepanelDivider from './SidepanelDivider';

export type SidepanelHeaderProps = HTMLAttributes<HTMLDivElement>;

const SidepanelHeader = ({ className, ...props }: SidepanelHeaderProps) => (
	<div className='rcx-sidepanel-header-wrapper'>
		<div className={['rcx-sidepanel-header', className].filter(Boolean).join(' ')} {...props} />
		<SidepanelDivider />
	</div>
);

export default SidepanelHeader;
