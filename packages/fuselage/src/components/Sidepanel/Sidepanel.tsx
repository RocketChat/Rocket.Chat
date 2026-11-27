import type { HTMLAttributes } from 'react';

import { Sidebar } from '../Sidebar/Sidebar';

export type SidepanelProps = HTMLAttributes<HTMLDivElement>;

const Sidepanel = (props: SidepanelProps) => <Sidebar {...props} variant='sidepanel' />;

export default Sidepanel;
