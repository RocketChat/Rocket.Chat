import type { HTMLAttributes } from 'react';

export type OptionMenuProps = HTMLAttributes<HTMLDivElement>;

const OptionMenu = (props: OptionMenuProps) => <div className='rcx-box--animated rcx-option__menu-wrapper' {...props} />;

export default OptionMenu;
