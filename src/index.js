import { Accounts } from 'apollo-accounts';
import knex from 'knex';
import { trim } from 'lodash';

export default class extends Accounts {
  constructor(knexConfig, options = {}) {
    super();
    this.knex = knex(knexConfig);
    this.options = options;
    this.createTable();
  }
  createTable() {
    Promise.all([
      this.knex.schema.createTableIfNotExists('accounts', (table) => {
        table.timestamps();
        table.increments('id');
        table.string('username').unique().notNullable();
      }),
      this.knex.schema.createTableIfNotExists('account-services', (table) => {
        table.timestamps();
        table.increments('id');
        table.string('accountId').references('id').inTable('accounts');
        table.string('service').notNullable();
        // table.json('profile').notNullable();
      }),
    ]);
  }
  findUser(args) {
  }
  createUser(args, service, profile) {
    let { username } = args;
    username = trim(username);
    let accountId;
    return this.knex.transaction(transaction =>
      Promise.resolve()
        .then(() => transaction.insert({
          username,
        }).into('accounts').then(id => {
          accountId = id;
        }))
       .then(() => transaction.insert({
         accountId,
         service,
       }).into('account-services'))
    );
  }
}
