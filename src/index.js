import { Accounts } from 'apollo-accounts';
import knex from 'knex';
import { trim } from 'lodash';

// TODO Configure table and column names
export default class extends Accounts {
  constructor(knexConfig, options = {}) {
    super();
    this.knex = knex(knexConfig);
    this.options = options;
    this.createTable();
  }
  setupAccountTable(table) {
    table.timestamps();
    table.increments('id');
    // Because users have the option of registering or logging with their username and/or email
    // we can't extract a single unique identifier like we do from passport's `profile` field
    // passed to the strategy callback to be used in our queries. To avoid adding a "secondary"
    // identifier column to the `account-services` table, an optional `username` field instead
    // to 'accounts'.
    table.string('username').unique();
    table.index('username');
  }
  setupEmailTable(table) {
    table.integer('accountId', 11).unsigned().references('id').inTable('accounts');
    table.string('email').unique();
    table.index('email');
  }
  setupServiceTable(table) {
    table.integer('accountId', 11).unsigned().references('id').inTable('accounts');
    // TODO Do foreign keys get automatically indexed?
    // table.index('accountId');
    // This is a unique identifier from the 3rd party service which can be used to find a user in
    // our local database. Usually this field comes from `profile.id`.
    table.string('identifier');
    table.string('service');
    table.json('profile');
  }
  // TODO Cascade on delete and update
  createTable() {
    Promise.all([
      // This is the user's primary table, it provides their user id and optionally a username
      this.knex.schema.createTableIfNotExists('accounts', (table) => {
        this.setupAccountTable(table);
      }),
      // Multiple emails can be associated with an account (I guess for security purposes?)
      this.knex.schema.createTableIfNotExists('account-emails', (table) => {
        // eslint-disable-next-line max-len
        // TODO Should the email table only be created if emails are enabled in the Account's config?
        // P.S. >:( airbnb eslint max line length config.
        this.setupEmailTable(table);
      }),
      this.knex.schema.createTableIfNotExists('account-services', (table) => {
        this.setupServiceTable(table);
      }),
    ]);
  }
  createUser({ username, email, service, identifier, profile }) {
    // TODO Add validations
    const usernameClean = username && trim(username);
    const emailClean = email && trim(email);
    let accountId;
    return this.knex.transaction(trx => {
      // const userInsert = usernameClean ?
      this.knex.insert({ username: usernameClean })
          .into('accounts')
          .transacting(trx)
          .then(ids => {
            accountId = ids[0];
            return Promise.resolve()
              .then(() =>
                emailClean && trx.insert({ accountId, email: emailClean }).into('account-emails'))
              .then(() =>
                trx.insert({
                  identifier: identifier || accountId, accountId, service, profile,
                }).into('account-services')
              );
          })
          .then(trx.commit)
          .catch(trx.rollback);
    }).then(ids => ids[0]);
  }
  findIdByUsername(username) {
    return this.knex('accounts').first('id').where({
      username,
    }).then(row => row && row.id);
  }
  findIdByEmail(email) {
    return this.knex('account-emails').first('accountId').where({
      email,
    }).then(row => row && row.accountId);
  }
  findIdByService(service, identifier) {
    return this.knex('account-services')
      .first('accountId')
      .where({
        service,
        identifier,
      }).then(row => row && row.accountId);
  }
  findService(accountId, identifier) {
    return this.knex('account-services')
      .first('accountId', 'identifier', 'service', 'profile')
      .where({
        accountId,
        identifier,
      }).then(row => row);
  }
  findById(id) {
    return this.knex('accounts')
      .first('username')
      .where({ id })
      .then(row => row);
  }
}
