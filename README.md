# KEYCLOCK-JS-SIMPLE
This is a replacement for [keycloak-js][1], but simpler:

  - Use Typescript, modern classes and promises.
  - Less features:
    - hybrid and implicit flow dropped - only code (AKA "standard") supported.
    - no automatic login redirect or authentication - do it yourself.
  - No stateful Keycloak instance and its complex states (there is still a stateful Keycloak instance but it's (mostly?) immutable).

# SYNOPSIS
See [sample-app](./sample-app/index.html).

[1]: https://www.keycloak.org/docs/latest/securing_apps/index.html#_javascript_adapter
