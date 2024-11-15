module.export({UserAgentState:function(){return UserAgentState}});/**
 * {@link UserAgent} state.
 * @remarks
 * Valid state transitions:
 * ```
 * 1. "Started" --> "Stopped"
 * 2. "Stopped" --> "Started"
 * ```
 * @public
 */
var UserAgentState;
(function (UserAgentState) {
    UserAgentState["Started"] = "Started";
    UserAgentState["Stopped"] = "Stopped";
})(UserAgentState || (module.runSetters(UserAgentState = {},["UserAgentState"])));
