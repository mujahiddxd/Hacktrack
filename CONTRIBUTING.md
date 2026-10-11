# Contributing to HackTrack

Thanks for helping improve HackTrack. Bug reports, documentation fixes, and focused code changes are welcome.

## Before you start

- Search existing issues and pull requests for related work.
- Open an issue before large changes so the approach can be discussed.
- Keep each pull request focused on one problem.
- Read the [Code of Conduct](CODE_OF_CONDUCT.md).

## Local setup

The app is in the `hacktrack/` directory of the repository.

```bash
git clone https://github.com/mujahiddxd/Hacktrack.git
cd Hacktrack/hacktrack
npm ci
cp .env.example .env
```

Set your own `DATABASE_URL` and `JWT_SECRET` in `.env`. The Prisma schema uses MySQL. For local database setup, run `npm run db:push`; `npm run seed` is optional and adds demo data.

## Make a change

1. Create a branch from `main`.
2. Follow the existing TypeScript and component conventions.
3. Add or update tests when behavior changes.
4. Run the checks below from `hacktrack/`:

```bash
npm run lint
npm run test:streaks
npm run build
```

The build needs a valid MySQL-format `DATABASE_URL` for Prisma Client generation. It should not require access to a production database. Never put real credentials in test output or pull requests.

## Pull requests

Describe the problem, solution, and how you tested it. Include screenshots for visible UI changes. Link the related issue when one exists. Maintainers may ask for changes before merging.

Do not commit `.env`, database files, generated output, personal information, or production data.
