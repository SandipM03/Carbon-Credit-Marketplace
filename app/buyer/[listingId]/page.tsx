"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { getSessionFromDocumentCookie } from "../../lib/session";

export default function ListingDetailsPage() {
  const params = useParams();
  const rawListingId = params?.listingId;
  const listingId = Array.isArray(rawListingId) ? rawListingId[0] : rawListingId;
  const session = getSessionFromDocumentCookie();
  const buyerId = session?.role === "buyer" ? (session.userId as Id<"users">) : null;

  const listing = useQuery(
    api.listings.getById,
    listingId ? { id: listingId as Id<"listings"> } : "skip",
  );
  const savedListings = useQuery(
    api.savedListings.listByBuyer,
    buyerId ? { buyerId } : "skip",
  );
  const purchaseRequests = useQuery(
    api.purchaseRequests.listByBuyer,
    buyerId ? { buyerId } : "skip",
  );
  const toggleSave = useMutation(api.savedListings.toggle);
  const createRequest = useMutation(api.purchaseRequests.create);
  const withdrawRequest = useMutation(api.purchaseRequests.withdraw);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const guardMessage = useMemo(() => {
    if (!session) {
      return "No active session. Please login to access buyer actions.";
    }
    if (session.role !== "buyer") {
      return "This page is for buyer accounts only.";
    }
    return null;
  }, [session]);

  const isSaved = useMemo(() => {
    if (!savedListings || !listingId) {
      return false;
    }
    return savedListings.some((entry) => entry.listingId === listingId);
  }, [savedListings, listingId]);

  const currentRequest = useMemo(() => {
    if (!purchaseRequests || !listingId) {
      return null;
    }
    return purchaseRequests.find((request) => request.listingId === listingId) ?? null;
  }, [purchaseRequests, listingId]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 pb-16 pt-12">
      <header className="rounded-3xl border border-black/10 bg-white/80 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[color:var(--clay)]">
              Buyer
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[color:var(--forest)]">
              Project details
            </h1>
              <p className="mt-2 text-sm text-black/60">
                {listing.land.landType} - {listing.land.totalArea} {listing.land.areaUnit}
            className="rounded-full border border-black/15 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/70"
          >
            Back to listings
          </Link>
        </div>
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

      {!listing && (
        <div className="rounded-3xl border border-black/10 bg-white/80 px-6 py-6 text-sm text-black/60">
          Loading listing details...
        </div>
      )}

      {listing && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-black/10 bg-white/80 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1].map((index) => (
                <div
                  key={index}
                  className="relative h-40 w-full overflow-hidden rounded-2xl bg-[color:var(--mist)]"
                >
                  {listing.imageUrls[index] ? (
                    <Image
                      src={listing.imageUrls[index]}
                      alt={listing.land.landName}
                      fill
                      sizes="(max-width: 1024px) 50vw, 40vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-black/50">
                      No image
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6">
              <h2 className="text-2xl font-semibold text-[color:var(--forest)]">
                {listing.land.landName}
              </h2>
              <p className="mt-2 text-sm text-black/60">
                {listing.land.landType}  {listing.land.totalArea} {listing.land.areaUnit}
                  <p>
                    Maintenance: {listing.land.recommendation.summaryMaintenance} -
                    Carbon: {listing.land.recommendation.summaryCarbonPotential}
                  </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-black/70">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-black/50">Credits</p>
                <p className="text-lg font-semibold text-black/80">
                  {listing.creditsAvailable}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-black/50">Price</p>
                <p className="text-lg font-semibold text-black/80">{listing.price}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-black/50">Duration</p>
                <p className="text-lg font-semibold text-black/80">{listing.duration} yrs</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-black/50">Location</p>
                <p className="text-sm text-black/70">
                  {listing.land.latitude.toFixed(3)}, {listing.land.longitude.toFixed(3)}
                </p>
              </div>
            </div>

            {listing.land.carbonEstimate && (
              <div className="mt-6 rounded-2xl border border-black/10 bg-[color:var(--mist)] p-4 text-sm text-black/70">
                <p className="text-xs uppercase tracking-[0.2em] text-black/50">
                  Carbon estimate
                </p>
                <p className="mt-2">
                  Score: {listing.land.carbonEstimate.estimatedScore}
                </p>
                <p>Credits: {listing.land.carbonEstimate.estimatedCredits}</p>
                <p>Price guidance: {listing.land.carbonEstimate.listingPrice}</p>
              </div>
            )}
          </section>

          <aside className="flex flex-col gap-6">
            <section className="rounded-3xl border border-black/10 bg-white/80 p-6">
              <h3 className="text-lg font-semibold text-[color:var(--forest)]">
                Actions
              </h3>
              <div className="mt-4 flex flex-col gap-3">
                <button
                  type="button"
                  className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold text-black/70"
                  onClick={async () => {
                    if (!buyerId) {
                      setActionMessage("Buyer session missing. Please login again.");
                      return;
                    }
                    try {
                      const result = await toggleSave({
                        buyerId,
                        listingId: listing._id,
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
                  {isSaved ? "Saved" : "Save listing"}
                </button>
                {currentRequest?.status === "submitted" && (
                  <button
                    type="button"
                    className="rounded-full border border-black/15 px-4 py-2 text-sm text-black/70"
                    onClick={async () => {
                      if (!buyerId) {
                        setActionMessage("Buyer session missing. Please login again.");
                        return;
                      }
                      try {
                        await withdrawRequest({
                          buyerId,
                          requestId: currentRequest._id,
                        });
                        setActionMessage("Purchase request withdrawn.");
                      } catch (error) {
                        setActionMessage(
                          error instanceof Error
                            ? error.message
                            : "Unable to withdraw purchase request.",
                        );
                      }
                    }}
                  >
                    Withdraw request
                  </button>
                )}
                {(!currentRequest ||
                  currentRequest.status === "rejected" ||
                  currentRequest.status === "withdrawn") && (
                  <button
                    type="button"
                    className="rounded-full bg-[color:var(--forest)] px-4 py-2 text-sm font-semibold text-white"
                    onClick={async () => {
                      if (!buyerId) {
                        setActionMessage("Buyer session missing. Please login again.");
                        return;
                      }
                      try {
                        await createRequest({
                          buyerId,
                          listingId: listing._id,
                        });
                        setActionMessage("Purchase request submitted.");
                      } catch (error) {
                        setActionMessage(
                          error instanceof Error
                            ? error.message
                            : "Unable to submit purchase request.",
                        );
                      }
                    }}
                  >
                    Request purchase
                  </button>
                )}
                {currentRequest && currentRequest.status === "approved" && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    Request approved. Our team will contact you with next steps.
                  </div>
                )}
                {currentRequest && currentRequest.status === "rejected" && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                    Request rejected. You can update and submit again.
                  </div>
                )}
                {currentRequest && currentRequest.status === "withdrawn" && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Request withdrawn. Submit again when ready.
                  </div>
                )}
                {currentRequest && currentRequest.status === "submitted" && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    Request submitted. Awaiting review.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-black/10 bg-white/80 p-6">
              <h3 className="text-lg font-semibold text-[color:var(--forest)]">
                Tree recommendations
              </h3>
              {listing.land.recommendation ? (
                <div className="mt-4 space-y-3 text-sm text-black/70">
                  <p className="font-semibold text-[color:var(--forest)]">
                    {listing.land.recommendation.trees.map((tree) => tree.name).join(", ")}
                  </p>
                  <p>Benefits: {listing.land.recommendation.summaryBenefits.join(", ")}</p>
                  <p>
                    Maintenance: {listing.land.recommendation.summaryMaintenance} 
                    Carbon: {listing.land.recommendation.summaryCarbonPotential}
                  </p>
                  <p className="text-black/60">
                    {listing.land.recommendation.explanation}
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-black/60">No recommendations yet.</p>
              )}
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
