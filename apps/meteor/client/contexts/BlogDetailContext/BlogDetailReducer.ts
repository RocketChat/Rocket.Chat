export interface IStateInterface {
	value: { id: string; author: string; createdAt: string; title: string; content: string; image: string; comments: Record<string, any>[] };
}

export interface IActionInterface {
	type: string;
	payload?: {
		id: string;
		author: string;
		createdAt: string;
		title: string;
		content: string;
		image: string;
		comments: Record<string, any>[];
	};
}

const InitialState: IStateInterface = {
	value: { id: '', author: '', createdAt: '', title: '', content: '', image: '', comments: [] },
};

const BlogDetailReducer = (state, action): IStateInterface => {
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

export { BlogDetailReducer, InitialState };
