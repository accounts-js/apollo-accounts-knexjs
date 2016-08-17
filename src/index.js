import { Accounts } from 'apollo-accounts-server';
import { trim } from 'lodash';

export default class extends Accounts {
  constructor(knex, options = {}) {
    super();
    this.knex = knex;
    // TODO Configurable table and column names
    this.options = options;
    this.createTable();
  }
  setupAccountTable(table) {
    table.timestamps();
    table.increments('id');
    table.string('username').unique();
    table.index('username');
  }
  setupEmailTable(table) {
    table.integer('accountId', 11).unsigned().references('id').inTable('accounts');
    table.string('email').unique();
    table.index('email');
  }
  setupProvidersTable(table) {
    table.integer('accountId', 11).unsigned().references('id').inTable('accounts');
    table.string('provider');
    table.string('identifier');
    table.json('profile');
  }
  setupHashesTable(table) {
    table.integer('accountId', 11).unsigned().references('id').inTable('accounts');
    table.string('hash');
  }
  // TODO Cascade on delete and update
  createTable() {
    Promise.all([
      // This is the user's primary table, it provides their user id and username
      this.knex.schema.createTableIfNotExists('accounts', (table) => {
        this.setupAccountTable(table);
      }),
      // Multiple emails can be associated with an account
      this.knex.schema.createTableIfNotExists('account-emails', (table) => {
        // eslint-disable-next-line max-len
        // TODO Should the email table only be created if emails are enabled in the Account's config?
        // P.S. >:( airbnb eslint max line length config.
        this.setupEmailTable(table);
      }),
      this.knex.schema.createTableIfNotExists('account-providers', (table) => {
        this.setupProvidersTable(table);
      }),
      this.knex.schema.createTableIfNotExists('account-hashes', (table) => {
        this.setupHashesTable(table);
      }),
    ]);
  }
  createUser({ username, email, provider, identifier, profile, hash }) {
    // TODO Add validations
    const usernameClean = username && trim(username);
    const emailClean = email && trim(email);
    let accountId;
    return this.knex.transaction(trx => {
      this.knex.insert({ username: usernameClean })
          .into('accounts')
          .transacting(trx)
          .then(ids => {
            accountId = ids[0];
            return Promise.resolve()
              .then(() =>
                emailClean && trx.insert({ accountId, email: emailClean }).into('account-emails'))
              .then(() => {
                let toReturn;
                if (provider) {
                  toReturn = trx.insert({
                    accountId,
                    provider,
                    identifier: identifier || accountId,
                    profile: JSON.stringify(profile),
                  }).into('account-providers');
                } else {
                  toReturn = trx.insert({
                    accountId,
                    hash,
                  }).into('account-hashes');
                }
                return toReturn;
              });
          })
          .then(trx.commit)
          .catch(trx.rollback);
    }).then(() => accountId);
  }
  findByUsername(username) {
    return this.knex('accounts').first('id').where({
      username,
    }).then(row => row && row.id);
  }
  findByEmail(email) {
    return this.knex('account-emails').first('accountId').where({
      email,
    }).then(row => row && row.accountId);
  }
  findByProvider(provider, identifier) {
    return this.knex('account-providers')
      .first('accountId')
      .where({
        provider,
        identifier,
      }).then(row => row && row.accountId);
  }
  findHashById(accountId) {
    return this.knex('account-hashes')
      .first('hash')
      .where({
        accountId,
      }).then(row => row && row.hash);
  }
}
