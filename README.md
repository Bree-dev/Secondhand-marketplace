# SECONDHAND MARKETPLACE (KENYA) 🇰🇪

A clean, high-performance, and mobile-friendly full-stack web application designed for campus or localized communities to buy, sell, and trade items effortlessly. The platform features an ultra-clean, flat-design UI with sharp corners, real-time search queries, and secure token-based password recovery.

---

## Core Features

- **Dynamic Product Feed & Filtering:** Smooth, single-line horizontal swipeable track for instant categorical filtering (*Electronics, Furniture, Kitchenware, Clothing, Vehicles, Books & Hobbies, Other*).
- **Interactive Search Engine:** Fast client-to-backend text filtering that communicates directly with a PostgreSQL database layer.
- **Secure Password Recovery Flow:** High-security implementation utilizing randomized hexadecimal crypto tokens stored as raw numbers (`BigInt` compliant) alongside automated email delivery through `Nodemailer`.
- **WhatsApp Chat Routing:** Automated click-to-chat generation that bridges prospective buyers straight to listing owners through unique WhatsApp endpoint anchors.
- **Admin Control Matrix:** Dedicated backend interfaces built to handle administrative overview panels, live listing moderation, and secure deletions.

### 📅 Planned Features (Upcoming Update)
- **Premium M-Pesa Checkout Flow:** An interactive custom modal prompt layout simulating an STK Push payment of **Ksh 30.00** before prioritizing and registering new uploads.

---

## 🛠️ Technology Stack

- **Frontend:** Semantic HTML5, Tailwind CSS (Utility-first styling grid), Vanilla JavaScript (ES6+ Module Architecture).
- **Backend:** Node.js, Express.js REST API.
- **Database:** PostgreSQL (Connection Pooling via `pg`).
- **Environment Management:** `dotenv` configuration layer.
- **Email Delivery Server:** SMTP relay through Gmail Application Access Passwords and Nodemailer modules.

---

## 📁 Architecture Directory Structure

```text
Second-Hand/
├── Front-End/
│   ├── js/
│   │   ├── config.js          # API global routing parameters
│   │   └── app.js             # Client execution handlers & card injection
│   ├── index.html             # Core marketplace dynamic feed window
│   ├── login.html             # Session authentication gateway
│   ├── register.html          # Account provisioning dashboard
│   ├── upload.html            # Product listing wizard
│   ├── forgot-password.html   # Out-of-band recovery submission screen
│   └── reset-password.html    # Final state password modification terminal
└── Back-End/
    ├── controllers/
    │   └── authController.js  # Identity validation & cryptographic verification
    ├── node_modules/          # Installed dependencies
    ├── .env                   # Protected credential registry keys
    ├── package.json           # Application manifest
    └── server.js              # Application root orchestration hub
