import { type MouseEventHandler } from 'preact/compat';
import { useTranslation } from 'react-i18next';

import styles from './styles.scss';
import { createClassName } from '../../helpers/createClassName';

const handleMouseUp: MouseEventHandler<HTMLButtonElement> = ({ target }) => (target as HTMLButtonElement | null)?.blur();

type OptionsTriggerProps = {
	pop: () => void;
};

const OptionsTrigger = ({ pop }: OptionsTriggerProps) => {
	const { t } = useTranslation();

	return (
		<button className={createClassName(styles, 'footer__options')} onClick={pop} onMouseUp={handleMouseUp}>
			{t('options')}
		</button>
	);
};

export default OptionsTrigger;
