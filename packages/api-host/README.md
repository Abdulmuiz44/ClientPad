# ClientPad API Host

This package is the Netlify deploy target for `api.clientpad.xyz`.

It combines:

- `@clientpad/cloud` at `/api/cloud/v1`
- `@clientpad/server` at `/api/public/v1`

The function is deploy-only and is not published to npm.

Required runtime environment:

- `DATABASE_URL`
- `API_KEY_PEPPER`
- `CLIENTPAD_CLOUD_ADMIN_TOKEN`

The root response returns a small JSON description of the available API surfaces.
