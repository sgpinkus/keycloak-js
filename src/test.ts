import { Keycloak } from '.';

const config = {
  authServerUrl: 'http://localhost:3001',
  realm: 'testing',
  clientId: 'testing',
};

const kc = new Keycloak(config);

console.log(kc.getLoginUrl());
