/** A reader for reading the Environmental Variables. */
export interface IEnvironmentalVariableRead {
    /** Gets the value for a variable. */
    getValueByName(envVarName: string): Promise<string>;

    /** Checks to see if Apps can access the given variable name. */
    isReadable(envVarName: string): Promise<boolean>;

    /** Checks to see if any value is set for the given variable name. */
    isSet(envVarName: string): Promise<boolean>;
}
