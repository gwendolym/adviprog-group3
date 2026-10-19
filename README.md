# adviprog-group3
A team-centered meeting planner where you can enter your availability and decide on meeting times. See your meeting history, group meetings by topics, and keep track of your notes and documents. View your team's availability and see meeting updates live using WebSockets. 

**Deployed app:** <https://meetly.app.cloud.cbh.kth.se/>

## Features

- User accounts with authentication and email flows
  - Login with email/password
  - Login with Google OAuth2 (optional, set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`)
- Teams and team membership management
  - TODO: Team management frontend
  - TODO: Connect teams with events
- Entering your own availability and viewing your team's availability
- Live meeting member availability updates over WebSockets
- Dark mode
- Meeting event creation
- Automated CI/CD pipeline
- Database integration using Prisma and PostgreSQL
- TODO: Integrations
  - TODO: Integrate Google Calendar
  - TODO: Integrate Google Meet / Zoom
- TODO: Add Postman API test collection for existing endpoints

## Tech stack

| Part | Technology |
| --- | --- |
| Frontend | SvelteKit |
| Backend | NestJS |
| Database | PostgreSQL, Prisma ORM |
| Infrastructure | Docker |

## Setup and running locally

### Prerequisites

- Docker and Docker Compose

### Environment variables

Copy the example file before starting the project:

```sh
cp .env.example .env
```

### Run with Docker Compose

From the repository root:

```sh
docker compose up -d --build
```

## Testing and Git hooks

Enable the repository hooks:

```sh
pre-commit install
```

Testing is done by running all hooks:

```sh
pre-commit run --all-files
```
