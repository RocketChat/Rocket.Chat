export interface IImporterSelectionChannel {
	channel_id: string;
	name: string | undefined;
	is_archived: boolean;
	do_import: boolean;
	is_private: boolean;
	is_direct: boolean;
}
