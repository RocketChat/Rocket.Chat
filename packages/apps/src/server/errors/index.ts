import { CommandAlreadyExistsError } from './CommandAlreadyExistsError.js';
import { CommandHasAlreadyBeenTouchedError } from './CommandHasAlreadyBeenTouchedError.js';
import { CompilerError } from './CompilerError.js';
import { InvalidLicenseError } from './InvalidLicenseError.js';
import { MustContainFunctionError } from './MustContainFunctionError.js';
import { MustExtendAppError } from './MustExtendAppError.js';
import { NotEnoughMethodArgumentsError } from './NotEnoughMethodArgumentsError.js';
import { PathAlreadyExistsError } from './PathAlreadyExistsError.js';
import { RequiredApiVersionError } from './RequiredApiVersionError.js';
import { VideoConfProviderAlreadyExistsError } from './VideoConfProviderAlreadyExistsError.js';
import { VideoConfProviderNotRegisteredError } from './VideoConfProviderNotRegisteredError.js';

export {
	CommandAlreadyExistsError,
	CommandHasAlreadyBeenTouchedError,
	PathAlreadyExistsError,
	CompilerError,
	MustContainFunctionError,
	MustExtendAppError,
	NotEnoughMethodArgumentsError,
	RequiredApiVersionError,
	InvalidLicenseError,
	VideoConfProviderAlreadyExistsError,
	VideoConfProviderNotRegisteredError,
};
