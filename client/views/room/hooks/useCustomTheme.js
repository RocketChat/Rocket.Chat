import React, { useEffect } from 'react';
import { Button, ButtonGroup, Modal, Box } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { css } from '@rocket.chat/css-in-js';
import tinykeys from 'tinykeys';

import { useSetModal } from '../../../contexts/ModalContext';

const groups = ['n', 'b', 'g', 'r', 'y', 'p', 'o'];

const groupName = {
	n: 'neutral',
	b: 'primary',
	g: 'success',
	r: 'danger',
	y: 'warning',
	p: 'purple',
	o: 'orange',
};

// used to open the menu option by keyboard
export const useCustomTheme = () => {
	const setModal = useSetModal();
	useEffect(() => {
		const unsubscribe = tinykeys(window, {
			'$mod + ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight B A': () => {
				alert();
			},
			'U S E C U S T O M T H E M E'() {
				setModal(<CustomThemeModal/>);
			},
		});
		return () => {
			unsubscribe();
		};
	}, []);
    return css`
    --rcx-color-foreground-default: ${ colors.n400 };
    --rcx-color-foreground-info: ${ colors.n300 };
    --rcx-color-foreground-hint: ${ colors.n400 };
    --rcx-color-disabled: ${ colors.n600 };
    --rcx-color-warning: ${ colors.y300 };
    --rcx-color-surface: ${ colors.n900 };
     ${ groups.map((group) => new Array(9).fill(true).map((el, index) => `--rcx-color-${ groupName[group] || group }-${ index + 1 }00: ${ colors[`${ group }${ 9 - index }00`] };`).join('\n')).join('\n') }
    `;
};


const Color = (props) => <Box mi='x8' mb='x8' diplay='flex' width='60px' height='30px' {...props}></Box>;

const CustomThemeModal = ({ text, confirmText, close, cancel, cancelText, confirm, ...props }) => <Modal {...props}>
	<Modal.Header>
		<Modal.Title>Custom Theme</Modal.Title>
		<Modal.Close onClick={close}/>
	</Modal.Header>
	<Modal.Content fontScale='p1'>
		<Box display='flex' flexDirection='row'>
			{groups.map((group) => <Box display='flex' flexDirection='column'>
				{group}
				{ new Array(9).fill(true).map((el, index) => <Color bg={colors[`${ group }${ index + 1 }00`]}>{`${ group }${ index + 1 }00`}</Color>) }
			</Box>)}
		</Box>
	</Modal.Content>
	<Modal.Footer>
		<ButtonGroup align='end'>
			<Button ghost onClick={cancel || close}>{cancelText || 'Cancel'}</Button>
			<Button primary danger onClick={confirm}>{confirmText}</Button>
		</ButtonGroup>
	</Modal.Footer>
</Modal>;
