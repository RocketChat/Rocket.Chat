import store from '../../store';
import Modal from './component';


export default {
	confirm(props = {}) {
		return new Promise((resolve) => {
			const handleButton = (success) => () => {
				store.setState({ modal: null });
				resolve({ success });
			};

			store.setState({
				modal: <Modal.Confirm {...props} onConfirm={handleButton(true)} onCancel={handleButton(false)} />,
			});
		});
	},

	alert(props = {}) {
		return new Promise((resolve) => {
			const handleButton = () => () => {
				store.setState({ modal: null });
				resolve({ success: true });
			};

			store.setState({
				modal: <Modal.Alert {...props} onConfirm={handleButton()} />,
			});
		});
	},
};
