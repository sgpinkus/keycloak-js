# KEYCLOCK-JS-SIMPLE
A simpler, less stateful, API compatibl-ish replacement for the official [keycloak-js][1] adapter. Only supports code authentication flow (since implicit is deprecated).

# INSTALLATION

```
npm i @sgpinkus/keycloak-js
```

# USAGE

```
import { Keycloak } from '@sgpinkus/keycloak-js';
const kc = new Keycloak({
  authServerUrl: 'http://localhost:8080',
  realm: 'testing',
  clientId: 'testing',
};
window.location.href = kc.getLoginUrl();
```

See [sample-app](./sample-app/index.html) for complete example.

[1]: https://www.keycloak.org/docs/latest/securing_apps/index.html#_javascript_adapter
