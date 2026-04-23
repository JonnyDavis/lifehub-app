# Status (Now / Next / Later)

This file is intentionally short; it’s meant to keep “what’s happening” current between context windows.

## Now

- Run a final prod verification pass for the mobile-readiness branch (especially iPhone Safari + two-account workspace sharing flows).
- Hand the app to a real user and collect friction notes from day-to-day use.
- Merge the mobile-readiness branch once that verification pass feels solid.

## Next

- Household naming + basic profile fields.
- Refine auth UX where real usage shows friction (for example reset-password and invite/join flow clarity).
- Add a recovery path for failed/expired signup confirmation links (for example resend confirmation for unconfirmed accounts).
- Add basic test coverage around auth and core CRUD flows.
- Rework the workspace model so each user keeps a permanent personal workspace and shared workspaces are created explicitly for collaboration.

## Later

- Richer list UX (inline editing, ordering, and any mobile improvements that real usage proves necessary).
- Roles/permissions inside shared workspaces.
- Revisit the longer-term mobile path (responsive web vs PWA vs dedicated app) once real usage data is available.
- Public demo mode with tightly scoped anon read access.
