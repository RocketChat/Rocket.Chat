import store from '../store';

export default class Commands {
	connected() {
		store.setState({ connecting: false });
	}
}
