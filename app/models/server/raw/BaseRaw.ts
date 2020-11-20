import { Collection, FindOneOptions, Cursor, WriteOpResult, DeleteWriteOpResultObject, FilterQuery, UpdateQuery, UpdateOneOptions } from 'mongodb';

interface ITrash {
	__collection__: string;
}

export interface IBaseRaw<T> {
	col: Collection<T>;
}

const baseName = 'rocketchat_';

export class BaseRaw<T> implements IBaseRaw<T> {
	public defaultFields?: Record<string, 1 | 0>;

	protected name: string;

	constructor(
		public readonly col: Collection<T>,
		public readonly trash?: Collection<T>,
	) {
		this.name = this.col.collectionName.replace(baseName, '');
	}

	_ensureDefaultFields<T>(options: FindOneOptions<T>): FindOneOptions<T> {
		if (!this.defaultFields) {
			return options;
		}

		if (!options) {
			return { projection: this.defaultFields };
		}

		// TODO: change all places using "fields" for raw models and remove the additional condition here
		if ((options.projection != null && Object.keys(options.projection).length > 0)
		|| (options.fields != null && Object.keys(options.fields).length > 0)) {
			return options;
		}

		return {
			...options,
			projection: this.defaultFields,
		};
	}

	async findOneById(_id: string, options: FindOneOptions<T> = {}): Promise<T | undefined> {
		return this.findOne({ _id }, options);
	}

	async findOne(query = {}, options: FindOneOptions<T> = {}): Promise<T | undefined> {
		const optionsDef = this._ensureDefaultFields<T>(options);

		if (typeof query === 'string') {
			return this.findOneById(query, options);
		}

		return await this.col.findOne<T>(query, optionsDef) ?? undefined;
	}

	findUsersInRoles(): void {
		throw new Error('[overwrite-function] You must overwrite this function in the extended classes');
	}

	find(query = {}, options: FindOneOptions<T> = {}): Cursor<T> {
		const optionsDef = this._ensureDefaultFields(options);
		return this.col.find(query, optionsDef);
	}

	update(filter: FilterQuery<T>, update: UpdateQuery<T> | Partial<T>, options?: UpdateOneOptions & { multi?: boolean }): Promise<WriteOpResult> {
		return this.col.update(filter, update, options);
	}

	removeById(_id: string): Promise<DeleteWriteOpResultObject> {
		const query: object = { _id };
		return this.col.deleteOne(query);
	}

	// Trash
	trashFind(query: FilterQuery<T & ITrash>, options: FindOneOptions<T>): Cursor<T> | undefined {
		return this.trash?.find<T>({
			__collection__: this.name,
			...query,
		}, options);
	}

	async trashFindOneById(_id: string, options: FindOneOptions<T> = {}): Promise<T | undefined> {
		const query: object = {
			_id,
			__collection__: this.name,
		};

		return await this.trash?.findOne<T>(query, options) ?? undefined;
	}
}
