"use client";

import { useMemo, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getSessionFromDocumentCookie } from "../lib/session";
import type { Id } from "../../convex/_generated/dataModel";

type ListingRecord = {
  _id: Id<"listings">;
  landId: Id<"lands">;
  creditsAvailable: number;
  price: number;
  duration: number;
  active: boolean;
  createdAt: number;
  createdBy: Id<"users">;
};

export default function AdminDashboard() {
  const session = getSessionFromDocumentCookie();
  const adminId = session?.role === "admin" ? (session.userId as Id<"users">) : null;
  const lands = useQuery(api.lands.listRecent);
  const listings = useQuery(api.listings.listAll, adminId ? { adminId } : "skip");
  const approve = useMutation(api.lands.approve);
  const reject = useMutation(api.lands.reject);
  const requestInfo = useMutation(api.lands.requestInfo);
  const setStatus = useMutation(api.lands.setStatus);
  const setAdminNotes = useMutation(api.lands.setAdminNotes);
  const setCarbonEstimate = useMutation(api.lands.setCarbonEstimate);
  const createListing = useMutation(api.listings.createFromLand);
  const setListingActive = useMutation(api.listings.setActive);
  const generateRecommendation = useAction(api.lands.generateRecommendation);
  const setRecommendationOverride = useMutation(api.lands.setRecommendationOverride);
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [draftCarbonFactor, setDraftCarbonFactor] = useState<Record<string, string>>({});
  const [draftTimeYears, setDraftTimeYears] = useState<Record<string, string>>({});
  const [draftEstimatedCredits, setDraftEstimatedCredits] = useState<
    Record<string, string>
  >({});
  const [draftListingPrice, setDraftListingPrice] = useState<Record<string, string>>({});
  const [draftRecommendedActions, setDraftRecommendedActions] = useState<
    Record<string, string>
  >({});
  const [draftListingCredits, setDraftListingCredits] = useState<
    Record<string, string>
  >({});
  const [draftListingDuration, setDraftListingDuration] = useState<
    Record<string, string>
  >({});
  const [overrideTrees, setOverrideTrees] = useState<Record<string, string>>({});
  const [overrideNotes, setOverrideNotes] = useState<Record<string, string>>({});
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [recommendationLoadingId, setRecommendationLoadingId] = useState<
    string | null
  >(null);
  const pendingCount = lands?.filter((land) => land.status === "pending").length ?? 0;

  const formatStatus = (status: string) => status.replace("_", " ");
  const getDraftNote = (id: string, fallback?: string) =>
    draftNotes[id] ?? fallback ?? "";
  const getDraftValue = (
    map: Record<string, string>,
    id: string,
    fallback?: number | string,
  ) => map[id] ?? (fallback !== undefined && fallback !== null ? String(fallback) : "");
  const getDraftCarbonFactor = (id: string, fallback?: number) =>
    getDraftValue(draftCarbonFactor, id, fallback);
  const getDraftTimeYears = (id: string, fallback?: number) =>
    getDraftValue(draftTimeYears, id, fallback);
  const getDraftEstimatedCredits = (id: string, fallback?: number) =>
    getDraftValue(draftEstimatedCredits, id, fallback);
  const getDraftListingPrice = (id: string, fallback?: number) =>
    getDraftValue(draftListingPrice, id, fallback);
  const getDraftListingCredits = (id: string, fallback?: number) =>
    getDraftValue(draftListingCredits, id, fallback);
  const getDraftListingDuration = (id: string, fallback?: number) =>
    getDraftValue(draftListingDuration, id, fallback);
  const getDraftRecommendedActions = (id: string, fallback?: string) =>
    getDraftValue(draftRecommendedActions, id, fallback);
  const getOverrideTrees = (id: string) => overrideTrees[id] ?? "";
  const getOverrideNote = (id: string) => overrideNotes[id] ?? "";

  const parseNumber = (value: string) => Number(value.trim());
  const parseActions = (value: string) =>
    value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);

  const listingByLandId = useMemo(() => {
    const map = new Map<string, ListingRecord>();
    listings?.forEach((listing) => {
      if (!map.has(listing.landId)) {
        map.set(listing.landId, listing as ListingRecord);
      }
    });
    return map;
  }, [listings]);

  const handleGenerateRecommendation = async (landId: Id<"lands">) => {
    if (!adminId) {
      setActionMessage("Admin session missing. Please login again.");
      return;
    }

    setRecommendationLoadingId(landId);
    try {
      await generateRecommendation({ id: landId });
      setActionMessage("Recommendation updated.");
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unable to generate recommendations.",
      );
    } finally {
      setRecommendationLoadingId(null);
    }
  };

  const handleOverrideRecommendation = async (landId: Id<"lands">) => {
    if (!adminId) {
      setActionMessage("Admin session missing. Please login again.");
      return;
    }

    const treeNames = getOverrideTrees(landId)
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (treeNames.length === 0) {
      setActionMessage("Add at least one tree name for override.");
      return;
    }

    try {
      await setRecommendationOverride({
        adminId,
        id: landId,
        trees: treeNames,
        note: getOverrideNote(landId).trim() || undefined,
      });
      setActionMessage("Recommendation override saved.");
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unable to save recommendation override.",
      );
    }
  };

  const handleSaveCarbonEstimate = async (landId: Id<"lands">) => {
    if (!adminId) {
      setActionMessage("Admin session missing. Please login again.");
      return;
    }

    const land = lands?.find((entry) => entry._id === landId);
    if (!land) {
      setActionMessage("Unable to find this land submission.");
      return;
    }

    const existing = land.carbonEstimate;
    const carbonFactorValue = parseNumber(
      getDraftCarbonFactor(landId, existing?.carbonFactor),
    );
    const timeYearsValue = parseNumber(
      getDraftTimeYears(landId, existing?.timeYears),
    );
    const estimatedCreditsValue = parseNumber(
      getDraftEstimatedCredits(landId, existing?.estimatedCredits),
    );
    const listingPriceValue = parseNumber(
      getDraftListingPrice(landId, existing?.listingPrice),
    );

    if (!Number.isFinite(carbonFactorValue) || carbonFactorValue <= 0) {
      setActionMessage("Enter a carbon factor greater than 0.");
      return;
    }
    if (!Number.isFinite(timeYearsValue) || timeYearsValue <= 0) {
      setActionMessage("Enter a time horizon greater than 0.");
      return;
    }
    if (!Number.isFinite(estimatedCreditsValue) || estimatedCreditsValue < 0) {
      setActionMessage("Enter estimated credits (0 or higher).");
      return;
    }
    if (!Number.isFinite(listingPriceValue) || listingPriceValue < 0) {
      setActionMessage("Enter a listing price (0 or higher).");
      return;
    }

    const recommendedActions = parseActions(
      getDraftRecommendedActions(
        landId,
        existing?.recommendedActions?.join("\n"),
      ),
    );

    try {
      await setCarbonEstimate({
        adminId,
        id: landId,
        carbonFactor: carbonFactorValue,
        timeYears: timeYearsValue,
        estimatedCredits: estimatedCreditsValue,
        listingPrice: listingPriceValue,
        recommendedActions,
      });
      setActionMessage("Carbon estimate and pricing saved.");
    } catch (error) {
      setActionMessage(
        error instanceof Error
          ? error.message
          : "Unable to save carbon estimate.",
      );
    }
  };

  const handlePublishListing = async (landId: Id<"lands">) => {
    if (!adminId) {
      setActionMessage("Admin session missing. Please login again.");
      return;
    }

    const land = lands?.find((entry) => entry._id === landId);
    if (!land) {
      setActionMessage("Unable to find this land submission.");
      return;
    }

    const creditsValue = parseNumber(
      getDraftListingCredits(landId, land.carbonEstimate?.estimatedCredits),
    );
    const durationValue = parseNumber(
      getDraftListingDuration(landId, land.carbonEstimate?.timeYears),
    );
    const priceValue = parseNumber(
      getDraftListingPrice(landId, land.carbonEstimate?.listingPrice),
    );

    if (!Number.isFinite(creditsValue) || creditsValue <= 0) {
      setActionMessage("Enter credits available greater than 0.");
      return;
    }
    if (!Number.isFinite(durationValue) || durationValue <= 0) {
      setActionMessage("Enter a listing duration greater than 0.");
      return;
    }
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      setActionMessage("Enter a listing price (0 or higher).");
      return;
    }

    try {
      await createListing({
        adminId,
        landId,
        creditsAvailable: creditsValue,
        price: priceValue,
        duration: durationValue,
      });
      setActionMessage("Listing published to marketplace.");
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : "Unable to publish listing.",
      );
    }
  };

  const guardMessage = !session
    ? "No active session. Please login to access admin actions."
    : session.role !== "admin"
      ? "This dashboard is for admin accounts only."
      : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 pb-16 pt-12">
      <header className="rounded-3xl border border-black/10 bg-white/80 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[color:var(--sun)]">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[color:var(--forest)]">
          Verification console
        </h1>
        <p className="mt-2 text-sm text-black/70">
          Review land submissions, approve carbon estimates, and publish listings.
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
              Pending land reviews
            </h2>
            <p className="text-sm text-black/60">
              Prioritize verification and set next steps for each submission.
            </p>
          </div>
          <span className="rounded-full bg-[color:var(--mist)] px-4 py-2 text-xs uppercase tracking-[0.3em] text-black/60">
            {pendingCount} pending
          </span>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-black/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-[color:var(--sand)] text-xs uppercase tracking-[0.3em] text-black/60">
              <tr>
                <th className="px-4 py-3">Land</th>
                <th className="px-4 py-3">Farmer</th>
                <th className="px-4 py-3">Area</th>
                <th className="px-4 py-3">Goal</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Admin notes</th>
                <th className="px-4 py-3">Carbon &amp; pricing</th>
                <th className="px-4 py-3">Recommendations</th>
                <th className="px-4 py-3">Listing</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {!lands && (
                <tr>
                  <td className="px-4 py-4 text-black/60" colSpan={10}>
                    Loading submissions...
                  </td>
                </tr>
              )}
              {lands?.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-black/60" colSpan={10}>
                    No pending submissions yet.
                  </td>
                </tr>
              )}
              {lands?.map((land) => {
                const carbonEstimate = land.carbonEstimate;
                const existingListing = listingByLandId.get(land._id);
                const carbonFactorValue = Number.parseFloat(
                  getDraftCarbonFactor(land._id, carbonEstimate?.carbonFactor),
                );
                const timeYearsValue = Number.parseFloat(
                  getDraftTimeYears(land._id, carbonEstimate?.timeYears),
                );
                const computedScore =
                  Number.isFinite(carbonFactorValue) &&
                  Number.isFinite(timeYearsValue)
                    ? land.totalArea * carbonFactorValue * timeYearsValue
                    : null;

                return (
                  <tr key={land._id} className="bg-white/60">
                  <td className="px-4 py-4 font-semibold text-[color:var(--forest)]">
                    {land.landName}
                  </td>
                  <td className="px-4 py-4 text-black/70">
                    <div className="font-semibold">{land.farmerName}</div>
                    <div className="text-xs text-black/50">{land.farmerPhone}</div>
                  </td>
                  <td className="px-4 py-4 text-black/70">
                    {land.totalArea} {land.areaUnit}
                  </td>
                  <td className="px-4 py-4 text-black/70">
                    {land.plantationGoal}
                  </td>
                  <td className="px-4 py-4 text-black/70">
                    {formatStatus(land.status)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-2">
                      <textarea
                        className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs"
                        rows={3}
                        value={getDraftNote(land._id, land.adminNotes)}
                        onChange={(event) =>
                          setDraftNotes((prev) => ({
                            ...prev,
                            [land._id]: event.target.value,
                          }))
                        }
                        placeholder="Add notes for the farmer..."
                      />
                        <button
                          className="self-start rounded-full border border-black/10 px-3 py-1 text-xs text-black/70"
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
                  </td>
                    <td className="px-4 py-4">
                      <div className="space-y-3 text-xs text-black/70">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.2em] text-black/50">
                            Current
                          </div>
                          {carbonEstimate ? (
                            <div className="mt-2 space-y-1">
                              <p>
                                Factor: {carbonEstimate.carbonFactor} | Time: {" "}
                                {carbonEstimate.timeYears}y
                              </p>
                              <p>Score: {carbonEstimate.estimatedScore}</p>
                              <p>Credits: {carbonEstimate.estimatedCredits}</p>
                              <p>Price: {carbonEstimate.listingPrice}</p>
                              {carbonEstimate.recommendedActions.length > 0 && (
                                <p>
                                  Actions: {" "}
                                  {carbonEstimate.recommendedActions.join(", ")}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="mt-2 text-xs text-black/60">
                              Not set yet.
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="text-[10px] uppercase tracking-[0.2em] text-black/50">
                            Estimate
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <input
                              className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs"
                              type="number"
                              min="0"
                              step="0.1"
                              value={getDraftCarbonFactor(
                                land._id,
                                carbonEstimate?.carbonFactor,
                              )}
                              onChange={(event) =>
                                setDraftCarbonFactor((prev) => ({
                                  ...prev,
                                  [land._id]: event.target.value,
                                }))
                              }
                              placeholder="Carbon factor"
                            />
                            <input
                              className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs"
                              type="number"
                              min="0"
                              step="1"
                              value={getDraftTimeYears(land._id, carbonEstimate?.timeYears)}
                              onChange={(event) =>
                                setDraftTimeYears((prev) => ({
                                  ...prev,
                                  [land._id]: event.target.value,
                                }))
                              }
                              placeholder="Time (years)"
                            />
                          </div>
                          <p className="text-[10px] text-black/50">
                            Score: {computedScore !== null ? computedScore.toFixed(2) : "--"}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <input
                            className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs"
                            type="number"
                            min="0"
                            step="1"
                            value={getDraftEstimatedCredits(
                              land._id,
                              carbonEstimate?.estimatedCredits,
                            )}
                            onChange={(event) =>
                              setDraftEstimatedCredits((prev) => ({
                                ...prev,
                                [land._id]: event.target.value,
                              }))
                            }
                            placeholder="Estimated credits"
                          />
                          <input
                            className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs"
                            type="number"
                            min="0"
                            step="0.01"
                            value={getDraftListingPrice(
                              land._id,
                              carbonEstimate?.listingPrice,
                            )}
                            onChange={(event) =>
                              setDraftListingPrice((prev) => ({
                                ...prev,
                                [land._id]: event.target.value,
                              }))
                            }
                            placeholder="Listing price"
                          />
                          <textarea
                            className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs"
                            rows={2}
                            value={getDraftRecommendedActions(
                              land._id,
                              carbonEstimate?.recommendedActions?.join("\n"),
                            )}
                            onChange={(event) =>
                              setDraftRecommendedActions((prev) => ({
                                ...prev,
                                [land._id]: event.target.value,
                              }))
                            }
                            placeholder="Recommended actions (one per line)"
                          />
                          <button
                            className="rounded-full border border-black/10 px-3 py-1 text-xs text-black/70"
                            type="button"
                            onClick={() => handleSaveCarbonEstimate(land._id)}
                          >
                            Save estimate
                          </button>
                        </div>
                      </div>
                    </td>
                  <td className="px-4 py-4 text-xs text-black/70">
                    <div className="space-y-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-black/50">
                          Current
                        </div>
                        {land.recommendation ? (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-black/80">
                              {land.recommendation.trees.map((tree) => tree.name).join(", ")}
                            </p>
                            <p className="mt-1 text-xs text-black/60">
                              Benefits: {land.recommendation.summaryBenefits.join(", ")}
                            </p>
                            <p className="text-xs text-black/60">
                              Maintenance: {land.recommendation.summaryMaintenance}
                            </p>
                            <p className="text-xs text-black/60">
                              Carbon potential: {land.recommendation.summaryCarbonPotential}
                            </p>
                            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-black/50">
                              {land.recommendation.source}
                            </p>
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-black/60">Not generated yet.</p>
                        )}
                        <button
                          className="mt-2 rounded-full border border-black/10 px-3 py-1 text-xs text-black/70"
                          type="button"
                          onClick={() => handleGenerateRecommendation(land._id)}
                          disabled={recommendationLoadingId === land._id}
                        >
                          {recommendationLoadingId === land._id
                            ? "Generating..."
                            : "Generate"}
                        </button>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-black/50">
                          Override
                        </div>
                        <input
                          className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs"
                          value={getOverrideTrees(land._id)}
                          onChange={(event) =>
                            setOverrideTrees((prev) => ({
                              ...prev,
                              [land._id]: event.target.value,
                            }))
                          }
                          placeholder="Neem, Mango"
                        />
                        <textarea
                          className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs"
                          rows={2}
                          value={getOverrideNote(land._id)}
                          onChange={(event) =>
                            setOverrideNotes((prev) => ({
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
                  </td>
                  <td className="px-4 py-4 text-xs text-black/70">
                    {existingListing ? (
                      <div className="space-y-2">
                        <p>
                          Credits: {existingListing.creditsAvailable} | Price: {existingListing.price}
                        </p>
                        <p>Duration: {existingListing.duration} years</p>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-black/50">
                          {existingListing.active ? "Active" : "Inactive"}
                        </p>
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
                      <div className="space-y-2">
                        <input
                          className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs"
                          type="number"
                          min="0"
                          step="1"
                          value={getDraftListingCredits(
                            land._id,
                            carbonEstimate?.estimatedCredits,
                          )}
                          onChange={(event) =>
                            setDraftListingCredits((prev) => ({
                              ...prev,
                              [land._id]: event.target.value,
                            }))
                          }
                          placeholder="Credits available"
                        />
                        <input
                          className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs"
                          type="number"
                          min="0"
                          step="0.01"
                          value={getDraftListingPrice(
                            land._id,
                            carbonEstimate?.listingPrice,
                          )}
                          onChange={(event) =>
                            setDraftListingPrice((prev) => ({
                              ...prev,
                              [land._id]: event.target.value,
                            }))
                          }
                          placeholder="Listing price"
                        />
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
                            setDraftListingDuration((prev) => ({
                              ...prev,
                              [land._id]: event.target.value,
                            }))
                          }
                          placeholder="Duration (years)"
                        />
                        <button
                          className="rounded-full bg-[color:var(--forest)] px-3 py-1 text-xs text-white"
                          type="button"
                          onClick={() => handlePublishListing(land._id)}
                        >
                          Publish listing
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2 text-xs">
                      {land.status === "pending" && (
                        <button
                          className="rounded-full border border-black/10 px-3 py-1 text-black/70"
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
                          Under review
                        </button>
                      )}
                      {(land.status === "pending" ||
                        land.status === "under_review") && (
                        <button
                          className="rounded-full border border-black/10 px-3 py-1 text-black/70"
                          type="button"
                          onClick={() => {
                            if (!adminId) {
                              setActionMessage("Admin session missing. Please login again.");
                              return;
                            }
                            void requestInfo({ adminId, id: land._id });
                          }}
                        >
                          Request info
                        </button>
                      )}
                      {(land.status === "pending" ||
                        land.status === "under_review" ||
                        land.status === "request_info") && (
                        <button
                          className="rounded-full bg-[color:var(--forest)] px-3 py-1 text-white"
                          type="button"
                          onClick={() => {
                            if (!adminId) {
                              setActionMessage("Admin session missing. Please login again.");
                              return;
                            }
                            void approve({ adminId, id: land._id });
                          }}
                        >
                          Approve
                        </button>
                      )}
                      {(land.status === "pending" ||
                        land.status === "under_review" ||
                        land.status === "request_info") && (
                        <button
                          className="rounded-full border border-black/10 px-3 py-1 text-black/70"
                          type="button"
                          onClick={() => {
                            if (!adminId) {
                              setActionMessage("Admin session missing. Please login again.");
                              return;
                            }
                            void reject({ adminId, id: land._id });
                          }}
                        >
                          Reject
                        </button>
                      )}
                      {land.status === "approved" && (
                        <button
                          className="rounded-full border border-black/10 px-3 py-1 text-black/70"
                          type="button"
                          onClick={() => {
                            if (!adminId) {
                              setActionMessage("Admin session missing. Please login again.");
                              return;
                            }
                            void setStatus({ adminId, id: land._id, status: "listed" });
                          }}
                        >
                          Mark listed
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
