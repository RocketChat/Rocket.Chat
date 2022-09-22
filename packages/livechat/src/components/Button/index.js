import { withTranslation } from 'react-i18next';

import { createClassName, memo } from '../helpers';
import styles from './styles.scss';

const handleMouseUp = ({ target }) => target.blur();

export const Button = memo(({
	submit,
	disabled,
	outline,
	nude,
	danger,
	secondary,
	stack,
	small,
	loading,
	badge,
	icon,
	onClick,
	className,
	style = {},
	children,
	img,
  t,
	label,
}) => (
	<button
		type={submit ? 'submit' : 'button'}
		disabled={disabled}
		onClick={onClick}
		onMouseUp={handleMouseUp}
		aria-label={label || (icon ? children[0] : null)}
		className={createClassName(styles, 'button', {
						disabled,
						outline,
						nude,
						danger,
						secondary,
						stack,
						small,
						loading,
						icon: !!icon,
						img,
					},
					[className],
				)}
				style={Object.assign(
					{},
					style,
					img && {
						backgroundImage: `url(${img})`,
					},
				)}
			>
				{badge ? (
					<span
						role='status'
						aria-label={t('unread_messages_count', { count: badge })}
						className={createClassName(styles, 'button__badge')}
					>
						{badge}
					</span>
				) : null}
				{!img && (icon || children)}
			</button>
		),
	),
);
