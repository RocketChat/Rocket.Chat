import { Base } from './_Base';

export interface IMatrixBridgedUser {
	uid: string;
	mui: string;
	remote: boolean;
}

class MatrixBridgedUserModel extends Base {
	constructor() {
		super('matrix_bridged_users');
		this.tryEnsureIndex({ uid: 1 }, { unique: true, sparse: true });
		this.tryEnsureIndex({ mui: 1 }, { unique: true, sparse: true });
	}

	getMatrixId(uid: string): string | null {
		const bridgedUser: IMatrixBridgedUser = this.findOne({ uid });

		return bridgedUser ? bridgedUser.mui : null;
	}

	getByMatrixId(mui: string): IMatrixBridgedUser | null {
		return this.findOne({ mui });
	}

	getId(mui: string): string | null {
		const bridgedUser: IMatrixBridgedUser = this.findOne({ mui });

		return bridgedUser ? bridgedUser.uid : null;
	}

	getById(uid: string): IMatrixBridgedUser | null {
		return this.findOne({ uid });
	}
}

export const MatrixBridgedUser = new MatrixBridgedUserModel();
