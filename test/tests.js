/* eslint-disable no-unused-expressions */

import knexConfig from './knex';
import Accounts from '../src/';
import knexCleaner from 'knex-cleaner';
import { expect } from 'chai';
import initKnex from 'knex';

describe('Accounts', () => {
  const knex = initKnex(knexConfig);
  let accounts;
  before((done) => {
    accounts = new Accounts(knex);
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
  describe('findService', () => {
    it('finds a service', done => {
      accounts.findService(1, 1).then(service => {
        expect(service.accountId).to.equal(1);
        expect(service.identifier).to.equal('1');
        expect(service.service).to.equal('local');
        expect(service.profile).to.equal(JSON.stringify('profile'));
        done();
      });
    });
    it('does not find a service for which does not exist', done => {
      accounts.findService(2, 2).then(service => {
        expect(service).to.be.undefined;
        done();
      });
    });
  });
  describe('findIdByService', () => {
    it('finds account id given a service', done => {
      accounts.findIdByService('local', '1').then(accountId => {
        expect(accountId).to.be.equal(1);
        done();
      });
    });
    it('does not find an account id given a service which does not exist', done => {
      accounts.findIdByService('local', '2').then(accountId => {
        expect(accountId).to.be.undefined;
        done();
      });
    });
  });
  describe('findById', () => {
    it('finds a user given an id', done => {
      accounts.findById(1).then(user => {
        expect(user.username).to.be.equal('user1');
        done();
      });
    });
    it('does not find a user given an id which does not exist', done => {
      accounts.findById(2).then(user => {
        expect(user).to.be.undefined;
        done();
      });
    });
  });
  describe('findForSession', () => {
    it('finds a user to be set for the passport session', done => {
      accounts.findForSession(1, 1).then(user => {
        expect(user.username).to.equal('user1');
        expect(user.profile).to.equal('profile');
        done();
      });
    });
  });
});
