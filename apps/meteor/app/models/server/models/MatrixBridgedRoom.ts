import { Base } from './_Base';

interface IMatrixBridgedRoom {
	rid: string;
	mri: string;
}

class MatrixBridgedRoomModel extends Base {
	constructor() {
		super('matrix_bridged_rooms');
		this.tryEnsureIndex({ rid: 1 }, { unique: true, sparse: true });
		this.tryEnsureIndex({ mri: 1 }, { unique: true, sparse: true });
	}

	getMatrixId(rid: string): string | null {
		const bridgedRoom: IMatrixBridgedRoom = this.findOne({ rid });

		return bridgedRoom ? bridgedRoom.mri : null;
	}

	getId(mri: string): string | null {
		const bridgedRoom: IMatrixBridgedRoom = this.findOne({ mri });

		return bridgedRoom ? bridgedRoom.rid : null;
	}
}

export const MatrixBridgedRoom = new MatrixBridgedRoomModel();
