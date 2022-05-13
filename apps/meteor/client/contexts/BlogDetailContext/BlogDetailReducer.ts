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

export interface IActionCommentInterface {
	type: string;
	payload: Record<string, any>;
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
				value: { id: '', author: '', createdAt: '', title: '', content: '', image: '', comments: [] },
			};
		case 'ADD_COMMENT':
			return {
				...state,
				value: { ...state.value, comments: [...state.value.comments, action.payload] },
			};
		case 'UPDATE_COMMENT':
			const removeOldComment = state.value.comments.filter((item) => item._id !== action.payload._id);
			const addUpdatedComment = [...removeOldComment, action.payload];
			return {
				...state,
				value: { ...state.value, comments: addUpdatedComment },
			};
		case 'DELETE_COMMENT':
			const deleteComment = state.value.comments.filter((item) => item._id !== action.payload.commentId);
			return {
				...state,
				value: { ...state.value, comments: deleteComment },
			};
		default:
			return state;
	}
};

export { BlogDetailReducer, InitialState };
