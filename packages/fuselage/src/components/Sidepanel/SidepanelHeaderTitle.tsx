import type { HTMLAttributes } from 'react';

export type SidepanelHeaderTitleProps = HTMLAttributes<HTMLDivElement>;

const SidepanelHeaderTitle = ({ className, ...props }: SidepanelHeaderTitleProps) => (
	<div className={['rcx-sidepanel-header__title', className].filter(Boolean).join(' ')} {...props} />
);

export default SidepanelHeaderTitle;
