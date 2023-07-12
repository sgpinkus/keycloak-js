import { describe } from 'mocha';
import { expect } from 'chai';
import crypto from 'node:crypto';
import { Keycloak, MockStorage } from './index';
import { createUUID, generateCodeVerifier, generatePkceChallenge } from './utils';

const config = {
  authServerUrl: 'http://localhost:3001',
  realm: 'testing',
  clientId: 'testing',
  redirectUri: 'http://localhost:8080',
};

describe('Utils', function() {
  it('should give uuids', function() {
    expect(createUUID().length).equals(36);
    expect(createUUID()).not.equals(createUUID());
  });
  it('should give a PKCE code challenge', function() {
    const verifier = generateCodeVerifier();
    expect(verifier.length >= 96 && verifier.length < 128).is.true;
    const challengeNodeCrypto = crypto.createHash('sha256').update(verifier).digest('base64url');
    expect(challengeNodeCrypto === generatePkceChallenge('S256', verifier)).is.true;
  });
});

describe('Keycloak Instance', function() {
  it('should give an object that build keycloak oAuth URLs', function() {
    const kc = new Keycloak(config, new MockStorage());
    expect(kc.getRealmUrl()).equals('http://localhost:3001/realms/testing');
    const loginUrl = new URL('', kc.getLoginUrl());
    const loginUrlParams = Object.fromEntries(loginUrl.searchParams.entries());
    expect(loginUrlParams).has.all.keys('client_id',
      'redirect_uri',
      'state',
      'response_mode',
      'response_type',
      'scope',
      'nonce',
    );
    expect(kc.getLoginUrl()).to.match(RegExp(`^${kc.getRealmUrl()}`));
    expect(kc.getLogoutUrl()).to.match(RegExp(`^${kc.getRealmUrl()}/protocol`));
    expect(kc.getAccountUrl()).to.match(RegExp(`^${kc.getRealmUrl()}/account`));
    expect(kc.getRegisterUrl()).to.match(RegExp(`^${kc.getRealmUrl()}/protocol`));
  });
});