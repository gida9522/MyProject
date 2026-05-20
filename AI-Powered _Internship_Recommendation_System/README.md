# Internship Management & Recommendation System

National-Level Platform for managing university internships with role-based access control, dynamic eligibility policies, and comprehensive analytics.

---

## Project Structure

```
Practical-Project/
├── database/
│   └── schema.sql                 # PostgreSQL database schema
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js        # PostgreSQL connection pool
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── superAdminController.js
│   │   │   ├── universityController.js
│   │   │   ├── organizationController.js
│   │   │   └── studentController.js
│   │   ├── middlewares/
│   │   │   ├── auth.js            # JWT verification
│   │   │   ├── rbac.js            # Role-based access control
│   │   │   ├── errorHandler.js    # Global error handling
│   │   │   └── validate.js        # Joi request validation
│   │   ├── models/
│   │   │   ├── userModel.js
│   │   │   ├── universityModel.js
│   │   │   ├── organizationModel.js
│   │   │   ├── studentModel.js
│   │   │   ├── internshipModel.js
│   │   │   ├── applicationModel.js
│   │   │   └── departmentModel.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── superAdmin.routes.js
│   │   │   ├── university.routes.js
│   │   │   ├── organization.routes.js
│   │   │   ├── student.routes.js
│   │   │   └── index.js
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── emailService.js
│   │   │   └── eligibilityService.js
│   │   ├── utils/
│   │   │   ├── ApiError.js
│   │   │   ├── asyncHandler.js
│   │   │   └── generateToken.js
│   │   ├── scripts/
│   │   │   └── seed.js            # Create Super Admin
│   │   └── server.js              # Express entry point
│   ├── package.json
│   └── .env.example
├── PLAN.md
├── TODO.md
└── README.md
```

---

## Getting Started

### 1. Database Setup

```bash
# Install PostgreSQL and create database
createdb internship_db

# Run schema
psql -d internship_db -f database/schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Copy environment file and configure
cp .env.example .env
# Edit .env with your database credentials

# Install dependencies
npm install

# Create Super Admin
npm run seed

# Start development server
npm run dev
```

### 3. Default Super Admin Credentials

```
Email: superadmin@internship-platform.com
Password: SuperAdmin123!
```

---

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint                          | Description                    | Auth   |
| ------ | --------------------------------- | ------------------------------ | ------ |
| POST   | `/api/auth/login`                 | Universal login (all roles)    | Public |
| POST   | `/api/auth/register/organization` | Organization self-registration | Public |
| POST   | `/api/auth/activate/:token`       | Student account activation     | Public |
| GET    | `/api/auth/me`                    | Get current user profile       | Any    |
| POST   | `/api/auth/change-password`       | Change password                | Any    |

### Super Admin (`/api/super-admin`)

| Method | Endpoint                                    | Description                 | Auth        |
| ------ | ------------------------------------------- | --------------------------- | ----------- |
| POST   | `/api/super-admin/universities`             | Register a university       | SUPER_ADMIN |
| GET    | `/api/super-admin/universities`             | List all universities       | SUPER_ADMIN |
| GET    | `/api/super-admin/universities/:id`         | Get university details      | SUPER_ADMIN |
| PATCH  | `/api/super-admin/universities/:id/status`  | Approve/reject university   | SUPER_ADMIN |
| GET    | `/api/super-admin/organizations`            | List all organizations      | SUPER_ADMIN |
| PATCH  | `/api/super-admin/organizations/:id/status` | Approve/reject organization | SUPER_ADMIN |
| GET    | `/api/super-admin/analytics`                | National-level analytics    | SUPER_ADMIN |

### University (`/api/university`)

| Method | Endpoint                                 | Description                 | Auth       |
| ------ | ---------------------------------------- | --------------------------- | ---------- |
| GET    | `/api/university/profile`                | Get university profile      | UNIVERSITY |
| POST   | `/api/university/departments`            | Create department           | UNIVERSITY |
| GET    | `/api/university/departments`            | List departments            | UNIVERSITY |
| POST   | `/api/university/departments/:id/policy` | Create internship policy    | UNIVERSITY |
| POST   | `/api/university/students`               | Create single student       | UNIVERSITY |
| POST   | `/api/university/students/bulk`          | Bulk create (CSV)           | UNIVERSITY |
| GET    | `/api/university/students`               | List students               | UNIVERSITY |
| GET    | `/api/university/students/:id`           | Get student details         | UNIVERSITY |
| PATCH  | `/api/university/students/:id/status`    | Update student status       | UNIVERSITY |
| GET    | `/api/university/applications`           | View all applications       | UNIVERSITY |
| GET    | `/api/university/organizations`          | View approved organizations | UNIVERSITY |
| GET    | `/api/university/analytics`              | University analytics        | UNIVERSITY |

### Organization (`/api/organization`)

| Method | Endpoint                                    | Description              | Auth         |
| ------ | ------------------------------------------- | ------------------------ | ------------ |
| GET    | `/api/organization/profile`                 | Get organization profile | ORGANIZATION |
| PATCH  | `/api/organization/profile`                 | Update profile           | ORGANIZATION |
| POST   | `/api/organization/internships`             | Create internship        | ORGANIZATION |
| GET    | `/api/organization/internships`             | List internships         | ORGANIZATION |
| GET    | `/api/organization/internships/:id`         | Get internship details   | ORGANIZATION |
| PATCH  | `/api/organization/internships/:id`         | Update internship        | ORGANIZATION |
| DELETE | `/api/organization/internships/:id`         | Cancel internship        | ORGANIZATION |
| GET    | `/api/organization/applications`            | List applications        | ORGANIZATION |
| GET    | `/api/organization/applications/:id`        | Get application details  | ORGANIZATION |
| PATCH  | `/api/organization/applications/:id/status` | Accept/reject student    | ORGANIZATION |
| POST   | `/api/organization/progress`                | Submit weekly progress   | ORGANIZATION |
| POST   | `/api/organization/evaluations`             | Submit final evaluation  | ORGANIZATION |

### Student (`/api/student`)

| Method | Endpoint                       | Description                 | Auth    |
| ------ | ------------------------------ | --------------------------- | ------- |
| GET    | `/api/student/profile`         | Get student profile         | STUDENT |
| PATCH  | `/api/student/profile`         | Update profile              | STUDENT |
| GET    | `/api/student/eligibility`     | Check eligibility           | STUDENT |
| POST   | `/api/student/skills`          | Add skill                   | STUDENT |
| GET    | `/api/student/skills`          | List skills                 | STUDENT |
| POST   | `/api/student/projects`        | Add project                 | STUDENT |
| GET    | `/api/student/projects`        | List projects               | STUDENT |
| POST   | `/api/student/documents`       | Upload document             | STUDENT |
| GET    | `/api/student/documents`       | List documents              | STUDENT |
| GET    | `/api/student/internships`     | Browse internships          | STUDENT |
| GET    | `/api/student/internships/:id` | Get internship details      | STUDENT |
| GET    | `/api/student/recommendations` | Get recommended internships | STUDENT |
| POST   | `/api/student/applications`    | Apply to internship         | STUDENT |
| GET    | `/api/student/applications`    | List my applications        | STUDENT |
| GET    | `/api/student/progress`        | View progress reports       | STUDENT |
| GET    | `/api/student/evaluations`     | View evaluations            | STUDENT |

---

## User Roles & Permissions

| Feature                  | SUPER_ADMIN | UNIVERSITY | ORGANIZATION | STUDENT |
| ------------------------ | :---------: | :--------: | :----------: | :-----: |
| Register Universities    |     ✅      |     ❌     |      ❌      |   ❌    |
| Approve Organizations    |     ✅      |     ❌     |      ❌      |   ❌    |
| View National Analytics  |     ✅      |     ❌     |      ❌      |   ❌    |
| Create Departments       |     ❌      |     ✅     |      ❌      |   ❌    |
| Create Students          |     ❌      |     ✅     |      ❌      |   ❌    |
| Set Department Policies  |     ❌      |     ✅     |      ❌      |   ❌    |
| Monitor Placements       |     ❌      |     ✅     |      ❌      |   ❌    |
| Create Internships       |     ❌      |     ❌     |      ✅      |   ❌    |
| Accept/Reject Applicants |     ❌      |     ❌     |      ✅      |   ❌    |
| Submit Progress/Grades   |     ❌      |     ❌     |      ✅      |   ❌    |
| Browse Internships       |     ❌      |     ❌     |      ❌      |   ✅    |
| Apply (when eligible)    |     ❌      |     ❌     |      ❌      |   ✅    |
| Manage Profile/Skills    |     ❌      |     ❌     |      ❌      |   ✅    |

---

## Key Design Features

### Department-Specific Internship Policies

Each department defines:

- `internship_year` - When students become eligible
- `internship_timing` - Semester or summer
- `internship_duration_months` - Required duration
- `min_cgpa` - Minimum academic standing
- `required_credits` - Credit threshold

Students are evaluated dynamically against these policies.

### Student Lifecycle

```
not_eligible → eligible_for_internship → applied → placed → in_internship → internship_completed → final_year → graduated
```

### Scoring-Based Recommendations

Internships are scored for each student based on:

- **Skills match** (25%) - Overlap with required skills
- **CGPA compatibility** (25%) - Meets minimum requirements
- **Location preference** (20%) - Matches student preference
- **Duration fit** (20%) - Within preferred range
- **Title relevance** (10%) - Semantic match

### Security

- JWT-based authentication with role claims
- Bcrypt password hashing (12 rounds)
- Input validation with Joi schemas
- SQL injection protection via parameterized queries
- CORS and Helmet security headers

---

## Environment Variables

```env
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=internship_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Frontend
CLIENT_URL=http://localhost:3000
```

---

## Next Steps (Phase 2)

- [ ] Frontend React application with role-based dashboards
- [ ] Real-time chat with Socket.IO
- [ ] Video meeting integration (Jitsi)
- [ ] Advanced recommendation engine with ML
- [ ] Notification system
- [ ] File upload handling
- [ ] Comprehensive testing suite
