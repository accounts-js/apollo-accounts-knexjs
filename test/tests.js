import knexConfig from './knex';
import Accounts from '../src/';
import knexCleaner from 'knex-cleaner';
import { expect } from 'chai';


describe('Accounts', () => {
  const accounts = new Accounts(knexConfig);
  after((done) => {
    knexCleaner.clean(accounts.knex).then(() => {
      done();
    });
  });
  describe('createUser', () => {
    it('creates a user', done => {
      accounts.createUser({ username: 'user1', password: '123456' }, 'local').then(result => {
        expect(result).to.have.length(1);
        done();
      });
    });
    it('only create users with unique usernames', done => {
      accounts.createUser({ username: 'user1', password: '123456' }, 'local').catch(err => {
        expect(err).to.be.ok; // eslint-disable-line no-unused-expressions
        done();
      });
    });
  });
  describe('findUser', () => {
    it('finds a user', done => {
      accounts.findUser({ username: 'user1' }).then(result => {
        expect(result).to.have.length(1);
        done();
      });
    });
    it('does not find a user', done => {
      accounts.findUser({ username: 'user2' }).then(result => {
        expect(result).to.have.length(0);
        done();
      });
    });
  });
});
