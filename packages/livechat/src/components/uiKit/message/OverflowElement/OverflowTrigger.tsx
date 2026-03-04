import type { TargetedEvent } from 'preact/compat';
import { useCallback } from 'preact/compat';

import styles from './styles.scss';
import { createClassName } from '../../../../helpers/createClassName';
import KebabIcon from '../../../../icons/kebab.svg';
import { Button } from '../../../Button';

type OverflowTriggerProps = {
	loading: boolean;
	onClick: () => void;
};

const OverflowTrigger = ({ loading, onClick }: OverflowTriggerProps) => {
	const handleMouseUp = useCallback(({ currentTarget }: TargetedEvent<HTMLElement>) => {
		currentTarget.blur();
	}, []);

	return (
		<Button
			className={createClassName(styles, 'uikit-overflow__trigger')}
			disabled={loading}
			outline
			secondary
			onClick={onClick}
			onMouseUp={handleMouseUp}
		>
			<KebabIcon width={20} height={20} />
		</Button>
	);
};

export default OverflowTrigger;
