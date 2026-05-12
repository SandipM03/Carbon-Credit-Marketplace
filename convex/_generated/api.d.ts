/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as inquiries from "../inquiries.js";
import type * as lands from "../lands.js";
import type * as listings from "../listings.js";
import type * as notifications from "../notifications.js";
import type * as purchaseRequests from "../purchaseRequests.js";
import type * as savedListings from "../savedListings.js";
import type * as trees from "../trees.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  inquiries: typeof inquiries;
  lands: typeof lands;
  listings: typeof listings;
  notifications: typeof notifications;
  purchaseRequests: typeof purchaseRequests;
  savedListings: typeof savedListings;
  trees: typeof trees;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
