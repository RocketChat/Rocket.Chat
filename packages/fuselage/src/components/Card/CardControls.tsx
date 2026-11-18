import type { HTMLAttributes } from 'react';

import { cx } from '../../helpers/composeClassNames';

export type CardControlsProps = HTMLAttributes<HTMLDivElement>;

/** Row of the card's actions, such as buttons, tags and badges. */
const CardControls = ({ className, ...props }: CardControlsProps) => <div {...props} className={cx('rcx-card__controls', className)} />;

export default CardControls;
