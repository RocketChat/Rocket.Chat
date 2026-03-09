import { EmailInbox, Users } from '@rocket.chat/models';
import { isEmailInbox, isEmailInboxGetParams } from '@rocket.chat/rest-typings';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { sendTestEmailToInbox } from '../../../../server/features/EmailInbox/EmailInbox_Outgoing';
import { API } from '../api';
import { getPaginationItems } from '../helpers/getPaginationItems';
import { insertOneEmailInbox, findEmailInboxes, updateEmailInbox, removeEmailInbox } from '../lib/emailInbox';

API.v1.addRoute(
    'email-inbox.list',
    { authRequired: true, permissionsRequired: ['manage-email-inbox'] },
    {
        async get() {
            const { offset, count } = await getPaginationItems(this.queryParams);
            const { sort, query } = await this.parseJsonQuery();
            const emailInboxes = await findEmailInboxes({ query, pagination: { offset, count, sort } });

            return API.v1.success(emailInboxes);
        },
    },
);

API.v1.addRoute(
    'email-inbox',
    { authRequired: true, permissionsRequired: ['manage-email-inbox'] },
    {
        get: {
            validateParams: isEmailInboxGetParams,
            async action() {
                const { email } = this.queryParams;
                
                if (!email) {
                    throw new Error('error-invalid-param');
                }

                const emailInbox = await EmailInbox.findByEmail(email);

                if (!emailInbox) {
                     return API.v1.success({ emailInbox: null });
                }

                // PERMISSION CHECK (Resolving the issue TODO)
                // Explicitly verify access to prevent unauthorized data exposure
                const hasAccess = await hasPermissionAsync(this.userId, 'manage-email-inbox');
                if (!hasAccess) {
                    throw new Error('error-not-allowed');
                }
                
                return API.v1.success({ emailInbox });
            }
        },
        post: {
            validateParams: isEmailInbox,
            async action() {
                const emailInboxParams = this.bodyParams as any; 
                
                let _id: string;

                const { _id: idFromParams, ...restParams } = emailInboxParams;

                if (!idFromParams) {
                    const { insertedId } = await insertOneEmailInbox(this.userId, restParams);

                    if (!insertedId) {
                        return API.v1.failure('Failed to create email inbox');
                    }

                    _id = insertedId;
                } else {
                    const emailInbox = await updateEmailInbox({ 
                        ...restParams, 
                        _id: idFromParams 
                    } as any);

                    if (!emailInbox?._id) {
                        return API.v1.failure('Failed to update email inbox');
                    }

                    _id = emailInbox._id;
                }

                return API.v1.success({ _id });
            }
        },
    },
);

API.v1.addRoute(
    'email-inbox/:_id',
    { authRequired: true, permissionsRequired: ['manage-email-inbox'] },
    {
        async get() {
            const { _id } = this.urlParams;
            if (typeof _id !== 'string') {
                throw new Error('error-invalid-param');
            }

            const emailInbox = await EmailInbox.findOneById(_id);

            if (!emailInbox) {
                return API.v1.notFound();
            }

            return API.v1.success(emailInbox);
        },
        async delete() {
            const { _id } = this.urlParams;
            if (typeof _id !== 'string') {
                throw new Error('error-invalid-param');
            }

            const { deletedCount } = await removeEmailInbox(_id);

            if (!deletedCount) {
                return API.v1.notFound();
            }

            return API.v1.success({ _id });
        },
    },
);

API.v1.addRoute(
    'email-inbox.send-test/:_id',
    { authRequired: true, permissionsRequired: ['manage-email-inbox'] },
    {
        async post() {
            const { _id } = this.urlParams;
            if (typeof _id !== 'string') {
                throw new Error('error-invalid-param');
            }

            const emailInbox = await EmailInbox.findOneById(_id);

            if (!emailInbox) {
                return API.v1.notFound();
            }

            const user = await Users.findOneById(this.userId);
            if (!user) {
                return API.v1.notFound();
            }

            await sendTestEmailToInbox(emailInbox, user);

            return API.v1.success({ _id });
        },
    },
);