export default function Home() {
  const roleCards = [
    {
      title: "Farmers",
      detail:
        "Register unused land, get tree guidance, and earn from verified carbon projects.",
    },
    {
      title: "Buyers",
      detail:
        "Browse transparent projects, compare impact, and secure offsets with confidence.",
    },
    {
      title: "Admins",
      detail:
        "Verify land data, estimate credits, and manage listings from one console.",
    },
  ];

  const steps = [
    {
      title: "Register land",
      detail: "Farmers add land details, photos, and location data in minutes.",
    },
    {
      title: "Verify & estimate",
      detail: "Admins validate land and generate carbon estimates and pricing.",
    },
    {
      title: "Match & fund",
      detail: "Buyers browse listings and fund verified projects at scale.",
    },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto w-full max-w-6xl px-6 pt-8">
        <nav className="flex flex-col gap-4 rounded-3xl border border-black/10 bg-white/70 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--forest)] text-white">
              GC
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[color:var(--leaf)]">
                GreenCredits
              </p>
              <p className="text-xs text-black/60">Carbon marketplace platform</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-black/70">
            <a className="hover:text-black" href="#platform">
              Platform
            </a>
            <a className="hover:text-black" href="#roles">
              Who it helps
            </a>
            <a className="hover:text-black" href="#workflow">
              Workflow
            </a>
            <a className="hover:text-black" href="#marketplace">
              Marketplace
            </a>
            <button className="rounded-full bg-[color:var(--forest)] px-5 py-2 text-white">
              Request demo
            </button>
          </div>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 pb-20 pt-12">
        <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col gap-6">
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[color:var(--clay)]">
              Carbon credit marketplace MVP
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-[color:var(--forest)] sm:text-5xl">
              Turn underused land into verified climate impact.
            </h1>
            <p className="text-lg text-black/70">
              GreenCredits connects farmers, admins, and buyers in one workflow: land
              onboarding, verification, AI guidance, and credit listing in weeks, not
              months.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="rounded-full bg-[color:var(--forest)] px-6 py-3 text-white">
                Start a pilot
              </button>
              <button className="rounded-full border border-black/15 px-6 py-3 text-[color:var(--forest)]">
                View dashboard flow
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-black/50">
                  Verification
                </p>
                <p className="text-lg font-semibold text-[color:var(--forest)]">
                  Satellite + admin review
                </p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-black/50">
                  Guidance
                </p>
                <p className="text-lg font-semibold text-[color:var(--forest)]">
                  AI-backed tree plans
                </p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-black/50">
                  Marketplace
                </p>
                <p className="text-lg font-semibold text-[color:var(--forest)]">
                  Transparent listings
                </p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[32px] border border-black/10 bg-white/80 p-6 shadow-lg">
            <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-[color:var(--sun)]/40 blur-3xl" />
            <div className="absolute -bottom-20 -left-14 h-44 w-44 rounded-full bg-[color:var(--leaf)]/30 blur-3xl" />
            <div className="relative flex h-full flex-col gap-6">
              <div className="rounded-3xl bg-[color:var(--mist)] p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-black/50">
                  Live snapshot
                </p>
                <p className="mt-2 text-2xl font-semibold text-[color:var(--forest)]">
                  126 hectares in review
                </p>
                <p className="mt-2 text-sm text-black/60">
                  Aggregated from ongoing farmer submissions across districts.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-white/80 p-3">
                    <p className="text-xs text-black/50">Pending lands</p>
                    <p className="text-lg font-semibold text-[color:var(--forest)]">
                      48
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/80 p-3">
                    <p className="text-xs text-black/50">Approved listings</p>
                    <p className="text-lg font-semibold text-[color:var(--forest)]">
                      21
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-black/10 bg-white/70 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-black/50">
                  Project flow
                </p>
                <ul className="mt-3 space-y-3 text-sm text-black/70">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[color:var(--leaf)]" />
                    Map polygon drawn with GPS assist
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[color:var(--sun)]" />
                    Carbon estimate computed with tenure and soil data
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-[color:var(--clay)]" />
                    Listing price drafted by admin reviewer
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="roles" className="grid gap-6 sm:grid-cols-3">
          {roleCards.map((role) => (
            <div
              key={role.title}
              className="rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm"
            >
              <h2 className="text-2xl font-semibold text-[color:var(--forest)]">
                {role.title}
              </h2>
              <p className="mt-3 text-sm text-black/65">{role.detail}</p>
            </div>
          ))}
        </section>

        <section id="workflow" className="rounded-[36px] border border-black/10 bg-white/80 p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[color:var(--leaf)]">
                Workflow
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-[color:var(--forest)]">
                From onboarding to marketplace in three clear steps.
              </h2>
            </div>
            <button className="rounded-full border border-black/15 px-5 py-2 text-sm text-[color:var(--forest)]">
              View admin checklist
            </button>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-3xl bg-[color:var(--sand)] p-5"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-black/50">
                  Step {index + 1}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-[color:var(--forest)]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-black/65">{step.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="marketplace" className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[36px] border border-black/10 bg-white/80 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-[color:var(--clay)]">
              Marketplace
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-[color:var(--forest)]">
              Compare verified projects with real carbon estimates.
            </h2>
            <p className="mt-4 text-sm text-black/70">
              Buyers see location, estimated credits, and tree recommendations in a
              single listing feed. Farmers gain transparent pricing and faster
              approvals.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-black/50">
              <span>Verified status</span>
              <span>Estimated credits</span>
              <span>Suggested trees</span>
              <span>Pricing window</span>
            </div>
          </div>
          <div className="grid gap-4">
            {["Coastal Agro Belt", "Central Plains", "Dryland Recovery"].map(
              (name, index) => (
                <div
                  key={name}
                  className="rounded-3xl border border-black/10 bg-white/80 p-5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-[color:var(--forest)]">
                      {name}
                    </p>
                    <span className="rounded-full bg-[color:var(--mist)] px-3 py-1 text-xs text-black/60">
                      {index === 0 ? "Approved" : "Under review"}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-black/60">
                    <div>
                      <p className="uppercase tracking-[0.2em]">Credits</p>
                      <p className="text-base font-semibold text-black/80">
                        {index === 0 ? "1,240" : "860"}
                      </p>
                    </div>
                    <div>
                      <p className="uppercase tracking-[0.2em]">Trees</p>
                      <p className="text-base font-semibold text-black/80">
                        {index === 2 ? "Bamboo" : "Neem"}
                      </p>
                    </div>
                    <div>
                      <p className="uppercase tracking-[0.2em]">Price</p>
                      <p className="text-base font-semibold text-black/80">
                        {index === 1 ? "$18" : "$22"}
                      </p>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </section>

        <section
          id="platform"
          className="rounded-[36px] border border-black/10 bg-[color:var(--forest)] p-8 text-white"
        >
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.4em] text-white/70">
                Admin cockpit
              </p>
              <h2 className="mt-3 text-3xl font-semibold">
                Monitor land pipelines, approvals, and pricing in one place.
              </h2>
              <p className="mt-4 text-sm text-white/70">
                The dashboard centralizes verification, AI recommendations, carbon
                estimates, and listing controls so teams can scale operations without
                adding overhead.
              </p>
            </div>
            <div className="rounded-3xl bg-white/10 p-5">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/70">
                <span>Today</span>
                <span>Operations</span>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>Pending reviews</span>
                  <span className="font-semibold">18</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Listings live</span>
                  <span className="font-semibold">32</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Buyer requests</span>
                  <span className="font-semibold">9</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-[36px] border border-black/10 bg-white/80 p-8 text-center">
          <h2 className="text-3xl font-semibold text-[color:var(--forest)]">
            Ready to validate your first carbon projects?
          </h2>
          <p className="text-sm text-black/65">
            Launch the MVP with land onboarding, AI recommendations, and a buyer-ready
            marketplace.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="rounded-full bg-[color:var(--forest)] px-6 py-3 text-white">
              Start the MVP build
            </button>
            <button className="rounded-full border border-black/15 px-6 py-3 text-[color:var(--forest)]">
              Download product brief
            </button>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 pb-10 text-sm text-black/60">
        <div className="flex flex-col items-start justify-between gap-4 border-t border-black/10 pt-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold text-[color:var(--forest)]">GreenCredits</p>
            <p>Satellite-assisted carbon project onboarding.</p>
          </div>
          <div className="flex gap-6">
            <span>Privacy</span>
            <span>Security</span>
            <span>Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
