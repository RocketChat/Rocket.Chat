import { Sidebar, type SidebarProps } from '../Sidebar/Sidebar';

export type SidepanelProps = SidebarProps;

const Sidepanel = ({ className, ...props }: SidepanelProps) => (
	<Sidebar
		className={['rcx-sidepanel', className].filter(Boolean).join(' ')}
		{...props}
	/>
);

export default Sidepanel;