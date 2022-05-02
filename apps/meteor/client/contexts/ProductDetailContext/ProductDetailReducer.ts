export interface IProductStateInterface {
	value: { id: string; title: string; description: string };
}

export interface IProductActionInterface {
	type: string;
	payload?: {
		id: string;
		title: string;
		description: string;
	};
}

const InitialState: IProductStateInterface = {
	value: { id: '', title: '', description: '' },
};

const ProductDetailReducer = (state, action): IProductStateInterface => {
	switch (action.type) {
		case 'ADD_DETAILS':
			console.log(action.payload, 'inside the reducer');
			return {
				...state,
				value: action.payload,
			};
		case 'CLEAR_DETAILS':
			console.log('Clearing the reducer');
			return {
				...state,
				value: { id: '', title: '', description: '' },
			};
		default:
			return state;
	}
};

export { ProductDetailReducer, InitialState };
