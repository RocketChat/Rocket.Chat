export interface IStateInterface {
	value: { location: string };
}

export interface IActionInterface {
	type: string;
	payload?: {
		location: string;
	};
}

const InitialState: IStateInterface = {
	value: { location: '' },
};

const UserPreviousPageReducer = (state, action): IStateInterface => {
	switch (action.type) {
		case 'ADD_LOCATION':
			return {
				...state,
				value: action.payload,
			};
		case 'CLEAR_LOCATION':
			return {
				...state,
				value: { location: '' },
			};
		default:
			return state;
	}
};

export { UserPreviousPageReducer, InitialState };
