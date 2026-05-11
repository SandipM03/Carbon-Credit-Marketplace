# Carbon Credit Marketplace Platform – MVP PRD

## Product Name

GreenCredits (Working Title)

---

# 1. Vision

Build a scalable climate-tech platform that enables farmers to monetize unused or underutilized land through carbon credit generation while helping companies purchase verified carbon offsets.

The platform uses:

* Satellite-assisted land verification
* AI-based plantation recommendations
* Carbon estimation models
* A marketplace connecting farmers and buyers

---

# 2. Problem Statement

## Farmers

* Have unused or low-productivity land
* Lack access to carbon credit markets
* Do not know what trees/plants maximize value
* Have limited technical knowledge

## Companies

* Need carbon credits for ESG/sustainability goals
* Struggle to find transparent and verified carbon projects
* Existing systems are expensive and inaccessible

## Current Industry Problem

Traditional carbon verification:

* Requires physical surveys
* Is expensive
* Is slow
* Does not scale well for small farmers

---

# 3. MVP Goal

The MVP should validate:

1. Farmers are willing to register land
2. AI recommendations are useful
3. Buyers are interested in browsing carbon projects
4. Admin workflow can verify and manage land
5. Satellite/map-based visualization works

The MVP DOES NOT need:

* Government compliance
* Real certified carbon exchange integration
* Blockchain
* Scientific-grade carbon calculations
* Full automation

---

# 4. Target Users

## Farmer

People owning land who want to earn money from sustainable plantation and carbon credits.

## Buyer

Companies or individuals looking to purchase carbon credits.

## Admin

Internal team managing:

* Verification
* Recommendations
* Listings
* Carbon estimation
* Marketplace moderation

---

# 5. Product Architecture

## Mobile App

Used by:

* Farmers
* Buyers

Tech:

* React Native
* Expo
* TypeScript
* NativeWind

---

## Admin Dashboard

Used by:

* Admin Team

Tech:

* Next.js
* TypeScript
* Tailwind CSS
* shadcn/ui

---

## Backend

Tech:

* Convex

Responsibilities:

* Database
* Backend functions
* Authentication
* Real-time updates
* Storage

---

## Map & Satellite Layer

Tech:

* Mapbox

Features:

* Satellite view
* Land visualization
* Polygon selection
* GPS pinning

---

## AI Recommendation Engine

Tech:

* Gemini API

Purpose:

* Tree recommendations
* Plantation guidance
* Explanation generation

---

# 6. Incremental Development Plan

---

# PHASE 1 – Foundation Setup

## Goal

Set up the core application infrastructure.

---

## Features

### Authentication

Users can:

* Register
* Login
* Logout

Roles:

* Farmer
* Buyer
* Admin

---

## Information to Collect

### Common User Information

| Field         | Required |
| ------------- | -------- |
| Full Name     | Yes      |
| Mobile Number | Yes      |
| Email         | Optional |
| Role          | Yes      |
| Password/Auth | Yes      |

---

## Screens

### Mobile App

* Splash Screen
* Onboarding
* Login
* Register
* Role Selection

### Admin Dashboard

* Login

---

## Backend Requirements

### Database Tables

#### Users

```ts
{
  _id,
  name,
  phone,
  email,
  role,
  createdAt
}
```

---

## Deliverables

* Authentication working
* Role-based navigation
* Convex connected
* Mobile + Web setup completed

---

# PHASE 2 – Farmer Land Registration

## Goal

Allow farmers to register land.

---

## Features

### Add Land

Farmer submits land information.

---

## Information to Collect

| Field              | Type     | Required     |
| ------------------ | -------- | ------------ |
| Land Name          | Text     | Yes          |
| Total Area         | Number   | Yes          |
| Area Unit          | Dropdown | Yes          |
| Location           | GPS/Map  | Yes          |
| Land Polygon       | Map Draw | Optional MVP |
| Land Type          | Dropdown | Yes          |
| Soil Type          | Dropdown | Yes          |
| Water Availability | Dropdown | Yes          |
| Current Vegetation | Dropdown | Yes          |
| Plantation Goal    | Dropdown | Yes          |
| Tenure             | Number   | Yes          |
| Land Images        | Upload   | Optional     |
| Additional Notes   | Text     | Optional     |

---

## Dropdown Options

### Land Type

* Agricultural
* Barren
* Dry Land
* Wet Land
* Mixed

### Soil Type

* Sandy
* Clay
* Loamy
* Black Soil
* Red Soil

### Water Availability

* Low
* Medium
* High

### Plantation Goal

* Maximum Carbon Credits
* Fruit Income
* Timber Value
* Fast Growth
* Low Maintenance

### Existing Vegetation

* No Trees
* Few Trees
* Moderate Trees
* Dense Vegetation

---

## Screens

### Farmer App

* Farmer Dashboard
* Add Land Screen
* Map Selection Screen
* Upload Images Screen
* My Lands Screen
* Land Status Screen

---

## Backend Requirements

### Lands Table

```ts
{
  _id,
  farmerId,
  landName,
  totalArea,
  areaUnit,
  latitude,
  longitude,
  polygonCoordinates,
  landType,
  soilType,
  waterAvailability,
  vegetation,
  plantationGoal,
  tenure,
  images,
  status,
  createdAt
}
```

---

## Status Values

* Pending
* Under Review
* Approved
* Rejected
* Listed

---

## Deliverables

* Farmers can register land
* Land stored in database
* Admin can view submissions

---

# PHASE 3 – AI Tree Recommendation System

## Goal

Suggest suitable trees based on land data.

---

## Features

### Recommendation Engine

Generate:

* Suggested trees
* Benefits
* Maintenance tips
* Carbon potential

---

## AI Input Parameters

| Parameter          | Source     |
| ------------------ | ---------- |
| Location           | User Input |
| Soil Type          | User Input |
| Water Availability | User Input |
| Land Type          | User Input |
| Goal               | User Input |
| Area               | User Input |
| Tenure             | User Input |
| Vegetation         | User Input |

---

## Recommendation Logic

### Step 1

Rule-based filtering.

### Step 2

Gemini AI explains recommendations.

---

## Example Output

### Suggested Trees

* Neem
* Bamboo
* Mango

### Explanation

* Suitable for loamy soil
* Requires medium water
* Generates long-term carbon value
* Mango provides additional fruit income

---

## Backend Requirements

### Tree Dataset

```ts
{
  name,
  suitableSoils,
  waterRequirement,
  growthRate,
  carbonFactor,
  maintenanceLevel,
  suitableLandTypes,
  incomePotential
}
```

---

## Deliverables

* AI recommendations visible
* Basic tree dataset added
* Admin can override suggestions

---

# PHASE 4 – Admin Verification Dashboard

## Goal

Allow admin to review and manage lands.

---

## Features

### Admin Land Review

Admin can:

* View all land submissions
* Open satellite map
* View uploaded images
* Approve/reject land
* Add comments

---

## Carbon Estimation

Simple formula-based estimation.

### Formula

Estimated Carbon Score = Area × Carbon Factor × Time

---

## Admin Actions

* Approve land
* Reject land
* Request more information
* Add recommendations
* Set estimated carbon credits
* Set marketplace price

---

## Screens

### Admin Dashboard

* Overview
* Pending Lands
* Approved Lands
* Marketplace Listings
* Users Management
* Analytics

---

## Backend Requirements

### Carbon Estimates Table

```ts
{
  landId,
  estimatedCredits,
  estimatedCO2,
  treeSuggestions,
  recommendedActions,
  approvedBy,
  updatedAt
}
```

---

## Deliverables

* Admin review workflow working
* Approval system working
* Carbon estimate generation

---

# PHASE 5 – Carbon Marketplace

## Goal

Allow buyers to browse and purchase projects.

---

## Features

### Marketplace Feed

Show:

* Land image
* Location
* Carbon estimate
* Suggested trees
* Price
* Availability

---

## Buyer Actions

* Browse projects
* View details
* Save projects
* Send purchase request

---

## Information to Display

| Field                    |
| ------------------------ |
| Land Name                |
| Area                     |
| Estimated Carbon Credits |
| Suggested Trees          |
| Carbon Score             |
| Price                    |
| Project Duration         |
| Verification Status      |

---

## Screens

### Buyer App

* Marketplace Feed
* Search & Filter
* Project Details
* Purchase Request Screen
* My Purchases

---

## Backend Requirements

### Listings Table

```ts
{
  _id,
  landId,
  creditsAvailable,
  price,
  duration,
  active,
  createdAt
}
```

---

### Purchase Requests Table

```ts
{
  _id,
  buyerId,
  listingId,
  status,
  createdAt
}
```

---

## Deliverables

* Marketplace working
* Buyers can browse listings
* Purchase workflow functioning

---

# PHASE 6 – Maps & Satellite Integration

## Goal

Visualize land using maps.

---

## Features

### Satellite View

* Satellite imagery
* Map zoom
* Location markers

### Polygon Drawing

Farmer can:

* Draw land boundaries
* Save coordinates

---

## Tech

* Mapbox
* react-native-maps
* mapbox-gl

---

## Deliverables

* Map integration working
* Land boundaries viewable
* Satellite visualization enabled

---

# PHASE 7 – Notifications & Communication

## Goal

Keep users informed.

---

## Features

### Notifications

* Land approved
* Land rejected
* Buyer interest
* Recommendation updates

### Communication

* Contact admin
* Inquiry forms

---

## Deliverables

* Push notifications
* Status updates

---

# 7. Revenue Model

---

## Primary Revenue

### Transaction Commission

Example:

* Buyer pays ₹100
* Platform keeps 15%
* Farmer receives 85%

---

## Secondary Revenue

### Verification Fee

Optional verification/service fee.

### Subscription Plans

For companies:

* ESG analytics
* Reporting
* Dashboard access

---

# 8. MVP Scope Boundaries

---

## Included in MVP

* Authentication
* Land registration
* Admin verification
* AI recommendations
* Marketplace browsing
* Basic carbon estimation
* Map integration

---

## Excluded from MVP

* Blockchain
* Government certification
* Scientific carbon validation
* Drone integration
* IoT sensors
* Advanced AI/ML models
* Real carbon exchange integration
* Automated legal compliance

---

# 9. Suggested Tech Stack

## Mobile App

* React Native
* Expo
* TypeScript
* NativeWind

---

## Admin Dashboard

* Next.js
* Tailwind CSS
* shadcn/ui
* TypeScript

---

## Backend

* Convex

---

## Maps

* Mapbox

---

## AI

* Gemini API

---

## Deployment

### Frontend

* Vercel

### Backend

* Convex Cloud

---

# 10. Database Design

## Core Collections

### Users

### Lands

### Recommendations

### CarbonEstimates

### Listings

### Purchases

### Notifications

---

# 11. Future Roadmap

## Phase 2 Features

* NDVI analysis
* Satellite vegetation detection
* AI carbon prediction
* Drone monitoring
* Government integration
* Blockchain verification
* ESG analytics
* Automated compliance

---

# 12. Success Metrics

## Farmer Metrics

* Number of registered farmers
* Number of registered lands
* AI recommendation engagement

---

## Buyer Metrics

* Number of buyers
* Marketplace views
* Purchase requests

---

## Platform Metrics

* Verified land area
* Estimated carbon credits listed
* Revenue generated

---

# 13. Final MVP Objective

The MVP should demonstrate:

“Satellite-assisted land onboarding + AI tree recommendations + carbon marketplace workflow for small farmers.”

The main goal is validating demand and operational workflow, not scientific perfection.
