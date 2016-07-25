/* eslint-disable no-unused-expressions */

import knexConfig from './knex';
import Accounts from '../src/';
import knexCleaner from 'knex-cleaner';
import { expect } from 'chai';

describe('Accounts', () => {
  let accounts;
  before((done) => {
    accounts = new Accounts(knexConfig);
    knexCleaner.clean(accounts.knex, { mode: 'delete' }).then(() => {
      done();
    });
  });
  after((done) => {
    knexCleaner.clean(accounts.knex, { mode: 'delete' }).then(() => {
      done();
    });
  });
  describe('createUser', () => {
    it('creates a user locally', done => {
      accounts.createUser({
        username: 'user1',
        email: 'user1@user.com',
        service: 'local',
        profile: 'profile',
      }).then(accountId => {
        expect(accountId).to.equal(1);
        Promise.all([
          accounts.knex('account-services')
            .first('service', 'identifier', 'profile')
            .where({ accountId })
            .then(result => {
              expect(result.service).to.equal('local');
              expect(result.profile).to.equal('profile');
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
        service: 'local',
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
        service: 'local',
        profile: 'profile',
      }).catch(err => {
        expect(err).to.be.ok;
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
      accounts.findIdByUsername('user2').then((id) => {
        expect(id).to.be.undefined;
        done();
      });
    });
  });
  describe('findIdByEmail', () => {
    it('finds user id', done => {
      accounts.findIdByEmail('user1@user.com').then(id => {
        expect(id).to.equal(1);
        done();
      });
    });
    it('does not find a user id', done => {
      accounts.findIdByEmail('user2@user.com').then((id) => {
        expect(id).to.be.undefined;
        done();
      });
    });
  });
});
