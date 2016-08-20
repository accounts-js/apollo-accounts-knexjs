/* eslint-disable no-unused-expressions */

import knexCleaner from 'knex-cleaner';
import { expect } from 'chai';
import initKnex from 'knex';

import knexConfig from './knex';
import Accounts from '../src/';

describe('Accounts', () => {
  const knex = initKnex(knexConfig);
  let accounts;
  before((done) => {
    accounts = new Accounts({}, knex);
    knexCleaner.clean(knex, { mode: 'delete' }).then(() => {
      done();
    });
  });
  after((done) => {
    knexCleaner.clean(knex, { mode: 'delete' }).then(() => {
      done();
    });
  });
  describe('createUser', () => {
    it('creates a user', done => {
      accounts.createUser({
        username: 'user1',
        email: 'user1@user.com',
        provider: 'local',
        profile: 'profile',
      }).then(accountId => {
        expect(accountId).to.equal(1);
        Promise.all([
          accounts.knex('account-providers')
            .first('provider', 'identifier', 'profile')
            .where({ accountId })
            .then(result => {
              expect(result.provider).to.equal('local');
              expect(result.profile).to.equal(JSON.stringify('profile'));
            }),
          accounts.knex('account-emails')
            .first('email')
            .where({ accountId })
            .then(result => {
              expect(result.email).to.equal('user1@user.com');
            }),
        ]).then(() => done());
      });
    });
    it('requires unique usernames', done => {
      accounts.createUser({
        username: 'user1',
        email: 'user1@user.com',
        provider: 'local',
        profile: 'profile',
      }).catch(err => {
        expect(err).to.be.ok;
        done();
      });
    });
    it('requires unique emails', done => {
      accounts.createUser({
        username: 'user2',
        email: 'user1@user.com',
        provider: 'local',
        profile: 'profile',
      }).catch(err => {
        expect(err).to.be.ok;
        done();
      });
    });
  });
  describe('findByUsername', () => {
    it('finds user id', done => {
      accounts.findByUsername('user1').then(id => {
        expect(id).to.equal(1);
        done();
      });
    });
    it('does not find a user id', done => {
      accounts.findByUsername('user2').then((id) => {
        expect(id).to.be.undefined;
        done();
      });
    });
  });
  describe('findByEmail', () => {
    it('finds user id', done => {
      accounts.findByEmail('user1@user.com').then(id => {
        expect(id).to.equal(1);
        done();
      });
    });
    it('does not find a user id', done => {
      accounts.findByEmail('user2@user.com').then((id) => {
        expect(id).to.be.undefined;
        done();
      });
    });
  });
  describe('findByProvider', () => {
    it('finds account id given a provider', done => {
      accounts.findByProvider('local', '1').then(accountId => {
        expect(accountId).to.be.equal(1);
        done();
      });
    });
    it('does not find an account id given a provider which does not exist', done => {
      accounts.findByProvider('local', '2').then(accountId => {
        expect(accountId).to.be.undefined;
        done();
      });
    });
  });
  describe('findHashById', () => {
    it('finds hash given user id', (done) => {
      accounts.registerUser({
        username: 'UserA',
        password: '123456',
      }).then(id => {
        accounts.findHashById(id)
          .then((hash) => {
            expect(hash).to.be.a.string;
            done();
          });
      });
    });
    it('does not find a hash given a user which does not exist', (done) => {
      accounts.findHashById(123)
          .then((hash) => {
            expect(hash).to.be.undefined;
            done();
          });
    });
  });
});
