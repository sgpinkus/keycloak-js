/* eslint-disable @typescript-eslint/no-var-requires */
const { Keycloak } = require('@sgpinkus/keycloak-js');
const { Token, validateTokenWithContext } = require('@sgpinkus/keycloak-js/validate');

console.log('Frontend package loaded:', Keycloak);
console.log('Backend package loaded:', Token, validateTokenWithContext);
