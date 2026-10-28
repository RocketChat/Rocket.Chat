import type { HTMLAttributes } from 'react';

export type SidepanelSectionProps = HTMLAttributes<HTMLDivElement>;

const SidepanelSection = ({ className, ...props }: SidepanelSectionProps) => (
	<div className={['rcx-sidepanel-section', className].filter(Boolean).join(' ')} {...props} />
);

export default SidepanelSection;
