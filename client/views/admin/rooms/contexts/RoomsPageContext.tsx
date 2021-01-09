import React, { createContext, useContext } from 'react';

interface IRoomsPage {
	deleted: boolean;
	setDeleted: React.Dispatch<React.SetStateAction<boolean>>;
}

const RoomsPageContext = createContext<IRoomsPage>({
	deleted: false,
	setDeleted: () => {
		// do nothing
	},
});

interface IProviderProps extends IRoomsPage {
	children: React.ReactNode;
}

let noOfDeletedRooms = 0;

export const RoomsPageProvider = ({
	deleted,
	setDeleted,
	children,
}: IProviderProps): React.ReactNode => (
	<RoomsPageContext.Provider value={{ deleted, setDeleted }}>
		{children}
	</RoomsPageContext.Provider>
);

interface IUseDeleteRoomReturnVal extends IRoomsPage {
	incrementDeletedRooms: () => void;
	noOfDeletedRooms: number;
}

export const useDeleteRoom = (): IUseDeleteRoomReturnVal => {
	const { deleted, setDeleted } = useContext(RoomsPageContext);
	const incrementDeletedRooms = (): void => {
		noOfDeletedRooms += 1;
		console.info('no of deleted rooms are', noOfDeletedRooms);
	};
	return { deleted, setDeleted, incrementDeletedRooms, noOfDeletedRooms };
};
