type StateInterface = {
	value: { id: string; author: string; createdAt: string; title: string; content: string; image: string };
};

type ActionInterface = {
	type: string;
	payload: { id: string; author: string; createdAt: string; title: string; content: string; image: string };
};

const InitialState: StateInterface = {
	value: { id: '', author: '', createdAt: '', title: '', content: '', image: '' },
};

const BlogDetailReducer = (state, action) => {
	switch (action.type) {
		case 'ADD_DETAILS':
			return {
				...state,
				value: action.payload,
			};
		case 'CLEAR_DETAILS':
			return {
				...state,
				value: {},
			};
		default:
			return state;
	}
};

export { BlogDetailReducer, InitialState, StateInterface, ActionInterface };
