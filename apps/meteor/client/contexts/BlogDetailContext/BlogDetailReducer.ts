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
	console.log(action.payload, 'inside the reducer');
	switch (action.type) {
		case 'ADD_DETAILS':
			return {
				...state,
				value: action.payload,
			};
		case 'CLEAR_DETAILS':
			return {
				...state,
				value: { id: '', author: '', createdAt: '', title: '', content: '', image: '', comments: [] },
			};
		default:
			return state;
	}
};

export { BlogDetailReducer, InitialState };
