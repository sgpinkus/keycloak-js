import { Keycloak } from '@sgpinkus/keycloak-js';
import { Token, validateTokenWithContext } from '@sgpinkus/keycloak-js/validate';

console.log('Frontend package loaded:', Keycloak);
console.log('Backend package loaded:', Token, validateTokenWithContext);
