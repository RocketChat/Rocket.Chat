import {
	Button,
	Modal,
	ModalBackdrop,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
	ModalHeader,
	ModalTitle,
} from '@rocket.chat/fuselage';
import { createRoot } from 'react-dom/client';

export type ConfirmationStrings = {
	title: string;
	text: string;
	confirm: string;
	deny: string;
	style: 'primary' | 'danger';
};

/**
 * Asks the user to confirm in a dialog mounted on its own root in `document.body`, so it
 * stacks above any open modal without touching that modal's state.
 */
export const askConfirmation = ({ title, text, confirm, deny, style }: ConfirmationStrings): Promise<boolean> =>
	new Promise((resolve) => {
		const container = document.createElement('div');
		document.body.appendChild(container);
		const root = createRoot(container);
		const opener = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.stopPropagation();
				settle(false);
			}
		};
		document.addEventListener('keydown', onKeyDown, true);

		const settle = (answer: boolean) => {
			document.removeEventListener('keydown', onKeyDown, true);
			resolve(answer);
			root.unmount();
			container.remove();
			opener?.focus();
		};

		root.render(
			<ModalBackdrop onClick={(e) => e.target === e.currentTarget && settle(false)}>
				<Modal role='alertdialog' aria-label={title}>
					<ModalHeader>
						<ModalTitle>{title}</ModalTitle>
						<ModalClose onClick={() => settle(false)} />
					</ModalHeader>
					<ModalContent>{text}</ModalContent>
					<ModalFooter>
						<ModalFooterControllers>
							<Button autoFocus onClick={() => settle(false)}>
								{deny}
							</Button>
							<Button variant={style} onClick={() => settle(true)}>
								{confirm}
							</Button>
						</ModalFooterControllers>
					</ModalFooter>
				</Modal>
			</ModalBackdrop>,
		);
	});
