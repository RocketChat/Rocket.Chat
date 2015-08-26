const pg = Npm.require('pg');

const connectionUrl = process.env.POSTGRES_URL || 'postgres://127.0.0.1/postgres';

function runInFence(f) {
  if (Meteor.isClient) {
    throw new Error;
  }

  const fence = new DDPServer._WriteFence;
  DDPServer._CurrentWriteFence.withValue(fence, f);
  fence.armAndWait();
}

function queryWithWriteFenceTable(db, table) {
  const querySync = db.client.querySync.bind(db.client);
  return function (query, params) {
    const ret = querySync(query, params);
    const fence = DDPServer._CurrentWriteFence.get();
    if (fence) {
      db.appendPendingWrite(table, fence.beginWrite());
    }

    return ret;
  };
}

Tinytest.add('pg - polling-driver - basic', (test) => {
  const db = new PgLiveQuery({connectionUrl});
  const run = queryWithWriteFenceTable(db, 'employees');

  run('DROP TABLE IF EXISTS employees;');
  run('CREATE TABLE employees (id serial primary key, name text);');
  run('INSERT INTO employees(name) VALUES (\'slava\');');
  run('INSERT INTO employees(name) VALUES (\'sashko\');');

  const notifs = [];
  db.select('SELECT * FROM employees', [], {}, {
    added(newVal) {
      notifs.push(['added', newVal]);
    },
    changed(newVal, oldVal) {
      notifs.push(['changed', newVal, oldVal]);
    },
    removed(oldVal) {
      notifs.push(['removed', oldVal]);
    }
  });

  test.equal(notifs.shift(), ['added', {id: 1, name: 'slava'}]);
  test.equal(notifs.shift(), ['added', {id: 2, name: 'sashko'}]);

  runInFence(function () {
    run('UPDATE employees SET name=\'avital\' where id=2');
  });
  test.equal(notifs.shift(), ['changed', {id: 2, name: 'avital'}, {id: 2, name: 'sashko'}]);

  db.stop();
});
