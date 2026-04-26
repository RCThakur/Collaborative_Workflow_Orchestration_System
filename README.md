# Collaborative Workflow Orchestration System

A full-stack collaborative project and task orchestration platform built with **React**, **Node.js**, **Express**, **MongoDB**, **Mongoose**, **JWT**, and **WebSockets**. The system allows users to create projects, invite collaborators, manage dependency-aware tasks, compute deterministic execution plans, run daily simulations, and receive real-time updates.

## Features

### Authentication & Access Control

- User signup and login
- JWT-based authentication
- Protected frontend routes and protected backend APIs
- Password hashing with bcrypt
- Persistent login using token storage

### Project Collaboration

- Create new projects
- View all projects the logged-in user is part of
- Generate secure invite tokens/links
- Join projects using invite token or invite link
- Invite token expiry support

### Task Management

Each task includes:

- Title
- Description
- Priority (1–5)
- Estimated hours
- Status (`Pending`, `Running`, `Completed`, `Failed`, `Blocked`)
- Dependencies
- Resource tag
- Max retries
- Retry count
- Version number

Users can:(Future Update)

- Create tasks
- Edit tasks
- Delete tasks
- Update task status
- View dependency information
- View version history

### Execution Logic

- Detect and reject cyclic dependencies
- Compute valid execution plans
- Enforce dependency completion before running tasks
- Prevent simultaneous running tasks with the same `resourceTag`
- Exclude blocked tasks from execution
- Deterministic task ordering based on:
  - Priority descending
  - Estimated hours ascending
  - Creation time ascending

### Simulation

- Run daily simulation with available hours
- Optionally mark tasks as failed during simulation
- Return:
  - Execution order
  - Selected tasks
  - Blocked tasks
  - Skipped tasks
  - Total priority score

## Tech Stack

### Frontend

- React
- React Router
- Axios
- Context API / Redux (optional)
- CSS

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt / bcryptjs

### Deployment

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

## Project Structure

````bash
collaborative-workflow-system/
│
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── hooks/
│   │   ├── store/
│   │   └── utils/
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── sockets/
│   │   ├── validators/
│   │   ├── utils/
│   │   ├── jobs/
│   │   └── webhooks/
│   ├── server.js
│   └── package.json
│
└── README.md
```



Start backend:

```bash
npm run dev
```

## 3. Setup frontend

```bash
cd ../client
npm install
npm run dev
```

Frontend will run on:

```bash
http://localhost:5173
```

Backend will run on:

```bash
http://localhost:5000
```



## Core API Endpoints

### Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Projects
- `GET /api/projects`
- `POST /api/projects`
- `POST /api/projects/:projectId/invite`
- `POST /api/projects/join`

### Tasks
- `GET /api/projects/:projectId/tasks`
- `POST /api/projects/:projectId/tasks`
- `PUT /api/projects/:projectId/tasks/:taskId`
- `DELETE /api/projects/:projectId/tasks/:taskId`
- `GET /api/projects/:projectId/tasks/:taskId/history`



## Frontend Modules

- Authentication screens
- Protected routes
- Project dashboard
- Invite/join project UI
- Task list and task form

## Backend Modules

- Authentication controller
- Project controller
- Invite token service
- Task controller
- Dependency validator



## Future Improvements

- Role-based permissions per project
- Task dependency graph visualization
- Notification center
- Email invites
- Advanced analytics dashboard
- Retry queue monitoring
- Unit and integration tests
- Docker support

## Author

**Rinkesh Thakur**

## License

This project is for educational and assignment purposes.
````
