export interface IImporterSelectionUser {
	user_id: string;
	username: string | undefined;
	email: string;
	is_deleted: boolean;
	is_bot: boolean;
	do_import: boolean;
	is_email_taken: boolean;
}
