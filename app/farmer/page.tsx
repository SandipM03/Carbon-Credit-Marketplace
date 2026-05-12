"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getSessionFromDocumentCookie } from "../lib/session";
import type { Id } from "../../convex/_generated/dataModel";

const LandMap = dynamic(() => import("../components/LandMap"), { ssr: false });

const LAND_TYPES = ["Agricultural", "Barren", "Dry Land", "Wet Land", "Mixed"];
const SOIL_TYPES = ["Sandy", "Clay", "Loamy", "Black Soil", "Red Soil"];
const WATER_LEVELS = ["Low", "Medium", "High"];
const VEGETATION = ["No Trees", "Few Trees", "Moderate Trees", "Dense Vegetation"];
const GOALS = [
  "Maximum Carbon Credits",
  "Fruit Income",
  "Timber Value",
  "Fast Growth",
  "Low Maintenance",
];
const STATUS_FLOW = [
  "pending",
  "under_review",
  "request_info",
  "approved",
  "listed",
] as const;

type PolygonPoint = [number, number];
const COORDINATE_PRECISION = 6;

function parsePolygonInput(rawPolygon: string) {
  const lines = rawPolygon
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { points: undefined as PolygonPoint[] | undefined };
  }

  const points: PolygonPoint[] = [];
  for (const line of lines) {
    const [rawLatitude, rawLongitude] = line.split(",").map((value) => value.trim());
    const parsedLatitude = Number(rawLatitude);
    const parsedLongitude = Number(rawLongitude);

    if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
      return { error: `Invalid polygon coordinate "${line}". Use "latitude,longitude".` };
    }

    if (parsedLatitude < -90 || parsedLatitude > 90) {
      return { error: `Polygon latitude out of range in "${line}".` };
    }

    if (parsedLongitude < -180 || parsedLongitude > 180) {
      return { error: `Polygon longitude out of range in "${line}".` };
    }

    points.push([parsedLatitude, parsedLongitude]);
  }

  if (points.length < 3) {
    return { error: "Polygon needs at least 3 coordinates." };
  }

  return { points };
}

function formatPolygonPoints(points: PolygonPoint[]) {
  return points
    .map(
      ([latitudeValue, longitudeValue]) =>
        `${latitudeValue.toFixed(COORDINATE_PRECISION)},${longitudeValue.toFixed(
          COORDINATE_PRECISION,
        )}`,
    )
    .join("\n");
}

export default function FarmerDashboard() {
  const createLand = useMutation(api.lands.create);
  const generateUploadUrl = useMutation(api.lands.generateUploadUrl);
  const generateRecommendation = useAction(api.lands.generateRecommendation);
  const session = getSessionFromDocumentCookie();
  const farmerId = session?.role === "farmer" ? (session.userId as Id<"users">) : null;
  const lands = useQuery(
    api.lands.listByFarmer,
    farmerId ? { farmerId } : "skip",
  );
  const [landName, setLandName] = useState("");
  const [totalArea, setTotalArea] = useState("");
  const [areaUnit, setAreaUnit] = useState("hectares");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [polygonRaw, setPolygonRaw] = useState("");
  const [landType, setLandType] = useState(LAND_TYPES[0]);
  const [soilType, setSoilType] = useState(SOIL_TYPES[0]);
  const [waterAvailability, setWaterAvailability] = useState(WATER_LEVELS[1]);
  const [vegetation, setVegetation] = useState(VEGETATION[0]);
  const [plantationGoal, setPlantationGoal] = useState(GOALS[0]);
  const [tenure, setTenure] = useState("10");
  const [notes, setNotes] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const guardMessage = !session
    ? "No active session. Please login to submit land."
    : session.role !== "farmer"
      ? "This dashboard is for farmer accounts only."
      : null;
  const [recommendationMessage, setRecommendationMessage] =
    useState<string | null>(null);
  const [recommendationLoadingId, setRecommendationLoadingId] = useState<
    string | null
  >(null);

  const statusLabel = (value: string) => value.replace("_", " ");
  const statusTone = (value: string) => {
    switch (value) {
      case "approved":
        return "bg-emerald-100 text-emerald-800";
      case "listed":
        return "bg-indigo-100 text-indigo-800";
      case "under_review":
        return "bg-amber-100 text-amber-800";
      case "request_info":
        return "bg-orange-100 text-orange-800";
      case "rejected":
        return "bg-rose-100 text-rose-800";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const statusCounts = useMemo(
    () =>
      lands?.reduce<Record<string, number>>((acc, land) => {
        acc[land.status] = (acc[land.status] ?? 0) + 1;
        return acc;
      }, {}) ?? {},
    [lands],
  );

  const locationIsValid = useMemo(() => {
    const latitudeValue = Number(latitude);
    const longitudeValue = Number(longitude);
    return (
      Number.isFinite(latitudeValue) &&
      Number.isFinite(longitudeValue) &&
      latitudeValue >= -90 &&
      latitudeValue <= 90 &&
      longitudeValue >= -180 &&
      longitudeValue <= 180
    );
  }, [latitude, longitude]);

  const mapLocation = useMemo(() => {
    if (!locationIsValid) {
      return null;
    }
    return {
      lat: Number(latitude),
      lng: Number(longitude),
    };
  }, [latitude, longitude, locationIsValid]);

  const polygonPreview = useMemo(() => {
    const parsed = parsePolygonInput(polygonRaw);
    if ("error" in parsed) {
      return undefined;
    }
    return parsed.points;
  }, [polygonRaw]);

  const handleLocationChange = (nextLatitude: number, nextLongitude: number) => {
    setLatitude(nextLatitude.toFixed(COORDINATE_PRECISION));
    setLongitude(nextLongitude.toFixed(COORDINATE_PRECISION));
  };

  const handlePolygonChange = (points: PolygonPoint[] | null) => {
    if (!points || points.length === 0) {
      setPolygonRaw("");
      return;
    }
    setPolygonRaw(formatPolygonPoints(points));
  };

  const fillCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStatus("Geolocation is not supported in this browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setIsLocating(false);
        setStatus("Current GPS location loaded.");
      },
      () => {
        setIsLocating(false);
        setStatus("Unable to fetch location. Please set coordinates manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const uploadImages = async () => {
    if (selectedImages.length === 0) {
      return undefined;
    }

    if (selectedImages.length > 5) {
      throw new Error("You can upload up to 5 images.");
    }

    const uploadedIds: Id<"_storage">[] = [];
    for (const file of selectedImages) {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });

      if (!result.ok) {
        throw new Error(`Failed to upload "${file.name}".`);
      }

      const payload = (await result.json()) as { storageId?: Id<"_storage"> };
      if (!payload.storageId) {
        throw new Error(`Upload response missing file id for "${file.name}".`);
      }
      uploadedIds.push(payload.storageId);
    }

    return uploadedIds;
  };

  const handleGenerateRecommendation = async (landId: Id<"lands">) => {
    setRecommendationMessage(null);
    setRecommendationLoadingId(landId);
    try {
      await generateRecommendation({ id: landId });
      setRecommendationMessage("Recommendation updated.");
    } catch (error) {
      setRecommendationMessage(
        error instanceof Error
          ? error.message
          : "Unable to generate recommendations.",
      );
    } finally {
      setRecommendationLoadingId(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    if (!farmerId) {
      setStatus("Session expired. Please login again.");
      return;
    }

    const areaValue = Number(totalArea);
    const tenureValue = Number(tenure);
    const latitudeValue = Number(latitude);
    const longitudeValue = Number(longitude);

    if (!landName.trim()) {
      setStatus("Land name is required.");
      return;
    }

    if (!Number.isFinite(areaValue) || areaValue <= 0) {
      setStatus("Total area must be a positive number.");
      return;
    }

    if (!Number.isFinite(tenureValue) || tenureValue <= 0) {
      setStatus("Tenure must be a positive number.");
      return;
    }

    if (!Number.isFinite(latitudeValue) || latitudeValue < -90 || latitudeValue > 90) {
      setStatus("Latitude must be between -90 and 90.");
      return;
    }

    if (!Number.isFinite(longitudeValue) || longitudeValue < -180 || longitudeValue > 180) {
      setStatus("Longitude must be between -180 and 180.");
      return;
    }

    const polygonResult = parsePolygonInput(polygonRaw);
    if ("error" in polygonResult) {
      setStatus((polygonResult as { error: string }).error || "Invalid polygon");
      return;
    }

    setIsUploading(true);
    try {
      const uploadedImages = await uploadImages();
      await createLand({
        farmerId,
        landName: landName.trim(),
        totalArea: areaValue,
        areaUnit,
        latitude: latitudeValue,
        longitude: longitudeValue,
        polygonCoordinates: polygonResult.points,
        landType,
        soilType,
        waterAvailability,
        vegetation,
        plantationGoal,
        tenure: tenureValue,
        images: uploadedImages,
        notes: notes.trim() ? notes.trim() : undefined,
      });
      setLandName("");
      setTotalArea("");
      setLatitude("");
      setLongitude("");
      setPolygonRaw("");
      setNotes("");
      setSelectedImages([]);
      setStatus("Land submitted for review.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Submission failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };


  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 pb-16 pt-12">
      <header className="rounded-3xl border border-black/10 bg-white/80 p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[color:var(--leaf)]">
          Farmer
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[color:var(--forest)]">
          Land registration hub
        </h1>
        <p className="mt-2 text-sm text-black/70">
          Submit complete land details with GPS and map context, then track status through
          listing.
        </p>
      </header>

      {guardMessage && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-900">
          {guardMessage}
        </div>
      )}

      <section className="rounded-3xl border border-black/10 bg-white/80 p-6">
        <h2 className="text-lg font-semibold text-[color:var(--forest)]">Land status flow</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {STATUS_FLOW.map((step) => (
            <span
              key={step}
              className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] ${statusTone(step)}`}
            >
              {statusLabel(step)}
            </span>
          ))}
          <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] ${statusTone("rejected")}`}>
            rejected
          </span>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-black/10 bg-white/80 p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-black/70">
              Land name
              <input
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                value={landName}
                onChange={(event) => setLandName(event.target.value)}
                placeholder="e.g. North Field"
                required
              />
            </label>
            <label className="text-sm font-medium text-black/70">
              Total area
              <input
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                value={totalArea}
                onChange={(event) => setTotalArea(event.target.value)}
                placeholder="e.g. 12.5"
                required
              />
            </label>
            <label className="text-sm font-medium text-black/70">
              Area unit
              <select
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                value={areaUnit}
                onChange={(event) => setAreaUnit(event.target.value)}
              >
                <option value="hectares">Hectares</option>
                <option value="acres">Acres</option>
                <option value="sqm">Square meters</option>
              </select>
            </label>
            <label className="text-sm font-medium text-black/70">
              Latitude
              <input
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
                placeholder="e.g. 17.385"
                required
              />
            </label>
            <label className="text-sm font-medium text-black/70">
              Longitude
              <input
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
                placeholder="e.g. 78.4867"
                required
              />
            </label>
            <div className="flex items-end">
              <button
                type="button"
                className="rounded-full border border-black/10 px-4 py-3 text-sm text-black/70"
                onClick={fillCurrentLocation}
                disabled={isLocating}
              >
                {isLocating ? "Detecting GPS..." : "Use current GPS"}
              </button>
            </div>
            <label className="text-sm font-medium text-black/70">
              Land type
              <select
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                value={landType}
                onChange={(event) => setLandType(event.target.value)}
              >
                {LAND_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-black/70">
              Soil type
              <select
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                value={soilType}
                onChange={(event) => setSoilType(event.target.value)}
              >
                {SOIL_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-black/70">
              Water availability
              <select
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                value={waterAvailability}
                onChange={(event) => setWaterAvailability(event.target.value)}
              >
                {WATER_LEVELS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-black/70">
              Existing vegetation
              <select
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                value={vegetation}
                onChange={(event) => setVegetation(event.target.value)}
              >
                {VEGETATION.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-black/70">
              Plantation goal
              <select
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                value={plantationGoal}
                onChange={(event) => setPlantationGoal(event.target.value)}
              >
                {GOALS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-black/70">
              Tenure (years)
              <input
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                value={tenure}
                onChange={(event) => setTenure(event.target.value)}
                placeholder="e.g. 10"
                required
              />
            </label>
            <label className="text-sm font-medium text-black/70 sm:col-span-2">
              Polygon coordinates (optional)
              <textarea
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 font-mono text-sm"
                value={polygonRaw}
                onChange={(event) => setPolygonRaw(event.target.value)}
                rows={4}
                placeholder={"17.385000,78.486700\n17.384500,78.487500\n17.383900,78.486100"}
              />
              <span className="mt-1 block text-xs text-black/50">
                One point per line in &quot;latitude,longitude&quot; format (minimum 3 points).
              </span>
            </label>
            <label className="text-sm font-medium text-black/70 sm:col-span-2">
              Land images (optional, up to 5)
              <input
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                type="file"
                accept="image/*"
                multiple
                onChange={(event) =>
                  setSelectedImages(Array.from(event.target.files ?? []).slice(0, 5))
                }
              />
            </label>
            {selectedImages.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-xs text-black/60">Selected files</p>
                <div className="mt-2 space-y-1 text-xs text-black/70">
                  {selectedImages.map((file) => (
                    <p key={`${file.name}-${file.size}`}>{file.name}</p>
                  ))}
                </div>
              </div>
            )}
            <label className="text-sm font-medium text-black/70 sm:col-span-2">
              Additional notes
              <textarea
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                placeholder="Optional notes about access, water sources, or constraints."
              />
            </label>
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-black/60">
              <span>Click to set GPS, drag marker to adjust, draw a polygon for boundaries.</span>
              <span>Use the layer switcher for satellite imagery.</span>
            </div>
            <LandMap
              location={mapLocation}
              polygonPoints={polygonPreview}
              onLocationChange={handleLocationChange}
              onPolygonChange={handlePolygonChange}
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-full bg-[color:var(--forest)] px-6 py-3 text-sm font-semibold text-white"
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Submit land"}
            </button>
            <span className="text-sm text-black/60">
              {status ?? "New submissions default to pending review."}
            </span>
          </div>
        </form>

        <aside className="rounded-3xl border border-black/10 bg-white/80 p-6">
          <h2 className="text-lg font-semibold text-[color:var(--forest)]">My lands</h2>
          <p className="mt-2 text-sm text-black/60">
            Track current status, admin notes, and media for your own submissions.
          </p>
          {recommendationMessage && (
            <p className="mt-3 text-xs text-black/60">{recommendationMessage}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {["pending", "under_review", "request_info", "approved", "listed", "rejected"].map(
              (value) => (
                <span key={value} className={`rounded-full px-3 py-1 ${statusTone(value)}`}>
                  {statusLabel(value)}: {statusCounts[value] ?? 0}
                </span>
              ),
            )}
          </div>
          <div className="mt-4 space-y-3 text-sm text-black/70">
            {!lands && <p>Loading submissions...</p>}
            {lands?.length === 0 && <p>No land submissions yet.</p>}
            {lands?.map((land) => (
              <div key={land._id} className="rounded-2xl bg-[color:var(--mist)] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-[color:var(--forest)]">{land.landName}</p>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs uppercase tracking-[0.3em] ${statusTone(
                      land.status,
                    )}`}
                  >
                    {statusLabel(land.status)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-black/60">
                  {land.totalArea} {land.areaUnit} • {land.landType} •{" "}
                  {new Date(land.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-black/60">
                  GPS: {land.latitude}, {land.longitude}
                </p>
                {land.polygonCoordinates && (
                  <p className="text-xs text-black/60">
                    Polygon points: {land.polygonCoordinates.length}
                  </p>
                )}
                {land.adminNotes && (
                  <p className="mt-2 rounded-xl bg-white/70 px-3 py-2 text-xs text-black/70">
                    <span className="font-semibold text-black/80">Admin note:</span>{" "}
                    {land.adminNotes}
                  </p>
                )}
                <div className="mt-2 rounded-xl bg-white/70 px-3 py-2 text-xs text-black/70">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-black/80">
                      Tree recommendations
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-black/50">
                      {land.recommendation?.source ?? "none"}
                    </span>
                  </div>
                  {land.recommendation ? (
                    <>
                      <ul className="mt-2 space-y-1">
                        {land.recommendation.trees.map((tree) => (
                          <li key={`${land._id}-${tree.name}`}>
                            <span className="font-semibold text-black/80">
                              {tree.name}
                            </span>
                            {" "}- {tree.maintenance} maintenance, {tree.carbonPotential} carbon
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-black/60">
                        Benefits: {land.recommendation.summaryBenefits.join(", ")}
                      </p>
                      <p className="text-xs text-black/60">
                        Maintenance: {land.recommendation.summaryMaintenance}
                      </p>
                      <p className="text-xs text-black/60">
                        Carbon potential: {land.recommendation.summaryCarbonPotential}
                      </p>
                      <p className="mt-2 text-xs text-black/60">
                        {land.recommendation.explanation}
                      </p>
                      {land.recommendation.note && (
                        <p className="mt-2 text-xs text-black/60">
                          Admin note: {land.recommendation.note}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="mt-2 text-xs text-black/60">
                      No recommendations yet.
                    </p>
                  )}
                  <button
                    type="button"
                    className="mt-2 rounded-full border border-black/10 px-3 py-1 text-xs text-black/70"
                    onClick={() => handleGenerateRecommendation(land._id)}
                    disabled={recommendationLoadingId === land._id}
                  >
                    {recommendationLoadingId === land._id
                      ? "Generating..."
                      : "Generate recommendations"}
                  </button>
                </div>
                {land.imageUrls.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {land.imageUrls.map((imageUrl, index) => (
                      <div
                        key={`${land._id}-${imageUrl}`}
                        className="relative aspect-square overflow-hidden rounded-xl border border-black/10 bg-white"
                      >
                        <Image
                          src={imageUrl}
                          alt={`${land.landName} image ${index + 1}`}
                          fill
                          sizes="(max-width: 768px) 33vw, 12vw"
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
