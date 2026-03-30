# iPhone Local Dev

This note captures the easiest way to test LifeHub on a real iPhone during local development, plus the most common auth/debugging gotcha.

## Run LifeHub on your local network

Start the Next dev server so it listens on your LAN, not just `localhost`:

```bash
pnpm dev --hostname 0.0.0.0
```

Then:

1. Make sure your Mac and iPhone are on the same Wi-Fi network.
2. Find your Mac's local IP address.
3. Open `http://<your-mac-ip>:3000` in Safari on the iPhone.

You can find the Mac IP in:

- System Settings -> Wi-Fi -> current network -> IP address
- or Terminal with:

```bash
ifconfig en0
```

Look for the `inet` value on `en0`.

## Enable Safari Web Inspector

This is the best way to debug the real phone browser from your Mac.

### On iPhone

1. Go to Settings -> Safari -> Advanced.
2. Turn on `Web Inspector`.

### On Mac Safari

1. Open Safari -> Settings -> Advanced.
2. Turn on `Show Develop menu in menu bar`.

### Connect and inspect

1. Connect the iPhone to the Mac and trust the device if prompted.
2. Open the local LifeHub page in Safari on the iPhone.
3. In Safari on the Mac, open `Develop`.
4. Select the iPhone, then select the open LifeHub page.

Useful tabs:

- `Network` for failed requests
- `Console` for browser/runtime errors
- `Elements` for checking real mobile layout

## Common auth failure on iPhone local dev

If the page loads on the iPhone but login fails with a browser error like `Load failed`, the most likely cause is that `NEXT_PUBLIC_SUPABASE_URL` is pointing at a local-only address such as `localhost` or `127.0.0.1`.

Why this happens:

- the Next app can be opened from the phone over your Mac's LAN IP
- but the browser Supabase client still uses `NEXT_PUBLIC_SUPABASE_URL`
- on the iPhone, `localhost` means the phone itself, not your Mac

In this repo, the browser client is created in `src/lib/supabase/client.ts`, so phone login depends on that env var being reachable from the phone.

## Make local Supabase reachable from iPhone

If you want local password login to work on the iPhone against your local Supabase instance:

1. Find your Mac's LAN IP address.
2. Update `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` so it uses that LAN IP instead of `127.0.0.1` or `localhost`.
3. Restart the Next dev server.
4. Reload the app on the iPhone and retry login.

Example shape:

```text
http://<your-mac-ip>:54321
```

This works because the phone can reach your Mac over Wi-Fi, but it cannot use `127.0.0.1` to reach services running on the Mac.

### Quick verify

After updating the env var and restarting the app:

1. Open LifeHub on the iPhone again.
2. Try signing in.
3. If needed, inspect Safari Web Inspector -> `Network` and confirm auth requests now go to your Mac's LAN IP rather than `127.0.0.1`.

## Practical testing strategy

Use different environments for different goals:

### 1. Fast layout iteration

Use desktop browser DevTools responsive mode.

Best for:

- spacing/layout tweaks
- checking breakpoints
- quick visual iteration

### 2. Real mobile interaction testing

Use the iPhone against local dev over Wi-Fi.

Best for:

- tap targets
- keyboard behavior
- scroll feel
- navigation clarity
- form usability

### 3. Auth and end-to-end flow testing

Use a deployed or otherwise network-reachable Supabase-backed environment when testing:

- login/signup
- password reset
- invite links
- email confirmation redirects

This avoids the local-only Supabase URL problem and is usually closer to real usage.

## Notes for auth flows

If you do want email auth flows to work from phone-based local dev, keep in mind:

- `NEXT_PUBLIC_SUPABASE_URL` must be reachable from the iPhone
- Supabase redirect configuration may also need to allow the LAN dev URL used by the phone
- local auth email templates use the shared repo config, so making confirmation/reset links phone-native would likely require committing machine-specific LAN URL config or maintaining a local-only workaround

For most day-to-day mobile UI work, it is simpler to:

- use local iPhone testing for UI and interaction work
- use a deployed environment for auth/email-link testing

## Current team decision

For now, local iPhone testing supports:

- loading the app over Wi-Fi
- password login against local Supabase
- general in-app mobile UI testing

We are not treating fully iPhone-native local email flows as a required workflow.

That means:

- viewing local auth emails in Inbucket/Mailpit is still useful
- confirming/resetting from a laptop is acceptable during local development
- full mobile email-link testing should happen in a deployed or otherwise shareable environment

This keeps `supabase/config.toml` repo-safe and avoids committing machine-specific LAN IP configuration.
