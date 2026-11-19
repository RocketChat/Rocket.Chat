import type { HTMLAttributes } from 'react';

import { Sidebar } from '../Sidebar/Sidebar';

export type SidepanelProps = HTMLAttributes<HTMLDivElement>;

const Sidepanel = (props: SidepanelProps) => <Sidebar variant='sidepanel' {...props} />;

export default Sidepanel;
