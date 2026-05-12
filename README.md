# Carbon Credit Marketplace (GreenCredits)

GreenCredits is a role-based marketplace for carbon projects. Farmers register land, admins review and estimate credits, and buyers discover and request listed projects.

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Convex (database, queries, mutations, actions, file storage)
- Tailwind CSS 4
- Leaflet + react-leaflet + react-leaflet-draw (map-based land input)

## Roles and routes

- `/register`, `/login` - account onboarding and sign-in
- `/farmer` - land submissions and recommendation view
- `/admin` - land review, status updates, recommendations, and listing controls
- `/buyer` and `/buyer/[listingId]` - active listing feed and listing details
- `/notifications`, `/contact` - shared user support flows

## Environment variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url
GEMINI_API_KEY=optional_for_ai_tree_explanations
```

`GEMINI_API_KEY` is optional. Without it, the app still generates rule-based tree recommendations.

## Local development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run Convex in one terminal:
   ```bash
   npx convex dev
   ```
3. Run Next.js in another terminal:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000`.

## Available scripts

- `npm run dev` - start Next.js dev server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - run ESLint

## Data model summary (Convex)

Key tables are defined in `convex/schema.ts`:

- `users` - farmer, buyer, admin accounts
- `lands` - farmer-submitted land data, status, estimates, recommendations
- `trees` - seed tree dataset used for recommendation scoring
- `listings` - approved land converted into buyer-facing listings
- `purchaseRequests`, `savedListings`, `notifications`, `inquiries`

## Notes

- Session state is stored in browser cookies (`gc_user`, `gc_role`) for role-based navigation.
- Uploaded land images are stored in Convex storage and resolved to signed URLs in queries.
