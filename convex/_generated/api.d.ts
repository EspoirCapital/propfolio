/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts from "../accounts.js";
import type * as ai from "../ai.js";
import type * as auth from "../auth.js";
import type * as certificates from "../certificates.js";
import type * as clusters from "../clusters.js";
import type * as firms from "../firms.js";
import type * as http from "../http.js";
import type * as invites from "../invites.js";
import type * as migrations from "../migrations.js";
import type * as payouts from "../payouts.js";
import type * as seed from "../seed.js";
import type * as settings from "../settings.js";
import type * as templates from "../templates.js";
import type * as trades from "../trades.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  ai: typeof ai;
  auth: typeof auth;
  certificates: typeof certificates;
  clusters: typeof clusters;
  firms: typeof firms;
  http: typeof http;
  invites: typeof invites;
  migrations: typeof migrations;
  payouts: typeof payouts;
  seed: typeof seed;
  settings: typeof settings;
  templates: typeof templates;
  trades: typeof trades;
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
