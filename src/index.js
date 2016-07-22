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
        // TODO This relation should be between ids, not usernames.
        table.string('account').references('username').inTable('accounts');
        table.string('service');
        table.json('profile').notNullable();
      }),
    ]);
  }
  findUser({ username }) {
    return this.knex('accounts').where({
      username,
    }).innerJoin('account-services', 'accounts.username', 'account-services.account');
  }
  createUser(args, service) {
    const { username, password } = args;
    const usernameTrimmed = trim(username);
    let userId;
    const hash = this.hashPassword(password);
    const profile = JSON.stringify({
      userId,
      hash,
    });
    return this.knex.transaction(transaction =>
      Promise.resolve()
        .then(() => transaction.insert({
          username: usernameTrimmed,
        }).into('accounts').then(id => {
          userId = id;
        }))
       .then(() => transaction.insert({
         account: usernameTrimmed,
         service,
         profile,
       }).into('account-services'))
    );
  }
}
