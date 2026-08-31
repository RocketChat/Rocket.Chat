import { type ComponentProps } from 'preact';

import AlertModal from './AlertModal';
import ConfirmationModal from './ConfirmationModal';
import store from '../../store';

export const ModalManager = {
	confirm(props: Omit<ComponentProps<typeof ConfirmationModal>, 'onConfirm' | 'onCancel'>) {
		return new Promise<{ success: boolean }>((resolve) => {
			const handleButton = (success: boolean) => () => {
				store.setState({ modal: null });
				resolve({ success });
			};

			store.setState({
				modal: <ConfirmationModal {...props} onConfirm={handleButton(true)} onCancel={handleButton(false)} />,
			});
		});
	},

	alert(props: Omit<ComponentProps<typeof AlertModal>, 'onConfirm'>) {
		return new Promise<{ success: boolean }>((resolve) => {
			const handleButton = () => () => {
				store.setState({ modal: null });
				resolve({ success: true });
			};

			store.setState({
				modal: <AlertModal {...props} onConfirm={handleButton()} />,
			});
		});
	},
} as const;
