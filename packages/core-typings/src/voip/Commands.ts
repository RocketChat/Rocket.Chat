/**
 * Enumerator represnting set of commands supported by the connector.
 * @remark : This enum will be used by the consumer of |CommandHandler| class to
 * execute a particular management commamd.
 */
export enum Commands {
	'ping',
	'extension_list',
	'extension_info',
	'queue_summary',
	'queue_details',
	'event_stream',
}
