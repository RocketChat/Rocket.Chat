if (Meteor.isServer) {
  Knex = Npm.require('knex');
  return;
}

function knex(tableName) {
  var qb = knex.queryBuilder();
  return qb.table(tableName);
}

knex.queryBuilder = function () {
  return new QueryBuilder();
};

knex.VERSION = '0.8.6'; // actually just a custom wrapper

const methods = [
  'insert', 'update', 'select', 'delete', 'del',
  'where', 'whereNot', 'whereNull', 'whereNotNull',
  'whereExists', 'whereNotExists', 'whereIn', 'whereNotIn',
  'whereBetween', 'whereNotBetween'
];
methods.forEach(function (method) {
  knex[method] = function (...args) {
    var builder = knex.queryBuilder();
    return builder[method](...args);
  };
});

// most of the builder is copy/pasted from the original knex.js
QueryBuilder = Builder;
function Builder() {
  this.and         = this;
  this._single     = {};
  this._statements = [];

  // Internal flags used in the builder.
  this._method    = 'select';
  this._joinFlag  = 'inner';
  this._boolFlag  = 'and';
  this._notFlag   = false;

  this._cbs = {};
}

_.extend(Builder.prototype, {
  // XXX sync event emitter simulation
  on: function (channel, cb) {
    const cbs = this._cbs;
    cbs[channel] = cbs[channel] || [];
    cbs[channel].push(cb);
    return this;
  },
  emit: function (channel, payload) {
    (this._cbs[channel] || []).forEach(f => f(payload));
    return this;
  },

  toMongoQuery: function (method) {
    return this.queryCompiler(this).toMongoQuery(method || this._method);
  },

  // XXX hack?
  toSQL: function(method) {
    throw new Error('no sql mo problems');
    return this.toMongoQuery();
  },

  clone: function() {
    var cloned            = new this.constructor();
      cloned._method      = this._method;
      cloned._single      = _.clone(this._single);
      cloned._options     = _.clone(this._options);
      cloned._statements  = this._statements.slice();
    return cloned;
  },
  columns: function(column) {
    if (!column) return this;
    this._statements.push({
      grouping: 'columns',
      value: normalizeArr.apply(null, arguments)
    });
    return this;
  },
  as: function(column) {
    this._single.as = column;
    return this;
  },
  table: function(tableName) {
    this._single.table = tableName;
    return this;
  },
  where: function(column, operator, value) {
    // Support "where true || where false"
    if (column === false || column === true) {
      return this.where(1, '=', column ? 1 : 0);
    }

    // Check if the column is a function, in which case it's
    // a where statement wrapped in parens.
    if (typeof column === 'function') {
      return this.whereWrapped(column);
    }

    // Allow a raw statement to be passed along to the query.
    if (column instanceof Raw && arguments.length === 1) return this.whereRaw(column);

    // Allows `where({id: 2})` syntax.
    if (_.isObject(column) && !(column instanceof Raw)) return this._objectWhere(column);

    // Enable the where('key', value) syntax, only when there
    // are explicitly two arguments passed, so it's not possible to
    // do where('key', '!=') and have that turn into where key != null
    if (arguments.length === 2) {
      value    = operator;
      operator = '=';

      // If the value is null, and it's a two argument query,
      // we assume we're going for a `whereNull`.
      if (value === null) {
        return this.whereNull(column);
      }
    }

    // lower case the operator for comparison purposes
    var checkOperator = ('' + operator).toLowerCase().trim();

    // If there are 3 arguments, check whether 'in' is one of them.
    if (arguments.length === 3) {
      if (checkOperator === 'in' || checkOperator === 'not in') {
        return this._not(checkOperator === 'not in').whereIn(arguments[0], arguments[2]);
      }
      if (checkOperator === 'between' || checkOperator === 'not between') {
        return this._not(checkOperator === 'not between').whereBetween(arguments[0], arguments[2]);
      }
    }

    // If the value is still null, check whether they're meaning
    // where value is null
    if (value === null) {

      // Check for .where(key, 'is', null) or .where(key, 'is not', 'null');
      if (checkOperator === 'is' || checkOperator === 'is not') {
        return this._not(checkOperator === 'is not').whereNull(column);
      }
    }

    // Push onto the where statement stack.
    this._statements.push({
      grouping: 'where',
      type: 'whereBasic',
      column: column,
      operator: operator,
      value: value,
      not: this._not(),
      bool: this._bool()
    });
    return this;
  },

  orWhere: function() {
    return this._bool('or').where.apply(this, arguments);
  },

  whereNot: function() {
    return this._not(true).where.apply(this, arguments);
  },

  orWhereNot: function() {
    return this._bool('or').whereNot.apply(this, arguments);
  },

  _objectWhere: function(obj) {
    var boolVal = this._bool();
    var notVal = this._not() ? 'Not' : '';
    for (var key in obj) {
      this[boolVal + 'Where' + notVal](key, obj[key]);
    }
    return this;
  },
    whereWrapped: function(callback) {
    this._statements.push({
      grouping: 'where',
      type: 'whereWrapped',
      value: callback,
      not: this._not(),
      bool: this._bool()
    });
    return this;
  },

  whereExists: function(callback) {
    this._statements.push({
      grouping: 'where',
      type: 'whereExists',
      value: callback,
      not: this._not(),
      bool: this._bool(),
    });
    return this;
  },

  // Adds an `or where exists` clause to the query.
  orWhereExists: function(callback) {
    return this._bool('or').whereExists(callback);
  },

  // Adds a `where not exists` clause to the query.
  whereNotExists: function(callback) {
    return this._not(true).whereExists(callback);
  },

  // Adds a `or where not exists` clause to the query.
  orWhereNotExists: function(callback) {
    return this._bool('or').whereNotExists(callback);
  },

  // Adds a `where in` clause to the query.
  whereIn: function(column, values) {
    if (Array.isArray(values) && _.isEmpty(values)) return this.where(this._not());
    this._statements.push({
      grouping: 'where',
      type: 'whereIn',
      column: column,
      value: values,
      not: this._not(),
      bool: this._bool()
    });
    return this;
  },

  // Adds a `or where in` clause to the query.
  orWhereIn: function(column, values) {
    return this._bool('or').whereIn(column, values);
  },

  // Adds a `where not in` clause to the query.
  whereNotIn: function(column, values) {
    return this._not(true).whereIn(column, values);
  },

  // Adds a `or where not in` clause to the query.
  orWhereNotIn: function(column, values) {
    return this._bool('or')._not(true).whereIn(column, values);
  },

  // Adds a `where null` clause to the query.
  whereNull: function(column) {
    this._statements.push({
      grouping: 'where',
      type: 'whereNull',
      column: column,
      not: this._not(),
      bool: this._bool()
    });
    return this;
  },

  // Adds a `or where null` clause to the query.
  orWhereNull: function(column) {
    return this._bool('or').whereNull(column);
  },

  // Adds a `where not null` clause to the query.
  whereNotNull: function(column) {
    return this._not(true).whereNull(column);
  },

  // Adds a `or where not null` clause to the query.
  orWhereNotNull: function(column) {
    return this._bool('or').whereNotNull(column);
  },

  // Adds a `where between` clause to the query.
  whereBetween: function(column, values) {
    assert(Array.isArray(values), 'The second argument to whereBetween must be an array.');
    assert(values.length === 2, 'You must specify 2 values for the whereBetween clause');
    this._statements.push({
      grouping: 'where',
      type: 'whereBetween',
      column: column,
      value: values,
      not: this._not(),
      bool: this._bool()
    });
    return this;
  },

  // Adds a `where not between` clause to the query.
  whereNotBetween: function(column, values) {
    return this._not(true).whereBetween(column, values);
  },

  // Adds a `or where between` clause to the query.
  orWhereBetween: function(column, values) {
    return this._bool('or').whereBetween(column, values);
  },

  // Adds a `or where not between` clause to the query.
  orWhereNotBetween: function(column, values) {
    return this._bool('or').whereNotBetween(column, values);
  },

  orderBy: function(column, direction) {
    this._statements.push({
      grouping: 'order',
      type: 'orderByBasic',
      value: column,
      direction: direction
    });
    return this;
  },

  // Only allow a single "offset" to be set for the current query.
  offset: function(value) {
    this._single.offset = value;
    return this;
  },

  // Only allow a single "limit" to be set for the current query.
  limit: function(value) {
    var val = parseInt(value, 10);
    if (isNaN(val)) {
      throw Error('A valid integer must be provided to limit');
    } else {
      this._single.limit = val;
    }
    return this;
  },

  // Increments a column's value by the specified amount.
  increment: function(column, amount) {
    if (! _.isString(column)) {
      throw new Error('Must provide string column name to increment');
    }

    if (isNaN(amount)) {
      throw new Error('Must provide number amount to increment');
    }

    return this._counter(column, amount);
  },

  // Decrements a column's value by the specified amount.
  decrement: function(column, amount) {
    if (! _.isString(column)) {
      throw new Error('Must provide string column name to decrement');
    }

    if (isNaN(amount)) {
      throw new Error('Must provide number amount to decrement');
    }

    return this._counter(column, amount, '-');
  },

  insert: function(values, returning) {
    this._method = 'insert';
    if (!_.isEmpty(returning)) this.returning(returning);
    this._single.insert = values;
    return this;
  },

  // Sets the values for an `update`, allowing for both
  // `.update(key, value, [returning])` and `.update(obj, [returning])` syntaxes.
  update: function(values, returning) {
    var ret, obj = this._single.update || {};
    this._method = 'update';
    if (_.isString(values)) {
      obj[values] = returning;
      if (arguments.length > 2) {
        ret = arguments[2];
      }
    } else {
      var i = -1, keys = Object.keys(values);
      if (this._single.update) {
        throw new Error('Update called multiple times with objects.');
      }
      while (++i < keys.length) {
        obj[keys[i]] = values[keys[i]];
      }
      ret = arguments[1];
    }
    if (!_.isEmpty(ret)) this.returning(ret);
    this._single.update = obj;
    return this;
  },

  delete: function(ret) {
    this._method = 'del';
    if (!_.isEmpty(ret)) this.returning(ret);
    return this;
  },

  _counter: function(column, amount, symbol) {
    var amt = parseInt(amount, 10);
    if (isNaN(amt)) amt = 1;
    this._method = 'counter';
    this._single.counter = {
      column: column,
      amount: amt,
      symbol: (symbol || '+')
    };
    return this;
  },

  // Helper to get or set the "boolFlag" value.
  _bool: function(val) {
    if (arguments.length === 1) {
      this._boolFlag = val;
      return this;
    }
    var ret = this._boolFlag;
    this._boolFlag = 'and';
    return ret;
  },

  // Helper to get or set the "notFlag" value.
  _not: function(val) {
    if (arguments.length === 1) {
      this._notFlag = val;
      return this;
    }
    var ret = this._notFlag;
    this._notFlag = false;
    return ret;
  }
});

Object.defineProperty(Builder.prototype, 'or', {
  get: function () {
    return this._bool('or');
  }
});

Object.defineProperty(Builder.prototype, 'not', {
  get: function () {
    return this._not(true);
  }
});

Builder.prototype.select      = Builder.prototype.columns;
Builder.prototype.column      = Builder.prototype.columns;
Builder.prototype.andWhereNot = Builder.prototype.whereNot;
Builder.prototype.andWhere    = Builder.prototype.where;
Builder.prototype.andWhereRaw = Builder.prototype.whereRaw;
Builder.prototype.andHaving   = Builder.prototype.having;
Builder.prototype.from        = Builder.prototype.table;
Builder.prototype.into        = Builder.prototype.table;
Builder.prototype.del         = Builder.prototype.delete;

Builder.prototype.queryCompiler = function (queryBuilder) {
  return new QueryCompiler(queryBuilder);
};

function assert(cond, msg) {
  if (! cond) throw new Error(msg);
}
function normalizeArr() {
  var args = new Array(arguments.length);
  for (var i = 0; i < args.length; i++) {
    args[i] = arguments[i];
  }
  if (Array.isArray(args[0])) {
    return args[0];
  }
  return args;
}

// XXX this is a place-holder for Raw, it is not implemented
function Raw () {};



// =============== QueryCompiler ================
function QueryCompiler(builder) {
  this.method      = builder._method || 'select';
  this.options     = builder._options;
  this.single      = builder._single;
  this.grouped     = _.groupBy(builder._statements, 'grouping');
}

var components = [
  'columns', 'where', 'order', 'limit', 'offset',
  // XXX not implemeneted 'join', 'union', 'group', 'having', 'lock'
];

_.extend(QueryCompiler.prototype, {

  // Should return an object with selector, modifier and options
  toMongoQuery: function(method) {
    method = method || this.method;
    return this[method]();
  },

  // Compiles the `select` statement, or nested sub-selects
  // by calling each of the component compilers, trimming out
  // the empties, and returning a generated query string.
  select: function() {
    var i = -1, combined = {};
    while (++i < components.length) {
      _.extend(combined, this[components[i]](this));
    }
    return _.extend({
      collection: this.single.table,
      method: 'find'
    }, combined);
  },

  // Compiles an "insert" query, allowing for multiple
  // inserts using a single query statement.
  insert: function() {
    const table = this.single.table;
    const data = this.single.insert;
    if (Array.isArray(data)) {
      throw new Error(`Inserting multiple values is not currently supporting by the client-side knex-minimongo`);
    }

    return {
      collection: table,
      method: 'insert',
      modifier: data
    };
  },

  // Compiles the "update" query.
  update: function() {
    const table = this.single.table;
    const modifier = this.single.update;
    const {selector} = this.where(this);

    return {
      collection: table,
      method: 'update',
      selector: selector,
      modifier: modifier
    };
  },

  del: function () {
    const table = this.single.table;
    const {selector} = this.where(this);

    return {
      collection: table,
      method: 'remove',
      selector: selector
    };
  },

  // compiles columns to projection
  columns: function() {
    const columns = this.grouped.columns || [];
    const projection = {};

    columns.forEach(columnGroup =>
      columnGroup.value.forEach(column =>
        projection[column] = 1));

    return {projection};
  },


  limit: function() {
    var noLimit = !this.single.limit && this.single.limit !== 0;
    if (noLimit) return {};
    return {limit: this.single.limit};
  },

  offset: function() {
    if (!this.single.offset) return {};
    return {skip: this.single.offset};
  },

  // Compile the "counter".
  counter: function() {
    const counter = this.single.counter;
    const incUnsigned = counter.amount;
    const incSigned = counter.symbol === "+" ? incUnsigned : -incUnsigned;

    const ret = {
      collection: this.single.table,
      method: 'update',
      selector: this.where(this).selector,
      modifier: {
        $inc: {[counter.column]: incSigned}
      }
    };

    console.log(ret);

    return ret;
  },

  order: function () {
    const orders = this.grouped.order || [];
    const sort = [];

    orders.forEach(({value, direction}) =>
      sort.push([value, (direction || 'asc').toLowerCase()])
    );

    return {
      sort
    };
  },

  // Where Clause
  // ------

  where: function() {
    const wheres = this.grouped.where || [];
    const parts = [];
    let logicalBool = null;
    let selector = null;

    wheres.forEach((whereGroup, i) => {
      const {bool, type, column, operator, value} = whereGroup;

      if (i) {
        if (logicalBool && logicalBool !== bool) {
          throw new Error(`Ambiguous and/or WHERE clause`);
        }
        logicalBool = bool;
      }

      switch (type) {
        case 'whereBasic':
          parts.push({
            [column]: compileSubselector(operator, value)
          });
          break;
        case 'whereWrapped':
          const builder = new QueryBuilder();
          value.call(builder);
          const subSelector = builder.toMongoQuery().selector;
          parts.push(subSelector);
          break;
        default:
          throw new Error(`Unsupported where type '${type}'`);
      }
    });

    logicalBool = logicalBool || 'and';
    if (logicalBool === 'or') {
      selector = {
        $or: parts.map(convertEq)
      };
    } else if (logicalBool === 'and') {
      // { field: { $gt: [2, 3] , ...}, ... }
      const opsTable = {};
      const $and = [];
      const $ors = [];

      // each part looks like { field: { $gt: 2, $lt: 1 } }
      parts.forEach((subsel) => {
        const subselKeys = Object.keys(subsel);
        subselKeys.forEach((key) => {
          if (key === '$and') {
            $and.push(...subsel[key].map(convertEq));
            return;
          }
          if (key === '$or') {
            $ors.push(subsel[key].map(convertEq));
            return;
          }

          const table = (opsTable[key] = opsTable[key] || {});
          const ops = subsel[key];

          // each op looks $gt or $lt, etc
          Object.keys(ops).forEach((op) => {
            table[op] = table[op] || [];
            table[op].push(ops[op]);
          });
        });
      });

      // merge multiple rules on the same path
      // {x: {$gt: 2}} + {x: {$gt: 3}} -> {$and: [{x: ...}, {x: ...}]}
      selector = {};
      const keys = Object.keys(opsTable);

      keys.forEach((key) => {
        const table = opsTable[key];
        const subsel = (selector[key] = {});
        const all$ands = Object.keys(table).some((op) => {
          const pieces = table[op];
          if (op === '$eq') {
            // if there are other selectors on this key in addition to
            // this $eq or there are other $eqs
            return (Object.keys(table).length > 1 || pieces.length > 1);
          }
          return pieces.length > 1;
        });

        Object.keys(table).forEach((op) => {
          const pieces = table[op];

          // $eq has a special treatment as Minimongo doesn't support
          // $eq yet and we need to use a simple matching: {x: 1}
          // instead of {x: $eq}
          if (op === '$eq') {
            if (all$ands) {
              $and.push(...pieces.map(piece => ({[key]: piece})));
            } else {
              selector[key] = pieces[0];
            }
            return;
          }

          if (all$ands) {
            $and.push(...pieces.map(piece => ({[key]: {[op]: piece}})));
          } else {
            subsel[op] = pieces[0];
          }
        });

        if (_.isObject(selector[key]) && _.isEmpty(selector[key])) {
          delete selector[key];
        }
      });

      if ($and.length > 0) {
        selector.$and = $and;
      }
      if ($ors.length > 0) {
        if ($ors.length === 1) {
          selector.$or = $ors[0];
        } else {
          selector = {
            $and: [
              selector,
              ...$ors.map($or => ({$or}))
            ]
          };

          if (_.isEmpty(selector.$and[0])) {
            // in case the original selector was empty
            selector.$and.shift();
          }
        }
      }
    }

    return {selector};

    function convertEq (sel) {
      const newSel = {};
      Object.keys(sel).forEach(key => {
        const subsel = sel[key];
        if (Object.keys(subsel).length === 1 && _.has(subsel, '$eq'))
          newSel[key] = subsel.$eq;
        else
          newSel[key] = subsel;
      });

      return newSel;
    }

    function compileSubselector(operator, value) {
      const table = {
        '=': '$eq',
        '<>': '$ne',
        '<': '$lt',
        '<=': '$lte',
        '>': '$gt',
        '>=': '$gte'
        // XXX 'in': '$in'?
      };
      const op = table[operator];

      if (! op) throw new Error(`Unsupported comparison operator '${operator}'`);

      return { [op]: value };
    }
  },

  whereIn: function(statement) {
    throw new Error();
  },

  multiWhereIn: function(statement) {
    throw new Error();
  },

  whereNull: function(statement) {
    throw new Error();
  },

  whereExists: function(statement) {
    throw new Error();
  },

  whereWrapped: function(statement) {
    throw new Error();
  },

  whereBetween: function(statement) {
    throw new Error();
  },

  // Determines whether to add a "not" prefix to the where clause.
  _not: function(statement, str) {
    throw new Error();
  }
});

QueryCompiler.prototype.first = QueryCompiler.prototype.select;

// Get the table name, wrapping it if necessary.
// Implemented as a property to prevent ordering issues as described in #704.
Object.defineProperty(QueryCompiler.prototype, 'tableName', {
  get: function() {
    if(!this._tableName) {
      // Only call this.formatter.wrap() the first time this property is accessed.
      this._tableName = this.single.table ? this.formatter.wrap(this.single.table) : '';
    }
    return this._tableName;
  }
});


Knex = function () { return knex; };
Knex.QueryBuilder = QueryBuilder;
Knex.QueryCompiler = QueryCompiler;
