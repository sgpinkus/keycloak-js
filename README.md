# KEYCLOCK-JS-SIMPLE
A simpler, less stateful, API compatibl-ish replacement for the official [keycloak-js][1] adapter. Only supports code authentication flow (since implicit is deprecated).

# INSTALLATION

```
npm i @sgpinkus/keycloak-js
```

# USAGE

```javascript
import { Keycloak } from '@sgpinkus/keycloak-js';
const kc = new Keycloak({
  authServerUrl: 'http://localhost:8080',
  realm: 'testing',
  clientId: 'testing',
};

// Is this a OAuth callback?
const response = await kc.processCodeFlowCallbackUrl(window.location.href);
if(!response) {
  console.debug('Not an OAuth response');
  // Forcing a login.
  window.location.href = kc.getLoginUrl();
} else {
  setMyTokens(response);
}

// Do your own work to verify and manage token. Resource servers receiving token must validate ...
function setMyTokens(tokens) {
  const { iatLocal } = tokens;
  const { exp, iat } = tokens.accessTokenParsed;
  const skew = iat - iatLocal;
  const now = Math.floor(new Date().getTime()/1000);
  const refreshAt = exp - iat - skew;
  if(refreshAt <= 0) {
    console.error(`Token expired [now=${now}, exp=${exp}, iat=${iat}]`);
    clearMyTokens();
    return;
  }
  if(skew) {
    console.warn(`Auth server is ${skew} seconds in front of local`);
  }
  stashMyTokens(tokens); // Use later in call to remote resource servers.
  console.log(`Setting refresh for ${refreshAt} seconds from now`)
  clearTimeout(refreshTimerId);
  refreshTimerId = setTimeout(() => refreshMyTokens(), refreshAt*1000);
}

```

See [sample-app](./sample-app/index.html) for complete example.

[1]: https://www.keycloak.org/docs/latest/securing_apps/index.html#_javascript_adapter
