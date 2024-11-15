import { AppsEngineException } from '.';
/**
 * This exception informs the host system that an
 * app essential to the execution of a system action
 * is disabled, so the action should be halted.
 *
 * Apps can register to be considered essential to
 * the execution of internal events of the framework
 * such as `IPreMessageSentPrevent`, `IPreRoomUserJoined`,
 * etc.
 *
 * This is used interally by the framework and is not
 * intended to be thrown manually by apps.
 */
export declare class EssentialAppDisabledException extends AppsEngineException {
}
