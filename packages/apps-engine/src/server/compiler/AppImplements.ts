import { AppInterface } from '../../definition/metadata/AppInterface';
import { Utilities } from '../misc/Utilities';

export class AppImplements {
    private implemented: { [key: string]: boolean };

    constructor() {
        this.implemented = {};
        Object.keys(AppInterface).forEach((int) => {
            this.implemented[int] = false;
        });
    }

    public doesImplement(int: string): void {
        if (int in AppInterface) {
            this.implemented[int] = true;
        }
    }

    public getValues(): { [int: string]: boolean } {
        return Utilities.deepCloneAndFreeze(this.implemented);
    }

    public toJSON(): { [int: string]: boolean } {
        return this.getValues();
    }
}
