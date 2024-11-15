module.export({defaultManagedSessionFactory:()=>defaultManagedSessionFactory});/**
 * Function which returns a ManagedSessionFactory.
 * @public
 */
function defaultManagedSessionFactory() {
    return (sessionManager, session) => {
        return { session, held: false, muted: false };
    };
}
