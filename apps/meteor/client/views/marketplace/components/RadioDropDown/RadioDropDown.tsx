import type { Button } from '@rocket.chat/fuselage';
import { useToggle } from '@rocket.chat/fuselage-hooks';
import type { ComponentProps, ReactElement } from 'react';
import { useCallback, useRef } from 'react';

import type { RadioDropDownProps } from '../../definitions/RadioDropDownDefinitions';
import { isValidReference } from '../../helpers/isValidReference';
import { onMouseEventPreventSideEffects } from '../../helpers/onMouseEventPreventSideEffects';
import DropDownListWrapper from '../DropDownListWrapper';
import RadioButtonList from '../RadioButtonList';
import RadioDropDownAnchor from './RadioDownAnchor';

const RadioDropDown = ({ group, onSelected, ...props }: RadioDropDownProps & ComponentProps<typeof Button>): ReactElement => {
	const reference = useRef<HTMLElement>(null);
	const [collapsed, toggleCollapsed] = useToggle(false);

	const onClose = useCallback(
		(e: MouseEvent) => {
			if (isValidReference(reference, e as { target: Node | null })) {
				toggleCollapsed(false);
				return;
			}

			onMouseEventPreventSideEffects(e);

			return false;
		},
		[toggleCollapsed],
	);

	return (
		<>
			<RadioDropDownAnchor ref={reference} group={group} onClick={toggleCollapsed as any} {...props} />
			{collapsed && (
				<DropDownListWrapper ref={reference} onClose={onClose}>
					<RadioButtonList group={group} onSelected={onSelected} />
				</DropDownListWrapper>
			)}
		</>
	);
};

export default RadioDropDown;
