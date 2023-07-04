import { Keycloak, MockStorage } from './index';
import { createUUID } from './utils';

const config = {
  authServerUrl: 'http://localhost:3001',
  realm: 'testing',
  clientId: 'testing',
  redirectUri: 'http://localhost:8080',
};

const kc = new Keycloak(config, new MockStorage());

console.log(`
${createUUID()}
${createUUID()}
${createUUID()}
`);
console.log(`
${kc.getRealmUrl()}
${kc.getLoginUrl()}
${kc.getLogoutUrl()}
${kc.getAccountUrl()}
${kc.getRegisterUrl()}
`);

