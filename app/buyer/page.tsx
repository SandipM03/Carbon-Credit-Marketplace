"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getSessionFromDocumentCookie } from "../lib/session";
import type { Id } from "../../convex/_generated/dataModel";

export default function BuyerDashboard() {
  const listings = useQuery(api.listings.listActive);
  const session = getSessionFromDocumentCookie();
  const buyerId = session?.role === "buyer" ? (session.userId as Id<"users">) : null;
  const savedListings = useQuery(
    api.savedListings.listByBuyer,
    buyerId ? { buyerId } : "skip",
  );
  const purchaseRequests = useQuery(
    api.purchaseRequests.listByBuyer,
    buyerId ? { buyerId } : "skip",
  );
  const toggleSave = useMutation(api.savedListings.toggle);
  const [guardMessage] = useState<string | null>(() => {
    const session = getSessionFromDocumentCookie();
    if (!session) {
      return "No active session. Please login to access buyer actions.";
    }

    if (session.role !== "buyer") {
      return "This dashboard is for buyer accounts only.";
    }

    return null;
  });
  const [search, setSearch] = useState("");
  const [landType, setLandType] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");
  const [minCredits, setMinCredits] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const savedSet = useMemo(() => {
    if (!savedListings) {
      return new Set<string>();
    }
    return new Set(savedListings.map((entry) => entry.listingId));
  }, [savedListings]);

  const landTypes = useMemo(() => {
    if (!listings) {
      return [] as string[];
    }
    return Array.from(new Set(listings.map((entry) => entry.land.landType)));
  }, [listings]);

  const filteredListings = useMemo(() => {
    if (!listings) {
      return null;
    }

    const searchValue = search.trim().toLowerCase();
    const maxPriceValue = Number(maxPrice);
    const minCreditsValue = Number(minCredits);

    return listings.filter((entry) => {
      if (landType !== "all" && entry.land.landType !== landType) {
        return false;
      }
      if (Number.isFinite(maxPriceValue) && maxPriceValue > 0) {
        if (entry.price > maxPriceValue) {
          return false;
        }
      }
      if (Number.isFinite(minCreditsValue) && minCreditsValue > 0) {
        if (entry.creditsAvailable < minCreditsValue) {
          return false;
        }
      }
      if (searchValue) {
        const haystack = `${entry.land.landName} ${entry.land.landType} ${entry.land.plantationGoal}`
          .toLowerCase()
          .trim();
        if (!haystack.includes(searchValue)) {
          return false;
        }
      }
      return true;
    });
  }, [listings, landType, maxPrice, minCredits, search]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 pb-16 pt-12">
      <header className="rounded-3xl border border-black/10 bg-white/80 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[color:var(--clay)]">
          Buyer
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[color:var(--forest)]">
          Marketplace overview
        </h1>
        <p className="mt-2 text-sm text-black/70">
          Review verified listings, compare carbon estimates, and request purchases.
        </p>
      </header>

      {guardMessage && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-900">
          {guardMessage}
        </div>
      )}
      {actionMessage && (
        <div className="rounded-3xl border border-black/10 bg-white/80 px-6 py-4 text-sm text-black/70">
          {actionMessage}
        </div>
      )}

      <section className="rounded-3xl border border-black/10 bg-white/80 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[color:var(--forest)]">
              Verified listings
            </h2>
            <p className="text-sm text-black/60">
              Filter by land type, price, and estimated credits.
            </p>
          </div>
          <span className="rounded-full bg-[color:var(--mist)] px-4 py-2 text-xs uppercase tracking-[0.3em] text-black/60">
            {filteredListings?.length ?? 0} listings
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-black/50">
            Search
            <input
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-normal text-black/80"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Land name, goal"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-black/50">
            Land type
            <select
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-normal text-black/80"
              value={landType}
              onChange={(event) => setLandType(event.target.value)}
            >
              <option value="all">All types</option>
              {landTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-black/50">
            Max price
            <input
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-normal text-black/80"
              type="number"
              min="0"
              step="0.01"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="e.g. 2400"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-black/50">
            Min credits
            <input
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-normal text-black/80"
              type="number"
              min="0"
              step="1"
              value={minCredits}
              onChange={(event) => setMinCredits(event.target.value)}
              placeholder="e.g. 500"
            />
          </label>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {!filteredListings && (
            <div className="rounded-3xl border border-black/10 bg-white px-6 py-6 text-sm text-black/60">
              Loading listings...
            </div>
          )}
          {filteredListings?.length === 0 && (
            <div className="rounded-3xl border border-black/10 bg-white px-6 py-6 text-sm text-black/60">
              No listings match these filters yet.
            </div>
          )}
          {filteredListings?.map((entry) => (
            <article
              key={entry._id}
              className="grid gap-4 rounded-3xl border border-black/10 bg-white/80 p-5 sm:grid-cols-[140px_1fr]"
            >
              <div className="relative h-32 w-full overflow-hidden rounded-2xl bg-[color:var(--mist)]">
                {entry.imageUrls[0] ? (
                  <Image
                    src={entry.imageUrls[0]}
                    alt={entry.land.landName}
                    fill
                    sizes="(max-width: 640px) 100vw, 140px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-black/50">
                    No image
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-[color:var(--forest)]">
                      {entry.land.landName}
                    </h3>
                    <span className="rounded-full bg-[color:var(--mist)] px-3 py-1 text-xs text-black/60">
                      {entry.land.landType}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-black/60">
                    {entry.land.totalArea} {entry.land.areaUnit} - {entry.land.plantationGoal}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-black/60">
                  <div>
                    <p className="uppercase tracking-[0.2em]">Credits</p>
                    <p className="text-base font-semibold text-black/80">
                      {entry.creditsAvailable}
                    </p>
                  </div>
                  <div>
                    <p className="uppercase tracking-[0.2em]">Price</p>
                    <p className="text-base font-semibold text-black/80">
                      {entry.price}
                    </p>
                  </div>
                  <div>
                    <p className="uppercase tracking-[0.2em]">Duration</p>
                    <p className="text-base font-semibold text-black/80">
                      {entry.duration} yrs
                    </p>
                  </div>
                  <div>
                    <p className="uppercase tracking-[0.2em]">Status</p>
                    <p className="text-base font-semibold text-black/80">Listed</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <Link
                    href={`/buyer/${entry._id}`}
                    className="rounded-full bg-[color:var(--forest)] px-4 py-2 font-semibold text-white"
                  >
                    View details
                  </Link>
                  <button
                    type="button"
                    className="rounded-full border border-black/10 px-4 py-2 text-black/70"
                    onClick={async () => {
                      if (!buyerId) {
                        setActionMessage("Buyer session missing. Please login again.");
                        return;
                      }
                      try {
                        const result = await toggleSave({
                          buyerId,
                          listingId: entry._id,
                        });
                        setActionMessage(
                          result.saved
                            ? "Listing saved to your shortlist."
                            : "Listing removed from your shortlist.",
                        );
                      } catch (error) {
                        setActionMessage(
                          error instanceof Error
                            ? error.message
                            : "Unable to update saved listing.",
                        );
                      }
                    }}
                  >
                    {savedSet.has(entry._id) ? "Saved" : "Save"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white/80 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[color:var(--forest)]">
              Purchase requests
            </h2>
            <p className="text-sm text-black/60">
              Track your submitted requests and approval status.
            </p>
          </div>
          <span className="rounded-full bg-[color:var(--mist)] px-4 py-2 text-xs uppercase tracking-[0.3em] text-black/60">
            {purchaseRequests?.length ?? 0} requests
          </span>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-black/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-[color:var(--sand)] text-xs uppercase tracking-[0.3em] text-black/60">
              <tr>
                <th className="px-4 py-3">Listing</th>
                <th className="px-4 py-3">Land</th>
                <th className="px-4 py-3">Credits</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {!purchaseRequests && (
                <tr>
                  <td className="px-4 py-4 text-black/60" colSpan={5}>
                    Loading requests...
                  </td>
                </tr>
              )}
              {purchaseRequests?.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-black/60" colSpan={5}>
                    No purchase requests yet.
                  </td>
                </tr>
              )}
              {purchaseRequests?.map((request: any) => (
                <tr key={request._id} className="bg-white/60">
                  <td className="px-4 py-4">
                    <Link
                      href={`/buyer/${request.listingId}`}
                      className="font-semibold text-[color:var(--forest)]"
                    >
                      {request.listingId.slice(0, 6)}...
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-black/70">
                    {request.land.landName}
                  </td>
                  <td className="px-4 py-4 text-black/70">
                    {request.listing.creditsAvailable}
                  </td>
                  <td className="px-4 py-4 text-black/70">{request.listing.price}</td>
                  <td className="px-4 py-4 text-black/70">
                    {request.status.replace("_", " ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
