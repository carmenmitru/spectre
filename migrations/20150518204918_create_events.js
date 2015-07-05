
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('trackers', function (table) {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
      table.string('description');
      table.json('config');
    }),
    knex.schema.createTable('events', function (table) {
      table.increments('id').primary();
      table.integer('tracker_id').notNullable();
      table.foreign('tracker_id')
        .references('id')
        .inTable('trackers');
      table.uuid('uuid').notNullable();
      table.string('resource_type').notNullable();
      table.string('event_name').notNullable();
      table.integer('value').notNullable();
      table.string('period').notNullable();
      table.dateTime('start_date').notNullable();
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('trackers'),
    knex.schema.dropTable('events')
  ]);
};
