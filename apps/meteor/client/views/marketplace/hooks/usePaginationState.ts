import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import type { Dispatch, SetStateAction } from 'react';
import { useReducer } from 'react';

type ItemsPerPage = 25 | 50 | 100;

type PaginationState = {
	current: number;
	itemsPerPage: ItemsPerPage;
};

const reducePaginationState = (
	state: PaginationState,
	action:
		| {
				changeCurrent: SetStateAction<number>;
		  }
		| {
				changeItemsPerPage: SetStateAction<ItemsPerPage>;
		  },
): PaginationState => {
	if ('changeCurrent' in action) {
		if (typeof action.changeCurrent === 'number') {
			return { current: action.changeCurrent, itemsPerPage: state.itemsPerPage };
		}

		return { current: action.changeCurrent(state.current), itemsPerPage: state.itemsPerPage };
	}

	if ('changeItemsPerPage' in action) {
		if (typeof action.changeItemsPerPage === 'number') {
			return { current: 0, itemsPerPage: action.changeItemsPerPage };
		}

		return { current: 0, itemsPerPage: action.changeItemsPerPage(state.itemsPerPage) };
	}
	return state;
};

export const usePaginationState = () => {
	const [{ current, itemsPerPage }, dispatch] = useReducer(reducePaginationState, { current: 0, itemsPerPage: 25 });

	const onSetCurrent: Dispatch<SetStateAction<number>> = useEffectEvent((value) => {
		dispatch({ changeCurrent: value });
	});

	const onSetItemsPerPage: Dispatch<SetStateAction<ItemsPerPage>> = useEffectEvent((value) => {
		dispatch({ changeItemsPerPage: value });
	});

	return {
		current,
		itemsPerPage,
		onSetCurrent,
		onSetItemsPerPage,
	};
};
