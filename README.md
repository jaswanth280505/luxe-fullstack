# LUXE Full-Stack E-Commerce Platform

LUXE is a monorepo for a full-stack e-commerce application built with Spring Boot, React, and MySQL. The codebase supports customer shopping flows, JWT-based authentication, order management, and admin catalog operations including CSV-based product import.

## Tech Stack

- Frontend: React 18, Vite, React Router, Axios, React Hot Toast, React Icons
- Backend: Spring Boot 3.2, Spring Web, Spring Data JPA, Spring Security, JWT, Validation, Lombok, Apache Commons CSV
- Database: MySQL 8
- DevOps: Docker Compose, GitHub Actions, Railway, Vercel

## Repository Structure

```text
luxe-fullstack/
|-- .github/
|   `-- workflows/
|       |-- ci.yml
|       |-- deploy-production.yml
|       |-- deploy-staging.yml
|       `-- pr-checks.yml
|-- backend/
|   |-- src/main/java/com/luxe/ecommerce/
|   |   |-- config/
|   |   |-- controller/
|   |   |-- dto/
|   |   |-- model/
|   |   |-- repository/
|   |   |-- security/
|   |   `-- service/
|   |-- src/main/resources/application.properties
|   |-- pom.xml
|   `-- Dockerfile
|-- frontend/
|   |-- public/product-import-template.csv
|   |-- src/
|   |   |-- components/
|   |   |-- context/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- styles/
|   |   `-- utils/
|   |-- package.json
|   |-- vite.config.js
|   `-- vercel.json
|-- docker/
|   `-- docker-compose.yml
|-- docs/
|   |-- CONTRIBUTING.md
|   `-- DEPLOYMENT.md
|-- scripts/
|   `-- setup.sh
|-- product-import-template.csv
`-- README.md
```

## Architecture, UML, and Workflow Diagrams

GitHub renders Mermaid blocks directly, so the diagrams below can be viewed in the repository without extra tooling.

### 1. System Component View

```mermaid
flowchart LR
    User[Customer or Admin] --> Browser[Browser]

    subgraph Frontend[React frontend]
        Pages[Pages and routes]
        Context[AuthContext and CartContext]
        Api[Axios API client]
        Storage[(localStorage)]
        Pages --> Context --> Api
        Context <--> Storage
    end

    subgraph Backend[Spring Boot backend]
        Security[SecurityConfig and JwtAuthFilter]
        Controllers[REST controllers]
        Services[Business services]
        Repositories[Spring Data repositories]
        Security --> Controllers --> Services --> Repositories
    end

    DB[(MySQL)]

    Browser --> Pages
    Api --> Security
    Repositories --> DB
```

### 2. Use Case Diagram

```mermaid
flowchart LR
    Customer((Customer))
    Admin((Admin))

    subgraph LuxeSystem[LUXE system]
        UC1([Register or login])
        UC2([Browse products])
        UC3([View product details])
        UC4([Manage cart])
        UC5([Checkout and place order])
        UC6([View order history])
        UC7([View admin dashboard])
        UC8([Create, update, or soft-delete products])
        UC9([Import products from CSV])
        UC10([Update order status])
    end

    Customer --> UC1
    Customer --> UC2
    Customer --> UC3
    Customer --> UC4
    Customer --> UC5
    Customer --> UC6

    Admin --> UC1
    Admin --> UC7
    Admin --> UC8
    Admin --> UC9
    Admin --> UC10
```

### 3. Domain Model Class Diagram

```mermaid
classDiagram
    class User {
        +Long id
        +String email
        +String password
        +String fullName
        +String phone
        +String address
        +Role role
        +boolean enabled
        +LocalDateTime createdAt
        +LocalDateTime updatedAt
    }

    class Product {
        +Long id
        +String name
        +String description
        +BigDecimal price
        +BigDecimal originalPrice
        +Integer stock
        +String category
        +String brand
        +String sku
        +String mainImageUrl
        +boolean active
        +Double rating
        +Integer reviewCount
        +LocalDateTime createdAt
        +LocalDateTime updatedAt
    }

    class ProductImage {
        +Long id
        +String imageUrl
    }

    class CartItem {
        +Long id
        +Integer quantity
    }

    class Order {
        +Long id
        +BigDecimal totalAmount
        +OrderStatus status
        +String shippingAddress
        +String paymentMethod
        +String trackingNumber
        +LocalDateTime createdAt
        +LocalDateTime updatedAt
    }

    class OrderItem {
        +Long id
        +Integer quantity
        +BigDecimal price
    }

    class Role {
        <<enumeration>>
        USER
        ADMIN
    }

    class OrderStatus {
        <<enumeration>>
        PENDING
        CONFIRMED
        SHIPPED
        DELIVERED
        CANCELLED
    }

    User --> Role
    Order --> OrderStatus
    User "1" --> "*" CartItem : owns
    User "1" --> "*" Order : places
    Product "1" --> "*" ProductImage : has
    Product "1" --> "*" CartItem : referenced by
    Order "1" --> "*" OrderItem : contains
    Product "1" --> "*" OrderItem : purchased as
```

### 4. Authentication Sequence Diagram

```mermaid
sequenceDiagram
    actor Customer
    participant UI as React UI
    participant Controller as AuthController
    participant Service as AuthService
    participant Auth as AuthenticationManager
    participant Repo as UserRepository
    participant JWT as JwtUtil
    participant Store as localStorage

    Customer->>UI: Submit register or login form
    UI->>Controller: POST /auth/register or /auth/login
    Controller->>Service: register(request) or login(request)

    alt Register flow
        Service->>Repo: existsByEmail(email)
        Service->>Repo: save(user with encoded password)
    else Login flow
        Service->>Auth: authenticate(email, password)
        Service->>Repo: findByEmail(email)
    end

    Service->>JWT: generateToken(email)
    Service-->>Controller: AuthResponse(token, user metadata)
    Controller-->>UI: 200 OK
    UI->>Store: save luxe_token and luxe_user
    UI-->>Customer: Redirect as authenticated user
```

### 5. Checkout and Order Placement Sequence Diagram

```mermaid
sequenceDiagram
    actor Customer
    participant UI as CheckoutPage
    participant Controller as OrderController
    participant Service as OrderService
    participant CartRepo as CartItemRepository
    participant ProductRepo as ProductRepository
    participant OrderRepo as OrderRepository
    participant DB as MySQL

    Customer->>UI: Confirm shipping address and payment method
    UI->>Controller: POST /orders
    Controller->>Service: placeOrder(email, request)
    Service->>CartRepo: findByUser(user)

    alt Cart is empty
        Service-->>Controller: error
        Controller-->>UI: failure response
    else Cart has items
        loop For each cart item
            Service->>ProductRepo: validate active product and stock
            Service->>ProductRepo: deduct stock
        end
        Service->>OrderRepo: save order and order items
        OrderRepo->>DB: persist order data
        Service->>CartRepo: deleteByUser(user)
        Service-->>Controller: OrderResponse
        Controller-->>UI: 200 OK
        UI-->>Customer: Redirect to order details page
    end
```

### 6. Order State Diagram

```mermaid
stateDiagram-v2
    [*] --> PENDING
    PENDING --> CONFIRMED
    CONFIRMED --> SHIPPED
    SHIPPED --> DELIVERED

    PENDING --> CANCELLED
    CONFIRMED --> CANCELLED
    SHIPPED --> CANCELLED

    note right of CANCELLED
        When an existing order moves to CANCELLED,
        stock is restored for each order item.
    end note
```

### 7. Customer Shopping Workflow

```mermaid
flowchart TD
    Start([Start]) --> Browse[Browse product catalog]
    Browse --> Filter[Search, filter, or sort products]
    Filter --> Detail[Open product details]
    Detail --> SignedIn{Signed in?}
    SignedIn -- No --> Auth[Register or login]
    SignedIn -- Yes --> Add[Add product to cart]
    Auth --> Add
    Add --> Cart[Review cart and update quantity]
    Cart --> Checkout[Open checkout page]
    Checkout --> Validate{Cart valid and stock available?}
    Validate -- No --> Cart
    Validate -- Yes --> Order[Place order]
    Order --> Pending[Order saved with PENDING status]
    Pending --> Track[View order history and details]
    Track --> End([End])
```

### 8. Admin Catalog Workflow

```mermaid
flowchart TD
    AdminStart([Admin login]) --> Dashboard[Open admin panel]
    Dashboard --> Task{Choose task}
    Task --> Stats[Review dashboard stats]
    Task --> Manual[Create or edit product]
    Task --> Delete[Soft-delete product]
    Task --> Csv[Upload CSV file]

    Manual --> SaveProduct[POST or PUT /products]
    Delete --> SoftDelete[DELETE /products/:id sets active=false]
    Csv --> ImportApi[POST /admin/products/import-csv]
    ImportApi --> Parse[Parse CSV rows]
    Parse --> Upsert[Upsert product by SKU]
    Upsert --> SaveImages[Normalize main image and gallery images]
    SaveProduct --> SaveImages
    SoftDelete --> Refresh[Refresh product list and stats]
    SaveImages --> Refresh
    Stats --> Refresh
```

### 9. CI/CD Workflow

```mermaid
flowchart LR
    Feature[feature/* branch] --> PR[Pull request]
    PR --> Gates[PR quality gates]
    Gates --> Dev[dev branch]
    Dev --> CI[CI build and test workflow]
    CI --> Staging[staging branch]
    Staging --> StagingDeploy[Deploy staging]
    StagingDeploy --> Main[main branch]
    Main --> ProdDeploy[Deploy production]
    ProdDeploy --> Vercel[Vercel frontend]
    ProdDeploy --> Railway[Railway backend]
```

### 10. Deployment View

```mermaid
flowchart LR
    Developer[Developer pushes code] --> GitHub[GitHub repository]
    GitHub --> Actions[GitHub Actions]
    Actions --> Vercel[Vercel]
    Actions --> Railway[Railway]

    Shopper[End user] --> Web[Browser]
    Web --> Vercel
    Vercel --> Api[Spring Boot API on Railway]
    Api --> MySQL[(Railway MySQL)]
```

## Key Business Rules Captured in the Code

- JWT tokens are created on login and registration, then stored in `localStorage` by the frontend.
- Product listing and product details are public; cart, checkout, orders, and admin endpoints require authentication.
- Admin-only routes are guarded with Spring Security role checks.
- Product deletion is a soft delete: `DELETE /products/{id}` sets `active=false`.
- Inactive products are pruned from carts the next time the cart is loaded or updated.
- Placing an order validates stock, deducts inventory, creates order items, and clears the cart.
- Cancelling an existing order restores stock for each order item.
- CSV imports upsert products by `sku` and build image galleries from the `images` column.

## API Overview

| Area | Endpoints |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Products | `GET /api/products`, `GET /api/products/{id}`, `GET /api/products/categories`, `POST /api/products`, `PUT /api/products/{id}`, `DELETE /api/products/{id}` |
| Cart | `GET /api/cart`, `POST /api/cart`, `PUT /api/cart/{itemId}?quantity={n}`, `DELETE /api/cart` |
| Orders | `POST /api/orders`, `GET /api/orders`, `GET /api/orders/{id}`, `GET /api/orders/admin/all`, `PATCH /api/orders/{id}/status` |
| Admin | `GET /api/admin/stats`, `POST /api/admin/products/import-csv` |

## Local Development

### Prerequisites

- Java 17
- Maven 3.8+
- Node.js 18+
- npm
- Docker Desktop or Docker Engine

### Option 1: Setup Script

The repository includes `scripts/setup.sh` for bash-based environments such as Linux, macOS, Git Bash, or WSL.

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Option 2: Manual Setup

```bash
docker compose -f docker/docker-compose.yml up -d mysql
cd backend
mvn spring-boot:run
```

In a second terminal:

```bash
cd frontend
npm ci
npm run dev
```

### Local URLs

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8080/api`
- Swagger UI: `http://localhost:8080/api/swagger-ui.html`
- CSV template: `http://localhost:3000/product-import-template.csv`

## Deployment Targets

| Environment | Frontend | Backend API |
|---|---|---|
| Production | `https://luxe.vercel.app` | `https://luxe-api.railway.app/api` |
| Staging | `https://luxe-staging.vercel.app` | `https://luxe-api-staging.railway.app/api` |

## Useful Commands

```bash
# Backend tests
cd backend
mvn test

# Backend package
cd backend
mvn clean package

# Frontend development
cd frontend
npm run dev

# Frontend production build
cd frontend
npm run build
```

## Related Docs

- `docs/DEPLOYMENT.md`
- `docs/CONTRIBUTING.md`
