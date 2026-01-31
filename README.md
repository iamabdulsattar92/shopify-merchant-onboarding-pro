# Shopify Merchant Onboarding Pro

This app handles the initial setup and data collection for the **Incentives and Sales Pro** ecosystem. It ensures that every merchant is correctly onboarded by gathering business-specific data and storing it for personalized sales incentive logic.

## 🚀 Key Features
* **Custom Onboarding Flow:** A tailored UI built with Shopify Polaris to collect merchant goals and details.
* **Database Integration:** Seamlessly syncs onboarding responses to a database using Prisma ORM.
* **Shopify Admin Embedded:** Operates entirely within the Shopify Admin for a native user experience.
* **Session Management:** Securely handles merchant sessions and OAuth requirements.

## 🛠 Tech Stack
* **Framework:** [Remix](https://remix.run/)
* **Styling:** [Shopify Polaris](https://polaris.shopify.com/)
* **Database:** Prisma (configured for SQLite in dev / PostgreSQL in prod)
* **API:** Shopify Admin GraphQL API

## ⚙️ Setup
1. Clone the repository.
2. Run `npm install`.
3. Link your Shopify Partner account: `npm run dev`.
4. Set up your `.env` variables (refer to `.env.example`).