# @workingcuriosity/piece-sekalum

Sekalum Consumer API integration for Activepieces.

Version `0.1.0` provides two actions:

- `discover_credentials`
- `resolve_credential_safely`

## Requirements

- Activepieces release `0.82.0` or newer
- A reachable Sekalum Consumer API
- A Sekalum Consumer API token with the `credentials:consume` scope
- Consumer Grants for the credentials and fields the connection may use

## Configuration

Create a Sekalum connection in Activepieces with:

- **Consumer API base URL** — the base URL of your Sekalum instance
- **Consumer API token** — stored by Activepieces as `SecretText`

The piece uses the token only for `Authorization: Bearer` requests to the configured Sekalum Consumer API. It does not maintain its own credential catalog or secret store.

## Discover credentials

`discover_credentials` calls:

`GET /api/v1/consumer/credentials`

The action accepts only the public Consumer API discovery projection and preserves the opaque `credentialKey`. Sekalum remains authoritative for grants, lifecycle state and authorization.

## Resolve a credential safely

`resolve_credential_safely` accepts an opaque `credentialKey` and an explicit non-empty list of field names, then calls:

`POST /api/v1/consumer/credentials/{credentialKey}/resolve`

Only explicitly requested fields are consumed. Wildcards and duplicate field names are rejected. Resolved values are not returned as action output, persisted by the piece, logged, cached or sent to telemetry.

Batch resolve is not exposed in version `0.1.0`.

## Security behavior

The piece is fail-closed. Canonical public Consumer API errors are mapped to controlled action failures; malformed or unexpected responses are rejected without exposing server diagnostics, bearer tokens or resolved values.

Requests use `Cache-Control: no-store`, and the client requests `no-store` fetch behavior.

## Package

npm package: `@workingcuriosity/piece-sekalum`

Source repository: https://github.com/workingcuriosity/sekalum-activepieces

## License

MIT
