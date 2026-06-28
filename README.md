# Content Forge Backend

An enterprise-grade, high-performance RESTful API built with **Express (v5)**, **TypeScript**, and **Prisma ORM** that serves as the backbone pipeline architecture for Content Forge AI. It handles scalable dataset multi-schema generation modeling, modular user layouts, workspace authentication tracking, analytics processing, and real-time transaction history logs.

---

## 🛠 Tech Stack Core Architecture

* **Runtime & Framework:** Node.js, TypeScript 6, Express 5 (Native Promise error interception)
* **Database & ORM:** PostgreSQL, Prisma 7 (Multi-file schema layout architecture)
* **Authentication Engine:** Better-Auth 1.6 integrated natively alongside JWT backups
* **Validation Layer:** Zod 4 typesafe data-handling schemas
* **Task Automation:** Node-Cron decoupled process loop managers

---

## 📂 Project Directory Breakdown

```text
├── prisma/                          # Multi-schema Data Model Layer
│   ├── migrations/                  # Versioned baseline migrations tracking
│   └── schema/                      # Modulized domain micro-schemas
│       ├── auth.prisma              # Identity, Account, Session, and Verification schemas
│       ├── enums.prisma             # Global status definitions
│       ├── generation.prisma        # Processing payload logs, trace matrixes
│       ├── template.prisma          # Baseline layout preset specifications
│       └── user.prisma              # Core account nodes
├── src/
│   ├── app/
│   │   ├── config/                  # Environment bindings validation
│   │   ├── errorHelpers/            # Global Exception interceptor handlers
│   │   ├── interfaces/              # Shared contextual application interfaces
│   │   ├── lib/                     # Singletons initializers (Prisma client, Better-Auth)
│   │   ├── middleware/              # Auth guards, validation hooks, error bubbles
│   │   ├── module/                  # Domain Driven Modular Segments
│   │   │   ├── auth/                # Signups, session lookups
│   │   │   ├── dashboard/           # Metrics processing aggregate queries
│   │   │   ├── favorite/            # Bookmarks indices tracking
│   │   │   ├── generation/          # Engine pipelines and validation handlers
│   │   │   └── template/            # Blueprint layout specifications
│   │   ├── routes/                  # Centralized base router configuration map
│   │   ├── templates/               # EJS contextual notification rendering templates
│   │   └── utils/                   # QueryBuilders, Token helpers, email engines
│   ├── app.ts                       # Application configuration initialization
│   └── server.ts                    # Server execution cluster initialization node

```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:

* Node.js (v18+ recommended)
* `pnpm` (Workspace Manager package runner)
* Docker & Docker Compose (For running database containers locally)

### Installation & Local Setup

1. **Clone the Repository:**
```bash
git clone https://github.com/furqanRupom/content-forge-backend.git
cd content-forge-backend

```


2. **Install Project Dependencies:**
```bash
pnpm install

```


3. **Configure Environment Parameters:**
Create a `.env` file in the root directory and add the configuration parameters outlined below:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/content_forge?schema=public"

# Better Auth & Security
BETTER_AUTH_SECRET=your_super_secure_random_hash_string
JWT_ACCESS_SECRET=your_jwt_access_secret_token

# External Integrations (Stripe & SMTP)
STRIPE_SECRET_KEY=sk_test_...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

```


4. **Spin Up Infrastructural Services (Docker):**
```bash
docker-compose up -d

```


5. **Generate Prisma Client Artifacts & Run Database Migrations:**
```bash
pnpm prisma migrate dev

```


6. **Seed Baseline Workspace Template Presets:**
```bash
pnpm tsx src/app/utils/seed.ts

```


7. **Execute Application Engine (Development):**
```bash
pnpm dev

```



---

## 🧪 Script Matrix Tasks Execution

Run tasks using your project's local dependency runner binaries:

* `pnpm dev` - Spawns dev process execution context attached with structural hot reloading (`tsx watch src/server.ts`).
* `pnpm build` - Compiles the TypeScript code down into optimized JavaScript distribution outputs inside `/dist`.
* `pnpm start` - Executes the production cluster build configuration layer output.
* `pnpm prisma:generate` - Updates the database artifact models index dynamically across local schemas changes.


## 🔒 Code Styling & Security Patterns

* **Zod Structural Schemas Validation:** Incoming request bodies are filtered and scrubbed by `validateRequest(zodSchema)` prior to routing blocks execution.
* **Global AppError Class:** Throwing an intentional `AppError(status, message)` auto-serializes down into consistent API responses without bringing down the runtime thread loops.
* **Prisma Dynamic Multi-File Schemas Structure:** Kept maintainable by separation of models inside `./prisma/schema/` and built seamlessly using Prisma's local schema compiler settings.
