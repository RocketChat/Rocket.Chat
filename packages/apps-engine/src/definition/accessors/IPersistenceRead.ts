import type { RocketChatAssociationRecord } from '../metadata';

/**
 * Provides a read-only accessor for the App's persistent storage.
 * A App only has access to its own persistent storage and does not
 * have access to any other App's.
 */
export interface IPersistenceRead {
    /**
     * Retrieves a record from the App's persistent storage by the provided id.
     * A "falsey" value (undefined or null or false) is returned should nothing exist
     * in the storage by the provided id.
     *
     * @param id the record to get's id
     * @return the record if it exists, falsey if not
     */
    read(id: string): Promise<object>;

    /**
     * Retrieves a record from the App's persistent storage by the provided id.
     * An empty array is returned should there be no records associated with the
     * data provided.
     *
     * @param association the association record to query the persistent storage for
     * @return array of the records if any exists, empty array if none exist
     */
    readByAssociation(association: RocketChatAssociationRecord): Promise<Array<object>>;

    /**
     * Retrieves a record from the App's persistent storage by the provided id.
     * Providing more than one association record acts like an AND which means a record
     * in persistent storage must have all of the associations to be considered a match.
     * An empty array is returned should there be no records associated with the
     * data provided.
     *
     * @param associations the association records to query the persistent storage for
     * @return array of the records if any exists, empty array if none exist
     */
    readByAssociations(associations: Array<RocketChatAssociationRecord>): Promise<Array<object>>;
}
