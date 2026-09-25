/**
 * Demo of parsing and validating JWT by resource server. Needs a Keycloak server running on.
 */
import assert from 'node:assert';
import { type ValidationContext, Token, validateTokenWithContext } from './validate';


const keycloakConfig = {
  realm: 'testing',
  authServerUrl: 'http://localhost:3002/',
  sslRequired: 'external',
  clientId: 'testing',
};


async function main() {
  console.log(process.argv);
  const context: ValidationContext = {
    authServerUrl: keycloakConfig.authServerUrl,
    clientId: keycloakConfig.clientId,
    realm: keycloakConfig.realm,
    expectedType: 'Bearer',
    requiredTokenAudience: 'account',
  };
  assert(process.argv.length > 2);
  const token = new Token(process.argv[2]);
  console.log(token);
  console.dir(await validateTokenWithContext(token, context));
}

main()
  .then(() => process.exit())
  .catch(e => { console.error(e); process.exit(); });
