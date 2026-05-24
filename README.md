This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Admin Smoke Tests

The Playwright smoke suite is non-destructive. It checks login, dashboard session persistence, notification dropdown layout, logout cleanup, and protected route redirects.

Set these environment variables before running the authenticated tests:

```bash
export PLANORA_ADMIN_URL=https://planora-pi-inky.vercel.app
export PLANORA_ADMIN_USERNAME=your-admin-username
export PLANORA_ADMIN_PASSWORD=your-admin-password
```

PowerShell:

```powershell
$env:PLANORA_ADMIN_URL="https://planora-pi-inky.vercel.app"
$env:PLANORA_ADMIN_USERNAME="your-admin-username"
$env:PLANORA_ADMIN_PASSWORD="your-admin-password"
```

If Chromium is not installed for Playwright yet, run:

```bash
npx playwright install chromium
```

Run headless smoke tests:

```bash
npm run test:e2e
```

Run in a visible browser:

```bash
npm run test:e2e:headed
```

The tests do not create, edit, or delete production records.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
