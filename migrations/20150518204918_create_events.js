
exports.up = function(knex, Promise) {
  return knex.schema.createTable('events', function (table) {
    table.increments();
    table.uuid('uuid').notNullable();
    table.string('resource_type').notNullable();
    table.string('event_name').notNullable();
    table.integer('value').notNullable();
    table.string('period').notNullable();
    table.dateTime('start_date').notNullable();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('events');
};
