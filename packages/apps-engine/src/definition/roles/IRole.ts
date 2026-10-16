/** A workspace role, as `IRoleRead` returns it. */
export interface IRole {
	/** What the role is for, shown in the administration area. */
	description: string;
	/** Whether holders of this role must use two-factor authentication. */
	mandatory2fa?: boolean;
	/** The role's name, which is also how permissions refer to it. */
	name: string;
	/** Whether the role ships with Rocket.Chat and cannot be deleted. */
	protected: boolean;
	/** Whether the role applies workspace-wide (`Users`) or per room (`Subscriptions`). */
	scope: 'Users' | 'Subscriptions';
	/** The role's identifier. */
	id: string;
}
