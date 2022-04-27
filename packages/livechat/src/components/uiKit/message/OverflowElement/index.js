import { memo, useCallback } from 'preact/compat';

import KebabIcon from '../../../../icons/kebab.svg';
import { Button } from '../../../Button';
import Menu, { PopoverMenu } from '../../../Menu';
import { createClassName } from '../../../helpers';
import { usePerformAction } from '../Block';
import styles from './styles.scss';

const OverflowTrigger = ({ loading, onClick }) => {
	const handleMouseUp = useCallback(({ target }) => {
		target.blur();
	}, []);

	return <Button
		className={createClassName(styles, 'uikit-overflow__trigger')}
		disabled={loading}
		outline
		secondary
		onClick={onClick}
		onMouseUp={handleMouseUp}
	>
		<KebabIcon width={20} height={20} />
	</Button>;
};

const OverflowOption = ({ confirm, text, value, url, parser, onClick }) => {
	const handleClick = useCallback(async (event) => {
		event.preventDefault();

		if (confirm) {
			// TODO
		}

		if (url) {
			const newTab = window.open();
			newTab.opener = null;
			newTab.location = url;
			return;
		}

		await onClick(value);
	}, [confirm, onClick, url, value]);

	return <Menu.Item onClick={handleClick}>
		 {parser.text(text)}
	 </Menu.Item>;
};

const OverflowElement = ({ actionId, confirm, options, parser }) => {
	const [performAction, performingAction] = usePerformAction(actionId);

	const handleClick = useCallback(async (value) => {
		await performAction({ value });
	}, [performAction]);

	return <PopoverMenu trigger={({ pop }) => <OverflowTrigger loading={performingAction} onClick={pop} />}>
		<Menu.Group>
			{Array.isArray(options) && options.map((option, i) =>
				<OverflowOption key={i} {...option} confirm={confirm} parser={parser} onClick={handleClick} />)}
		</Menu.Group>
	</PopoverMenu>;
};

export default memo(OverflowElement);
