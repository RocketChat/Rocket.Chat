import type { HTMLAttributes } from 'react';

export type SidepanelSectionActionProps = HTMLAttributes<HTMLDivElement>;

const SidepanelSectionAction = ({ className, ...props }: SidepanelSectionActionProps) => (
	<div className={['rcx-sidepanel-section__action', className].filter(Boolean).join(' ')} {...props} />
);

export default SidepanelSectionAction;
