# Neighborhood Library

A full-stack library management system for neighborhood or small institutional use. Librarians manage the book catalog, borrowing transactions, and reader accounts. Readers browse available books and track their own borrowing history, including any outstanding fines.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Data Models](#data-models)
- [API Endpoints](#api-endpoints)
- [Installation and Setup](#installation-and-setup)

---

## Features

### Librarian
- Add, edit, and delete books (deletion blocked if copies are checked out)
- Issue books to registered readers with a 14-day loan period
- Process returns with automatic fine calculation ($2.00/day overdue)
- View all active loans and complete borrowing history
- Manage reader accounts (delete readers with no outstanding loans)
- Dashboard with at-a-glance stats: total books, available copies, active readers

### Reader
- Browse and search the full book catalog (title, author, or ISBN)
- Check real-time availability (available vs total copies)
- View personal borrowing history with return dates and fines

### System
- JWT authentication with automatic token refresh
- Role-based access control (LIBRARIAN / READER)
- Paginated lists (10 items per page) throughout
- Atomic database transactions for issue and return operations

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.10+ | Runtime |
| Django | 6.0.5 | Web framework |
| Django REST Framework | 3.17.1 | REST API layer |
| Simple JWT | 5.5.1 | JWT authentication |
| django-cors-headers | 4.9.0 | CORS for React frontend |
| PostgreSQL | 13+ | Primary database |
| psycopg2 | 2.9.12 | PostgreSQL adapter |
| python-dotenv | 1.2.2 | Environment variable loading |
| pytest / pytest-django | 9.0.3 / 4.12.0 | Testing |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.2.6 | UI framework |
| React Router | 7.15.1 | Client-side routing |
| Axios | 1.16.1 | HTTP client with JWT interceptors |
| Bootstrap | 5.3.8 | UI styling and layout |
| Vite | 8.0.12 | Build tool and dev server |

---

## Architecture Overview

```
Neighborhood_Library_Django_React/
├── backend/                     # Django project
│   ├── library/                 # Main application
│   │   ├── models.py            # User, Book, BorrowRecord
│   │   ├── views.py             # Class-based API views
│   │   ├── serializers.py       # DRF serializers
│   │   ├── urls.py              # App URL patterns
│   │   └── admin.py             # Admin site config
│   ├── library_project/
│   │   ├── settings.py          # Django settings (env-driven)
│   │   └── urls.py              # Root URL config
│   ├── manage.py
│   ├── requirements.txt
│   ├── seeds.py                 # Optional seed data script
│   └── .env_sample              # Environment variable template
└── frontend/                    # React + Vite project
    ├── src/
    │   ├── api/
    │   │   └── axios.js         # Axios instance with token refresh
    │   ├── components/
    │   │   ├── Home.jsx          # Public catalog page
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── librarian_dashboard.jsx
    │   │   ├── reader_dashboard.jsx
    │   │   ├── BookDetail.jsx
    │   │   └── BookFormPage.jsx
    │   ├── page/
    │   │   └── BookForm.jsx      # Reusable book form
    │   └── App.jsx               # Route definitions
    ├── package.json
    └── vite.config.js
```

The Django backend exposes a REST API on `http://127.0.0.1:8000/`. The React frontend runs on `http://localhost:5173/` during development and communicates with the backend via Axios. CORS is pre-configured to allow this origin.

---

## Data Models

### User
Extends Django's `AbstractUser` with:
- `role` — `LIBRARIAN` or `READER`
- `full_name`, `date_of_birth`, `address`, `contact_no`
- Properties: `is_librarian`, `is_reader`

### Book
- `title`, `author`, `isbn` (unique), `description`, `published_date`
- `total_copies`, `available_copies`
- Indexed on `title` and `author` for search performance

### BorrowRecord
- Foreign keys to `User` and `Book`
- `issue_date` (auto), `due_date`, `return_date` (nullable)
- `status` — `BORROWED` or `RETURNED`
- `fine_paid` (boolean), `final_fine_amount` (decimal)
- `calculate_fine` property — computes $2.00/day past due; frozen on return

---

## API Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/register/` | Public | Register a new user |
| POST | `/api/login/` | Public | Obtain JWT tokens |
| POST | `/api/token/refresh/` | Public | Refresh access token |
| GET | `/api/books/` | Authenticated | List books (search: `?q=`, page: `?page=`) |
| POST | `/api/books/` | Librarian | Create a book |
| GET | `/api/book/<id>/` | Authenticated | Book detail |
| PUT | `/api/books/<id>/` | Librarian | Update a book |
| DELETE | `/api/books/<id>/` | Librarian | Delete a book |
| POST | `/api/issue/` | Librarian | Issue a book to a reader |
| POST | `/api/return/<id>/` | Librarian | Return a book |
| GET | `/api/books/issued/` | Librarian | Currently issued books |
| GET | `/api/books/issue_history/` | Librarian | Full borrowing history |
| GET | `/api/reader/issue_history/` | Reader | Personal borrowing history |
| GET | `/api/readers/` | Librarian | Paginated reader list |
| GET | `/api/readers/all/` | Librarian | All readers (no pagination) |
| POST | `/api/reader/<id>/delete/` | Librarian | Delete a reader |

---

## Installation and Setup

### Prerequisites

- **Python** 3.10 or higher
- **Node.js** 18 or higher and **npm**
- **PostgreSQL** 13 or higher
- **Git**

---

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Neighborhood_Library_Django_React
```

---

### 2. PostgreSQL — Create the Database

Log in to PostgreSQL and create the database and user the project expects:

```sql
CREATE DATABASE library_database;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE library_database TO postgres;
```

If you already have a `postgres` superuser with a different password, skip the `CREATE USER` step and update the password in your `.env` file (step 4).

---

### 3. Backend Setup

#### 3a. Create and activate a virtual environment

```bash
cd backend
python -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

#### 3b. Install Python dependencies

```bash
pip install -r requirements.txt
```

#### 3c. Create the environment file

Copy the sample and fill in your values:

```bash
cp .env_sample .env
```

Open `backend/.env` and update as needed:

```dotenv
# Django core settings
DJANGO_SECRET_KEY=replace-with-a-long-random-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost

# Database settings
DB_ENGINE=django.db.backends.postgresql
DB_NAME=library_database
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# Django URL/auth settings
LOGIN_URL=login
LOGIN_REDIRECT_URL=reader_dashboard
LOGOUT_REDIRECT_URL=login

# Static files
STATIC_URL=static/
STATIC_ROOT=staticfiles

# CORS settings
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

> **Tip:** Generate a strong secret key with:
> ```bash
> python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
> ```

#### 3d. Apply database migrations

```bash
python manage.py migrate
```

#### 3e. Create a superuser (optional but recommended)

```bash
python manage.py createsuperuser
```

This account can log in to the Django admin at `http://127.0.0.1:8000/admin/`.

#### 3f. (Optional) Seed sample data

```bash
python seeds.py
```

#### 3g. Start the Django development server

```bash
python manage.py runserver
```

The API is now available at `http://127.0.0.1:8000/`.

---

### 4. Frontend Setup

Open a **new terminal**, keeping the Django server running.

#### 4a. Install Node dependencies

```bash
cd frontend
npm install
```

#### 4b. Start the Vite development server

```bash
npm run dev
```

The frontend is now available at `http://localhost:5173/`.

---

### 5. Verify the Setup

1. Open `http://localhost:5173/` in your browser — the book catalog home page should load.
2. Navigate to `/register` and create a **LIBRARIAN** account.
3. Log in and access the librarian dashboard to add books and manage readers.
4. Register a second account as a **READER**, log in, and verify the reader dashboard shows the catalog.

---

### Running Tests

From the `backend/` directory with the virtual environment active:

```bash
pytest
```

To see coverage:

```bash
pytest --cov=library
```

---

### Frontend Routes

| Path | Component | Access |
|---|---|---|
| `/` | Home (catalog) | Public |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/librarian-dashboard` | Librarian Dashboard | Librarian |
| `/reader-dashboard` | Reader Dashboard | Reader |
| `/book/:id` | Book Detail | Authenticated |
| `/create-book` | Book Form | Librarian |
| `/book/edit/:id` | Book Form (edit) | Librarian |
