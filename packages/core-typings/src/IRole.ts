export interface IRole {
	description: string;
	mandatory2fa?: boolean;
	name: string;
	protected: boolean;
	scope: 'Users' | 'Subscriptions';
	_id: string;
}
