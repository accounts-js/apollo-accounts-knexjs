import knexConfig from './knex';
import Accounts from '../src/';
import knexCleaner from 'knex-cleaner';
import { expect } from 'chai';


describe('Accounts', () => {
  let accounts;
  before(() => {
    accounts = new Accounts(knexConfig);
  });
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
  describe('findIdByUsername', () => {
    it('finds user id', done => {
      accounts.findIdByUsername('user1').then(id => {
        expect(id).to.equal(1);
        done();
      });
    });
    it('does not find a user id', done => {
      accounts.findIdByUsername('user2').then(id => {
        expect(id).to.be.undefined; // eslint-disable-line no-unused-expressions
        done();
      });
    });
  });
});
