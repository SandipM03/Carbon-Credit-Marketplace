"use client";

import { useEffect, useMemo, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getSessionFromDocumentCookie } from "../lib/session";
import { LandDetailPanel } from "./LandDetailPanel";
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
  const [session, setSession] = useState<{ userId: string; role: "farmer" | "buyer" | "admin" } | null>(null);

  useEffect(() => {
    setSession(getSessionFromDocumentCookie());
  }, []);

  const adminId = session?.role === "admin" ? (session.userId as Id<"users">) : null;
  const lands = useQuery(api.lands.listRecent);
  const listings = useQuery(api.listings.listAll, adminId ? { adminId } : "skip");
  const inquiries = useQuery(api.inquiries.listForAdmin, adminId ? { adminId } : "skip");
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
  const [expandedLandId, setExpandedLandId] = useState<string | null>(null);
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
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Est. Credits</th>
                <th className="px-4 py-3">Listing</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {!lands && (
                <tr>
                  <td className="px-4 py-4 text-black/60" colSpan={7}>
                    Loading submissions...
                  </td>
                </tr>
              )}
              {lands?.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-black/60" colSpan={7}>
                    No pending submissions yet.
                  </td>
                </tr>
              )}
              {lands?.map((land) => {
                const carbonEstimate = land.carbonEstimate;
                const existingListing = listingByLandId.get(land._id);
                const isExpanded = expandedLandId === land._id;

                return (
                  <>
                    <tr key={land._id} className="bg-white/60 hover:bg-white/80 transition">
                      <td className="px-4 py-4 font-semibold text-[color:var(--forest)]">
                        {land.landName}
                      </td>
                      <td className="px-4 py-4 text-black/70">
                        <div className="font-semibold text-sm">{land.farmerName}</div>
                        <div className="text-xs text-black/50">{land.farmerPhone}</div>
                      </td>
                      <td className="px-4 py-4 text-black/70">
                        {land.totalArea} {land.areaUnit}
                      </td>
                      <td className="px-4 py-4 text-black/70 text-sm">
                        <span className="inline-block rounded-full bg-black/5 px-2 py-1">
                          {formatStatus(land.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-black/70 text-sm">
                        {carbonEstimate
                          ? `${carbonEstimate.estimatedCredits} cr.`
                          : "Not set"}
                      </td>
                      <td className="px-4 py-4 text-black/70 text-sm">
                        {existingListing
                          ? `${existingListing.creditsAvailable} cr. @ $${existingListing.price}`
                          : "Not published"}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          className="rounded-full border border-black/10 px-3 py-1 text-xs text-black/70 hover:bg-black/5"
                          type="button"
                          onClick={() =>
                            setExpandedLandId(isExpanded ? null : land._id)
                          }
                        >
                          {isExpanded ? "Close" : "Expand"}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-white/40">
                        <td colSpan={7} className="px-6 py-6">
                          <LandDetailPanel
                            land={land}
                            carbonEstimate={carbonEstimate}
                            existingListing={existingListing}
                            adminId={adminId}
                            actionMessage={actionMessage}
                            recommendationLoadingId={recommendationLoadingId}
                            draftNotes={draftNotes}
                            setDraftNotes={setDraftNotes}
                            draftCarbonFactor={draftCarbonFactor}
                            setDraftCarbonFactor={setDraftCarbonFactor}
                            draftTimeYears={draftTimeYears}
                            setDraftTimeYears={setDraftTimeYears}
                            draftEstimatedCredits={draftEstimatedCredits}
                            setDraftEstimatedCredits={setDraftEstimatedCredits}
                            draftListingPrice={draftListingPrice}
                            setDraftListingPrice={setDraftListingPrice}
                            draftRecommendedActions={draftRecommendedActions}
                            setDraftRecommendedActions={setDraftRecommendedActions}
                            draftListingCredits={draftListingCredits}
                            setDraftListingCredits={setDraftListingCredits}
                            draftListingDuration={draftListingDuration}
                            setDraftListingDuration={setDraftListingDuration}
                            overrideTrees={overrideTrees}
                            setOverrideTrees={setOverrideTrees}
                            overrideNotes={overrideNotes}
                            setOverrideNotes={setOverrideNotes}
                            setActionMessage={setActionMessage}
                            setRecommendationLoadingId={setRecommendationLoadingId}
                            getDraftNote={getDraftNote}
                            getDraftCarbonFactor={getDraftCarbonFactor}
                            getDraftTimeYears={getDraftTimeYears}
                            getDraftEstimatedCredits={getDraftEstimatedCredits}
                            getDraftListingPrice={getDraftListingPrice}
                            getDraftListingCredits={getDraftListingCredits}
                            getDraftListingDuration={getDraftListingDuration}
                            getDraftRecommendedActions={getDraftRecommendedActions}
                            getOverrideTrees={getOverrideTrees}
                            getOverrideNote={getOverrideNote}
                            parseNumber={parseNumber}
                            parseActions={parseActions}
                            handleGenerateRecommendation={handleGenerateRecommendation}
                            handleOverrideRecommendation={handleOverrideRecommendation}
                            handleSaveCarbonEstimate={handleSaveCarbonEstimate}
                            handlePublishListing={handlePublishListing}
                            approve={approve}
                            reject={reject}
                            requestInfo={requestInfo}
                            setStatus={setStatus}
                            setAdminNotes={setAdminNotes}
                            setListingActive={setListingActive}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white/80 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[color:var(--forest)]">
              Inquiries
            </h2>
            <p className="text-sm text-black/60">
              User questions and support requests.
            </p>
          </div>
          <span className="rounded-full bg-[color:var(--mist)] px-4 py-2 text-xs uppercase tracking-[0.3em] text-black/60">
            {inquiries?.length ?? 0} messages
          </span>
        </div>

        <div className="mt-6 space-y-3">
          {!inquiries && (
            <div className="rounded-2xl border border-black/10 bg-white px-6 py-6 text-sm text-black/60">
              Loading inquiries...
            </div>
          )}
          {inquiries?.length === 0 && (
            <div className="rounded-2xl border border-black/10 bg-white px-6 py-6 text-sm text-black/60">
              No inquiries yet.
            </div>
          )}
          {inquiries?.map((inquiry) => (
            <div key={inquiry._id} className="rounded-2xl border border-black/10 bg-white p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-[color:var(--forest)]">
                    {inquiry.user.name} ({inquiry.role})
                  </p>
                  <p className="text-sm font-semibold text-black/80 mt-1">
                    {inquiry.subject}
                  </p>
                  <p className="text-sm text-black/60 mt-1">{inquiry.message}</p>
                  <p className="text-xs text-black/40 mt-2">
                    {new Date(inquiry.createdAt).toLocaleDateString()} -{" "}
                    {inquiry.user.phone}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] whitespace-nowrap ${
                    inquiry.status === "open"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {inquiry.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
