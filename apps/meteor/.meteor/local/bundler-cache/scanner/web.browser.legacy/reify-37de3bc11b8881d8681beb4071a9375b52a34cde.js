module.export({PasswordPolicyError:function(){return PasswordPolicyError}});class PasswordPolicyError extends Error {
    constructor(message, error, details) {
        super(message);
        this.error = error;
        this.details = details;
    }
}
//# sourceMappingURL=PasswordPolicyError.js.map