import { FEATURES, featureKeys, getFeatures } from "@/lib/features";
import { setFeature } from "./actions";

export default async function FeaturesPage() {
  const features = await getFeatures();
  return (
    <section>
      <h1 className="mb-2 text-2xl font-extrabold">Features</h1>
      <p className="mb-6 text-sm text-white/60">Everything starts off. Changes apply within a minute.</p>
      <ul className="space-y-3">
        {featureKeys.map((key) => (
          <li key={key} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div>
              <p className="font-semibold">{FEATURES[key].label}</p>
              <p className="text-sm text-white/60">{FEATURES[key].help}</p>
              <code className="text-xs text-white/40">{key}</code>
            </div>
            <form action={setFeature}>
              <input type="hidden" name="key" value={key} />
              <input type="hidden" name="enabled" value={String(!features[key])} />
              <button
                aria-pressed={features[key]}
                className={`min-w-20 rounded-xl px-4 py-2 text-sm font-semibold ${
                  features[key] ? "bg-[#FFBE00] text-black" : "border border-white/20 text-white/70"
                }`}
              >
                {features[key] ? "On" : "Off"}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
