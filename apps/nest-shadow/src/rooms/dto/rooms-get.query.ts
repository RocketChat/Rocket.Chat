import { AcceptsUnknownParams } from '../../common/rest-v1-validation.pipe.js';
import { UpdatedSinceQuery } from '../../common/updated-since.js';

@AcceptsUnknownParams()
export class RoomsGetQuery extends UpdatedSinceQuery {}
