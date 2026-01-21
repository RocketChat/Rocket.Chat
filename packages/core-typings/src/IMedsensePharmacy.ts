import type { IBaseData } from "./IBaseData";

export interface IMedsensePharmacy extends IBaseData {
    name: string;
    slug: string;
    active: boolean;
    createdBy: string;
    createdAt: Date;
    updatedAt?: Date;
}
