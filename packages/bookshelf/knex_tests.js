Tinytest.add('knex - sql to mongo', (test) => {
  function t (query, ans, desc) {
    const res = query.toMongoQuery();
    Object.keys(ans).forEach((prop) => {
      test.equal(res[prop], ans[prop], desc + ' -- ' + prop);
    });
  }

  const knex = Knex();

  t(
    knex('table'),
    {
      method: 'find',
      collection: 'table',
      selector: {},
      projection: {}
    },
    'simple find all'
  );

  t(
    knex('table').select('field_a', 'field_b'),
    {
      method: 'find',
      collection: 'table',
      selector: {},
      projection: {
        field_a: 1,
        field_b: 1
      }
    },
    'select columns'
  );

  t(
    knex('table').where('field_a', 'some value'),
    {
      method: 'find',
      collection: 'table',
      selector: {
        field_a: 'some value'
      },
      projection: {}
    },
    'equality where'
  );

  t(
    knex('table').where('field_a', '>', 2).where('field_b', '<=', 123),
    {
      method: 'find',
      collection: 'table',
      selector: {
        field_a: { $gt: 2 },
        field_b: { $lte: 123 }
      },
      projection: {}
    },
    'numeric comparisons in WHERE'
  );


  t(
    knex('table').where('field_a', '>', 2).where('field_a', '<=', 123).where('field_a', '<>', 5),
    {
      method: 'find',
      collection: 'table',
      selector: {
        field_a: { $gt: 2, $lte: 123, $ne: 5 }
      },
      projection: {}
    },
    'numeric comparisons in WHERE for the same column'
  );

  t(
    knex('people').select('first_name').select('last_name').where('age', '>', 18),
    {
      method: 'find',
      collection: 'people',
      selector: {
        age: { $gt: 18 }
      },
      projection: {
        first_name: 1,
        last_name: 1
      }
    },
    'selects and wheres'
  );

  t(
    knex('table').where({
      x: 1,
      y: 2
    }),
    {
      selector: {
        x: 1,
        y: 2
      }
    },
    'where with object'
  );

  t(
    knex('table').where('x', 1).orWhere('x', 3),
    {
      selector: {
        $or: [{x: 1}, {x: 3}]
      }
    }
  );

  test.throws(() =>
    knex('t').where('x', '1').orWhere('y', '2').andWhere('z', 3).toMongoQuery(),
    /Ambiguous .* WHERE/);

  t(
    knex('t').where('a', '>', 1).where('a', '>', 2),
    {
      selector: {
        $and: [
          {a: {$gt: 1}},
          {a: {$gt: 2}}
        ]
      }
    },
    'multiple conditions with the same operator on the same field'
  );

  t(
    knex('t').where(function () {
      this.where('id', 1).andWhere('x', '>', 5);
    }).orWhere(function () {
      this.where('id', 2).andWhere('x', '<', 0);
    }),
    {
      selector: {
        $or: [
          {id: 1, x: {$gt: 5}},
          {id: 2, x: {$lt: 0}}
        ]
      }
    },
    'nested or/and where'
  );

  t(
    knex('t').where(function () {
      this.where('id', 1).orWhere('x', '>', 5);
    }).andWhere(function () {
      this.where('id', 2).orWhere('x', '<', 0);
    }),
    {
      selector: {
        $and: [
          {$or: [{id: 1}, {x: {$gt: 5}}]},
          {$or: [{id: 2}, {x: {$lt: 0}}]}
        ]
      }
    },
    'nested and/or where'
  );

  t(
    knex('t').where('id', 1).where('id', 2),
    {
      selector: {
        $and: [
          {id: 1},
          {id: 2}
        ]
      }
    },
    'matching against multiple things'
  );

  t(
    knex('t').where('id', 1).where('id', '<', 2),
    {
      selector: {
        $and: [
          {id: 1},
          {id: {$lt: 2}}
        ]
      }
    },
    'matching against multiple things'
  );

  t(
    knex('t').orderBy('c'),
    {
      sort: [['c', 'asc']]
    },
    'basic sort order'
  );

  t(
    knex('t').orderBy('c').orderBy('d', 'desc').limit(3).offset(1),
    {
      sort: [['c', 'asc'], ['d', 'desc']],
      limit: 3,
      skip: 1
    },
    'basic sort order with limit and offset'
  );
});
