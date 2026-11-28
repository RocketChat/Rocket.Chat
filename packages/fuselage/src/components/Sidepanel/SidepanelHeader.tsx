import type { HTMLAttributes } from 'react';

import { Divider } from '../Divider';

export type SidepanelHeaderProps = HTMLAttributes<HTMLDivElement>;

const SidepanelHeader = ({ className, ...props }: SidepanelHeaderProps) => (
	<div className='rcx-sidepanel-header-wrapper'>
		<div className={['rcx-sidepanel-header', className].filter(Boolean).join(' ')} {...props} />
		<Divider flush variation='light' className='rcx-sidepanel--divider' />
	</div>
);

export default SidepanelHeader;
