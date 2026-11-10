import type { HTMLAttributes } from 'react';

export type CardControlsProps = HTMLAttributes<HTMLDivElement>;

const CardControls = ({ ...props }: CardControlsProps) => <div className='rcx-card__controls' {...props} />;

export default CardControls;
