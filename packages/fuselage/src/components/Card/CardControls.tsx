import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type CardControlsProps = HTMLAttributes<HTMLDivElement>;

const CardControls = ({ className, ...props }: CardControlsProps) => <div {...props} className={cx('rcx-card__controls', className)} />;

export default CardControls;
