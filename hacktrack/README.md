# HackTrack

HackTrack is an open-source hackathon command center for organizers who need one place to manage events, participants, history, and scheduled email broadcasts.

It combines a fast Next.js dashboard with a Prisma-backed database and an independent worker for reliable, personalized participant communication.

![HackTrack's four-step workflow](https://raw.githubusercontent.com/mujahiddxd/Hacktrack/main/hacktrack/image%20copy%205.png)

## Features

- Dashboard KPIs and upcoming hackathon views
- Hackathon creation, editing, participant management, and lifecycle states
- Searchable history and audit-friendly soft deletion
- Scheduled, personalized email broadcasts with `{name}` and `{hackathonName}` tokens
- Isolated recipient delivery so participant addresses are not exposed to one another
- Background worker with atomic message claiming and per-recipient failure handling
- JWT authentication, protected routes, password hashing, and a protected cron endpoint
- Neubrutalist interface built with Tailwind CSS and Lucide icons

## Tech stack

- Next.js 16 with the App Router and TypeScript
- React 19
- Prisma ORM 6
- MySQL-compatible database configured through `DATABASE_URL`
- Google Gmail API / Nodemailer for email delivery
- Tailwind CSS 4

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- A MySQL-compatible database
- Google OAuth credentials if Gmail delivery is enabled

## Getting started

```bash
git clone https://github.com/mujahiddxd/Hacktrack.git
cd Hacktrack/hacktrack
npm install
```

Create a local environment file and edit its values:

```bash
cp .env.example .env
```

Configure `DATABASE_URL` and generate distinct, random values for `JWT_SECRET` and `CRON_SECRET`. Set `ADMIN_PASSWORD` before running the seed script. The complete list of supported variables is documented in `.env.example`. Never use its placeholder values in a deployed environment.

Initialize the database and seed local development data:

```bash
npx prisma db push
npm run seed
```

Start the web app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). To process scheduled broadcasts locally, run the worker in a second terminal:

```bash
npm run worker
```

The seed script creates a development administrator using `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Change both values before using the application outside local development.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Generate Prisma Client and build the app |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run worker` | Run the background broadcast worker |
| `npm run seed` | Seed a local administrator and demo data |
| `npm run db:push` | Apply the Prisma schema to the database |
| `npm run prisma:migrate` | Create and apply a Prisma migration |
| `npm run test:streaks` | Run the streak-related tests |

## Email delivery

HackTrack can use Google OAuth 2.0 and the Gmail API for delivery. Create OAuth credentials in Google Cloud, set the `GOOGLE_*` variables in `.env`, and use the in-app Google connection flow. Keep client secrets and refresh tokens private, and do not commit `.env` or database files.

## Project structure

```text
app/          Next.js routes, pages, and API endpoints
actions/      Server actions
components/   Reusable UI components
lib/          Authentication, email, scheduling, and domain logic
prisma/       Database schema and seed script
scripts/      Background worker and maintenance utilities
types/        Shared TypeScript types
```

## Contributing

Contributions are welcome. See the [contributing guide](https://github.com/mujahiddxd/Hacktrack/blob/main/CONTRIBUTING.md), [Code of Conduct](https://github.com/mujahiddxd/Hacktrack/blob/main/CODE_OF_CONDUCT.md), and [security policy](https://github.com/mujahiddxd/Hacktrack/blob/main/SECURITY.md). Before opening a pull request:

1. Create a focused branch from `main`.
2. Explain the problem and the proposed change.
3. Run `npm run lint`, `npm run build`, and relevant tests.
4. Include screenshots or setup notes for user-facing changes.
5. Do not include secrets, production data, `.env` files, or generated database files.

Please keep pull requests small and discuss large feature changes in an issue first.

## Security

Do not report security vulnerabilities in public issues. Use GitHub's private security advisory workflow for this repository, or contact the maintainers privately if that workflow is unavailable.

## License

HackTrack is licensed under the [MIT License](https://github.com/mujahiddxd/Hacktrack/blob/main/LICENSE).

## Acknowledgements

Built with [Next.js](https://nextjs.org/), [Prisma](https://www.prisma.io/), [Tailwind CSS](https://tailwindcss.com/), [Lucide](https://lucide.dev/), and the [Google Gmail API](https://developers.google.com/gmail/api).
