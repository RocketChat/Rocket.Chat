import { AccountsClient } from './accounts-client.ts';
import { ServiceConfigurationMixin } from 'meteor/service-configuration';
import { PasswordAuthMixin } from 'meteor/accounts-password';
import { OAuthAuthMixin } from 'meteor/accounts-oauth';

// 1. Compose the classes. Order matters based on interface requirements!
// AccountsClient -> ServiceConfiguration -> Password -> OAuth
export class AppAccountsClient extends OAuthAuthMixin(
  PasswordAuthMixin(
    ServiceConfigurationMixin(AccountsClient)
  )
) {}

export declare namespace Accounts {
  interface LoginMethodOptions {
    /**
     * The method to call (default 'login')
     */
    methodName?: string | undefined;
    /**
     * The arguments for the method
     */
    methodArguments?: any[] | undefined;
    /**
     * If provided, will be called with the result of the
     * method. If it throws, the client will not be logged in (and
     * its error will be passed to the callback).
     */
    validateResult?: Function | undefined;
    /**
     * Will be called with no arguments once the user is fully
     * logged in, or with the error on error.
     */
    userCallback?: ((err?: any) => void) | undefined;
  }
}

// 2. Instantiate the singleton
export const Accounts = new AppAccountsClient();
