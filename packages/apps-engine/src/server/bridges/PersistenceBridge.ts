import type { RocketChatAssociationRecord } from '../../definition/metadata';
import { PermissionDeniedError } from '../errors/PermissionDeniedError';
import { AppPermissionManager } from '../managers/AppPermissionManager';
import { AppPermissions } from '../permissions/AppPermissions';
import { BaseBridge } from './BaseBridge';

export abstract class PersistenceBridge extends BaseBridge {
    public async doPurge(appId: string): Promise<void> {
        if (this.hasDefaultPermission(appId)) {
            return this.purge(appId);
        }
    }

    public async doCreate(data: object, appId: string): Promise<string> {
        if (this.hasDefaultPermission(appId)) {
            return this.create(data, appId);
        }
    }

    public async doCreateWithAssociations(data: object, associations: Array<RocketChatAssociationRecord>, appId: string): Promise<string> {
        if (this.hasDefaultPermission(appId)) {
            return this.createWithAssociations(data, associations, appId);
        }
    }

    public async doReadById(id: string, appId: string): Promise<object> {
        if (this.hasDefaultPermission(appId)) {
            return this.readById(id, appId);
        }
    }

    public async doReadByAssociations(associations: Array<RocketChatAssociationRecord>, appId: string): Promise<Array<object>> {
        if (this.hasDefaultPermission(appId)) {
            return this.readByAssociations(associations, appId);
        }
    }

    public async doRemove(id: string, appId: string): Promise<object | undefined> {
        if (this.hasDefaultPermission(appId)) {
            return this.remove(id, appId);
        }
    }

    public async doRemoveByAssociations(associations: Array<RocketChatAssociationRecord>, appId: string): Promise<Array<object> | undefined> {
        if (this.hasDefaultPermission(appId)) {
            return this.removeByAssociations(associations, appId);
        }
    }

    public async doUpdate(id: string, data: object, upsert: boolean, appId: string): Promise<string> {
        if (this.hasDefaultPermission(appId)) {
            return this.update(id, data, upsert, appId);
        }
    }

    public async doUpdateByAssociations(associations: Array<RocketChatAssociationRecord>, data: object, upsert: boolean, appId: string): Promise<string> {
        if (this.hasDefaultPermission(appId)) {
            return this.updateByAssociations(associations, data, upsert, appId);
        }
    }

    /**
     * Purges the App's persistant storage data from the persistent storage.
     *
     * @argument appId the id of the app's data to remove
     */
    protected abstract purge(appId: string): Promise<void>;

    /**
     * Creates a new persistant record with the provided data attached.
     *
     * @argument data the data to store in persistent storage
     * @argument appId the id of the app which is storing the data
     * @returns the id of the stored record
     */
    protected abstract create(data: object, appId: string): Promise<string>;

    /**
     * Creates a new record in the App's persistent storage with the data being
     * associated with at least one Rocket.Chat record.
     *
     * @argument data the data to store in the persistent storage
     * @argument associations the associations records this data is associated with
     * @argument appId the id of the app which is storing the data
     * @returns the id of the stored record
     */
    protected abstract createWithAssociations(data: object, associations: Array<RocketChatAssociationRecord>, appId: string): Promise<string>;

    /**
     * Retrieves from the persistent storage the record by the id provided.
     *
     * @argument id the record id to read
     * @argument appId the id of the app calling this
     * @returns the data stored in the persistent storage, or undefined
     */
    protected abstract readById(id: string, appId: string): Promise<object>;

    /**
     * Retrieves the data which is associated with the provided records.
     *
     * @argument associations the association records to query about
     * @argument appId the id of the app calling this
     * @returns an array of records if they exist, an empty array otherwise
     */
    protected abstract readByAssociations(associations: Array<RocketChatAssociationRecord>, appId: string): Promise<Array<object>>;

    /**
     * Removes the record which matches the provided id.
     *
     * @argument id the id of the record
     * @argument appId the id of the app calling this
     * @returns the data being removed
     */
    protected abstract remove(id: string, appId: string): Promise<object | undefined>;

    /**
     * Removes any data which has been associated with the provided records.
     *
     * @argument associations the associations which to remove records
     * @argument appId the id of the app calling this
     * @returns the data of the removed records
     */
    protected abstract removeByAssociations(associations: Array<RocketChatAssociationRecord>, appId: string): Promise<Array<object> | undefined>;

    /**
     * Updates the record in the database, with the option of creating a new one if it doesn't exist.
     *
     * @argument id the id of the record to update
     * @argument data the updated data to set in the record
     * @argument upsert whether to create if the id doesn't exist
     * @argument appId the id of the app calling this
     * @returns the id, whether the new one or the existing one
     */
    protected abstract update(id: string, data: object, upsert: boolean, appId: string): Promise<string>;

    /**
     * Updates the record in the database, with the option of creating a new one if it doesn't exist.
     *
     * @argument associations the association records to update
     * @argument data the updated data to set in the record
     * @argument upsert whether to create if the id doesn't exist
     * @argument appId the id of the app calling this
     * @returns the id, whether the new one or the existing one
     */
    protected abstract updateByAssociations(associations: Array<RocketChatAssociationRecord>, data: object, upsert: boolean, appId: string): Promise<string>;

    private hasDefaultPermission(appId: string): boolean {
        if (AppPermissionManager.hasPermission(appId, AppPermissions.persistence.default)) {
            return true;
        }

        AppPermissionManager.notifyAboutError(
            new PermissionDeniedError({
                appId,
                missingPermissions: [AppPermissions.persistence.default],
            }),
        );

        return false;
    }
}
