import Knex from 'knex';
import mockDb from 'mock-knex';
import knexConfig from './knex';
import Accounts from '../src/';
import knexCleaner from 'knex-cleaner';
import { expect } from 'chai';

const knex = Knex(knexConfig);
// mockDb.mock(knex);

describe('Accounts', () => {
  const accounts = new Accounts(knexConfig);
  after((done) => {
    knexCleaner.clean(accounts.knex).then(() => {
      done();
    });
  });
  it('creates a user', done => {
    accounts.createUser({ username: 'user1' }, 'local').then(result => {
      expect(result).to.have.length(1);
      done();
    });
  });
  it('only create users with unique usernames', done => {
    accounts.createUser({ username: 'user1' }, 'local').catch(err => {
      expect(err).to.be.ok;
      done();
    });
  });
});
