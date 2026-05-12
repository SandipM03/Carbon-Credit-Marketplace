"use client";

import type { Id } from "../../convex/_generated/dataModel";
import type { Land } from "../../convex/schema";

interface LandDetailPanelProps {
  land: Land & { _id: Id<"lands"> };
  carbonEstimate: Land["carbonEstimate"];
  existingListing: any;
  adminId: Id<"users"> | null;
  actionMessage: string | null;
  recommendationLoadingId: string | null;
  draftNotes: Record<string, string>;
  setDraftNotes: (value: any) => void;
  draftCarbonFactor: Record<string, string>;
  setDraftCarbonFactor: (value: any) => void;
  draftTimeYears: Record<string, string>;
  setDraftTimeYears: (value: any) => void;
  draftEstimatedCredits: Record<string, string>;
  setDraftEstimatedCredits: (value: any) => void;
  draftListingPrice: Record<string, string>;
  setDraftListingPrice: (value: any) => void;
  draftRecommendedActions: Record<string, string>;
  setDraftRecommendedActions: (value: any) => void;
  draftListingCredits: Record<string, string>;
  setDraftListingCredits: (value: any) => void;
  draftListingDuration: Record<string, string>;
  setDraftListingDuration: (value: any) => void;
  overrideTrees: Record<string, string>;
  setOverrideTrees: (value: any) => void;
  overrideNotes: Record<string, string>;
  setOverrideNotes: (value: any) => void;
  setActionMessage: (message: string | null) => void;
  setRecommendationLoadingId: (id: string | null) => void;
  getDraftNote: (id: string, fallback?: string) => string;
  getDraftCarbonFactor: (id: string, fallback?: number) => string;
  getDraftTimeYears: (id: string, fallback?: number) => string;
  getDraftEstimatedCredits: (id: string, fallback?: number) => string;
  getDraftListingPrice: (id: string, fallback?: number) => string;
  getDraftListingCredits: (id: string, fallback?: number) => string;
  getDraftListingDuration: (id: string, fallback?: number) => string;
  getDraftRecommendedActions: (id: string, fallback?: string) => string;
  getOverrideTrees: (id: string) => string;
  getOverrideNote: (id: string) => string;
  parseNumber: (value: string) => number;
  parseActions: (value: string) => string[];
  handleGenerateRecommendation: (landId: Id<"lands">) => Promise<void>;
  handleOverrideRecommendation: (landId: Id<"lands">) => Promise<void>;
  handleSaveCarbonEstimate: (landId: Id<"lands">) => Promise<void>;
  handlePublishListing: (landId: Id<"lands">) => Promise<void>;
  approve: any;
  reject: any;
  requestInfo: any;
  setStatus: any;
  setAdminNotes: any;
  setListingActive: any;
}

export function LandDetailPanel({
  land,
  carbonEstimate,
  existingListing,
  adminId,
  actionMessage,
  recommendationLoadingId,
  draftNotes,
  setDraftNotes,
  draftCarbonFactor,
  setDraftCarbonFactor,
  draftTimeYears,
  setDraftTimeYears,
  draftEstimatedCredits,
  setDraftEstimatedCredits,
  draftListingPrice,
  setDraftListingPrice,
  draftRecommendedActions,
  setDraftRecommendedActions,
  draftListingCredits,
  setDraftListingCredits,
  draftListingDuration,
  setDraftListingDuration,
  overrideTrees,
  setOverrideTrees,
  overrideNotes,
  setOverrideNotes,
  setActionMessage,
  setRecommendationLoadingId,
  getDraftNote,
  getDraftCarbonFactor,
  getDraftTimeYears,
  getDraftEstimatedCredits,
  getDraftListingPrice,
  getDraftListingCredits,
  getDraftListingDuration,
  getDraftRecommendedActions,
  getOverrideTrees,
  getOverrideNote,
  parseNumber,
  parseActions,
  handleGenerateRecommendation,
  handleOverrideRecommendation,
  handleSaveCarbonEstimate,
  handlePublishListing,
  approve,
  reject,
  requestInfo,
  setStatus,
  setAdminNotes,
  setListingActive,
}: LandDetailPanelProps) {
  const carbonFactorValue = Number.parseFloat(
    getDraftCarbonFactor(land._id, carbonEstimate?.carbonFactor),
  );
  const timeYearsValue = Number.parseFloat(
    getDraftTimeYears(land._id, carbonEstimate?.timeYears),
  );
  const computedScore =
    Number.isFinite(carbonFactorValue) && Number.isFinite(timeYearsValue)
      ? land.totalArea * carbonFactorValue * timeYearsValue
      : null;

  return (
    <div className="space-y-6">
      {/* Admin Notes Section */}
      <div className="rounded-2xl border border-black/10 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-[color:var(--forest)]">
          Admin notes
        </h3>
        <textarea
          className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs"
          rows={3}
          value={getDraftNote(land._id, land.adminNotes)}
          onChange={(event) =>
            setDraftNotes((prev: any) => ({
              ...prev,
              [land._id]: event.target.value,
            }))
          }
          placeholder="Add notes for the farmer..."
        />
        <button
          className="mt-2 rounded-full border border-black/10 px-3 py-1 text-xs text-black/70"
          type="button"
          onClick={() => {
            if (!adminId) {
              setActionMessage("Admin session missing. Please login again.");
              return;
            }
            void setAdminNotes({
              adminId,
              id: land._id,
              adminNotes: getDraftNote(
                land._id,
                land.adminNotes,
              ).trim() || undefined,
            });
          }}
        >
          Save notes
        </button>
      </div>

      {/* Carbon & Pricing Section */}
      <div className="rounded-2xl border border-black/10 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-[color:var(--forest)]">
          Carbon estimate & pricing
        </h3>
        <div className="space-y-3 text-xs text-black/70">
          {carbonEstimate && (
            <div className="rounded-2xl bg-black/5 p-3">
              <p className="font-semibold uppercase tracking-[0.2em] text-black/50">
                Current values
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] text-black/50">Carbon Factor</p>
                  <p className="font-semibold">{carbonEstimate.carbonFactor}</p>
                </div>
                <div>
                  <p className="text-[10px] text-black/50">Time (years)</p>
                  <p className="font-semibold">{carbonEstimate.timeYears}</p>
                </div>
                <div>
                  <p className="text-[10px] text-black/50">Est. Credits</p>
                  <p className="font-semibold">{carbonEstimate.estimatedCredits}</p>
                </div>
                <div>
                  <p className="text-[10px] text-black/50">Listing Price</p>
                  <p className="font-semibold">${carbonEstimate.listingPrice}</p>
                </div>
              </div>
            </div>
          )}
          <div>
            <p className="mb-2 font-semibold uppercase tracking-[0.2em] text-black/50">
              New estimate
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs"
                type="number"
                min="0"
                step="0.1"
                value={getDraftCarbonFactor(land._id, carbonEstimate?.carbonFactor)}
                onChange={(event) =>
                  setDraftCarbonFactor((prev: any) => ({
                    ...prev,
                    [land._id]: event.target.value,
                  }))
                }
                placeholder="Carbon factor"
              />
              <input
                className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs"
                type="number"
                min="0"
                step="1"
                value={getDraftTimeYears(land._id, carbonEstimate?.timeYears)}
                onChange={(event) =>
                  setDraftTimeYears((prev: any) => ({
                    ...prev,
                    [land._id]: event.target.value,
                  }))
                }
                placeholder="Time (years)"
              />
            </div>
            <p className="mt-2 text-[10px] text-black/50">
              Computed score: {computedScore !== null ? computedScore.toFixed(2) : "--"}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <input
                className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs"
                type="number"
                min="0"
                step="1"
                value={getDraftEstimatedCredits(
                  land._id,
                  carbonEstimate?.estimatedCredits,
                )}
                onChange={(event) =>
                  setDraftEstimatedCredits((prev: any) => ({
                    ...prev,
                    [land._id]: event.target.value,
                  }))
                }
                placeholder="Estimated credits"
              />
              <input
                className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs"
                type="number"
                min="0"
                step="0.01"
                value={getDraftListingPrice(
                  land._id,
                  carbonEstimate?.listingPrice,
                )}
                onChange={(event) =>
                  setDraftListingPrice((prev: any) => ({
                    ...prev,
                    [land._id]: event.target.value,
                  }))
                }
                placeholder="Listing price"
              />
            </div>
            <textarea
              className="mt-3 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs"
              rows={2}
              value={getDraftRecommendedActions(
                land._id,
                carbonEstimate?.recommendedActions?.join("\n"),
              )}
              onChange={(event) =>
                setDraftRecommendedActions((prev: any) => ({
                  ...prev,
                  [land._id]: event.target.value,
                }))
              }
              placeholder="Recommended actions (one per line)"
            />
            <button
              className="mt-2 rounded-full border border-black/10 px-3 py-1 text-xs text-black/70"
              type="button"
              onClick={() => handleSaveCarbonEstimate(land._id)}
            >
              Save estimate
            </button>
          </div>
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="rounded-2xl border border-black/10 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-[color:var(--forest)]">
          Recommendations
        </h3>
        <div className="space-y-3 text-xs text-black/70">
          {land.recommendation && (
            <div className="rounded-2xl bg-black/5 p-3">
              <p className="font-semibold uppercase tracking-[0.2em] text-black/50">
                Current recommendation
              </p>
              <p className="mt-2 text-xs font-semibold text-black/80">
                {land.recommendation.trees.map((tree) => tree.name).join(", ")}
              </p>
              <div className="mt-2 text-[10px] text-black/60">
                <p>
                  <span className="font-semibold">Benefits:</span> {land.recommendation.summaryBenefits.join(", ")}
                </p>
                <p>
                  <span className="font-semibold">Maintenance:</span> {land.recommendation.summaryMaintenance}
                </p>
                <p>
                  <span className="font-semibold">Carbon Potential:</span> {land.recommendation.summaryCarbonPotential}
                </p>
              </div>
            </div>
          )}
          <button
            className="rounded-full border border-black/10 px-3 py-1 text-xs text-black/70"
            type="button"
            onClick={() => handleGenerateRecommendation(land._id)}
            disabled={recommendationLoadingId === land._id}
          >
            {recommendationLoadingId === land._id
              ? "Generating..."
              : "Generate recommendation"}
          </button>
          <div className="mt-3">
            <p className="mb-2 font-semibold uppercase tracking-[0.2em] text-black/50">
              Override
            </p>
            <input
              className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs"
              value={getOverrideTrees(land._id)}
              onChange={(event) =>
                setOverrideTrees((prev: any) => ({
                  ...prev,
                  [land._id]: event.target.value,
                }))
              }
              placeholder="Tree names (comma-separated)"
            />
            <textarea
              className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs"
              rows={2}
              value={getOverrideNote(land._id)}
              onChange={(event) =>
                setOverrideNotes((prev: any) => ({
                  ...prev,
                  [land._id]: event.target.value,
                }))
              }
              placeholder="Optional admin note"
            />
            <button
              className="mt-2 rounded-full border border-black/10 px-3 py-1 text-xs text-black/70"
              type="button"
              onClick={() => handleOverrideRecommendation(land._id)}
            >
              Save override
            </button>
          </div>
        </div>
      </div>

      {/* Listing Section */}
      <div className="rounded-2xl border border-black/10 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-[color:var(--forest)]">
          Marketplace listing
        </h3>
        {existingListing ? (
          <div className="space-y-2 text-xs text-black/70">
            <div className="rounded-2xl bg-black/5 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/50">
                Published
              </p>
              <div className="mt-2 space-y-1 text-xs">
                <p>
                  <span className="font-semibold">Credits:</span> {existingListing.creditsAvailable}
                </p>
                <p>
                  <span className="font-semibold">Price:</span> ${existingListing.price}
                </p>
                <p>
                  <span className="font-semibold">Duration:</span> {existingListing.duration} years
                </p>
                <p>
                  <span className="font-semibold">Status:</span>{" "}
                  <span
                    className={
                      existingListing.active
                        ? "font-semibold text-emerald-700"
                        : "font-semibold text-amber-700"
                    }
                  >
                    {existingListing.active ? "Active" : "Inactive"}
                  </span>
                </p>
              </div>
            </div>
            <button
              className="rounded-full border border-black/10 px-3 py-1 text-xs text-black/70"
              type="button"
              onClick={() => {
                if (!adminId) {
                  setActionMessage(
                    "Admin session missing. Please login again.",
                  );
                  return;
                }
                void setListingActive({
                  adminId,
                  listingId: existingListing._id,
                  active: !existingListing.active,
                });
              }}
            >
              {existingListing.active ? "Deactivate" : "Activate"}
            </button>
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs"
                type="number"
                min="0"
                step="1"
                value={getDraftListingCredits(
                  land._id,
                  carbonEstimate?.estimatedCredits,
                )}
                onChange={(event) =>
                  setDraftListingCredits((prev: any) => ({
                    ...prev,
                    [land._id]: event.target.value,
                  }))
                }
                placeholder="Credits available"
              />
              <input
                className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs"
                type="number"
                min="0"
                step="0.01"
                value={getDraftListingPrice(
                  land._id,
                  carbonEstimate?.listingPrice,
                )}
                onChange={(event) =>
                  setDraftListingPrice((prev: any) => ({
                    ...prev,
                    [land._id]: event.target.value,
                  }))
                }
                placeholder="Listing price"
              />
            </div>
            <input
              className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs"
              type="number"
              min="0"
              step="1"
              value={getDraftListingDuration(
                land._id,
                carbonEstimate?.timeYears,
              )}
              onChange={(event) =>
                setDraftListingDuration((prev: any) => ({
                  ...prev,
                  [land._id]: event.target.value,
                }))
              }
              placeholder="Duration (years)"
            />
            <button
              className="w-full rounded-full bg-[color:var(--forest)] px-3 py-1.5 text-xs font-semibold text-white"
              type="button"
              onClick={() => handlePublishListing(land._id)}
            >
              Publish listing
            </button>
          </div>
        )}
      </div>

      {/* Status Actions Section */}
      <div className="rounded-2xl border border-black/10 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-[color:var(--forest)]">
          Status & approval
        </h3>
        <div className="flex flex-wrap gap-2 text-xs">
          {land.status === "pending" && (
            <button
              className="rounded-full border border-black/10 px-3 py-1.5 text-black/70 hover:bg-black/5"
              type="button"
              onClick={() => {
                if (!adminId) {
                  setActionMessage("Admin session missing. Please login again.");
                  return;
                }
                void setStatus({
                  adminId,
                  id: land._id,
                  status: "under_review",
                });
              }}
            >
              Mark under review
            </button>
          )}
          {(land.status === "pending" ||
            land.status === "under_review") && (
            <button
              className="rounded-full border border-black/10 px-3 py-1.5 text-black/70 hover:bg-black/5"
              type="button"
              onClick={() => {
                if (!adminId) {
                  setActionMessage("Admin session missing. Please login again.");
                  return;
                }
                void requestInfo({ adminId, id: land._id });
              }}
            >
              Request more info
            </button>
          )}
          {(land.status === "pending" ||
            land.status === "under_review" ||
            land.status === "request_info") && (
            <>
              <button
                className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                type="button"
                onClick={() => {
                  if (!adminId) {
                    setActionMessage("Admin session missing. Please login again.");
                    return;
                  }
                  void approve({ adminId, id: land._id });
                }}
              >
                ✓ Approve
              </button>
              <button
                className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                type="button"
                onClick={() => {
                  if (!adminId) {
                    setActionMessage("Admin session missing. Please login again.");
                    return;
                  }
                  void reject({ adminId, id: land._id });
                }}
              >
                ✕ Reject
              </button>
            </>
          )}
          {land.status === "approved" && (
            <button
              className="rounded-full border border-black/10 px-3 py-1.5 text-black/70 hover:bg-black/5"
              type="button"
              onClick={() => {
                if (!adminId) {
                  setActionMessage("Admin session missing. Please login again.");
                  return;
                }
                void setStatus({ adminId, id: land._id, status: "listed" });
              }}
            >
              Mark as listed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
