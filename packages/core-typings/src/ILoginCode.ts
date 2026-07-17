export interface ILoginCode {
	_id: string;
	userId: string;
	createdAt: Date;
	expireAt: Date;
}
