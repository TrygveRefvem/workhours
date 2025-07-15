# Work Order Management Tool

A web application for logging hours worked, submitting work orders with urgency, and adding release notes linked to work orders and hours. Includes authentication and role-based access control.

## Features
- Log hours worked
- Submit work orders (with urgency)
- Add release notes linked to work orders and hours
- Monthly overview for admins (set available hours, transfer hours)
- User management (admin only)
- Authentication (login/logout)
- Role-based access (admin, user)

## Tech Stack
- **Frontend:** React (CDN), Tailwind CSS
- **Backend:** Express.js (Node.js), SQLite
- **Security:** Helmet, CORS, rate limiting, session management

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/TrygveRefvem/workhours.git
   cd workhours
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file for environment variables (see `.env.example` if available).

### Running the App
Start the backend server:
```bash
npm start
```
The server will run on [http://localhost:3000](http://localhost:3000).

Open `public/index.html` in your browser to use the frontend.

### Database
- Uses SQLite (file-based, no setup required)
- Database file will be created automatically on first run

## Usage
- **Login:** Use your credentials to log in
- **Log Hours:** Enter hours worked per work order
- **Submit Work Orders:** Add new work orders with urgency
- **Release Notes:** Add notes linked to work orders/hours
- **Admin:** Manage users, set monthly available hours, transfer hours

## Development
- Frontend code: `public/`
- Backend code: `server.js`, `routes/`, `middleware/`, `db.js`

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE) (or specify your license) 