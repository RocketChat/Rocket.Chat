import type { HTMLAttributes } from 'react';

export type OptionContentProps = HTMLAttributes<HTMLDivElement>;

const OptionContent = (props: OptionContentProps) => <div className='rcx-option__content' {...props} />;

export default OptionContent;
