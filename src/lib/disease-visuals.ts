import heart from "@/assets/cardiovascular-heart.jpg.asset.json";
import cancer from "@/assets/disease-cancer.jpg.asset.json";
import diabetes from "@/assets/disease-diabetes.jpg.asset.json";
import stroke from "@/assets/disease-stroke.jpg.asset.json";
import kidney from "@/assets/disease-kidney.jpg.asset.json";
import neuro from "@/assets/disease-neuro.jpg.asset.json";
import respiratory from "@/assets/disease-respiratory.jpg.asset.json";
import rare from "@/assets/disease-rare.jpg.asset.json";

/** Scientific visual per disease area. Illustrative renders, not patient imagery. */
export const diseaseVisuals: Record<string, { url: string; alt: string }> = {
  "heart-cardiovascular": {
    url: heart.url,
    alt: "Scientific non-graphic visualization of an anatomical heart",
  },
  cancer: { url: cancer.url, alt: "Scientific visualization of cellular and molecular structures" },
  diabetes: { url: diabetes.url, alt: "Scientific visualization of metabolic molecular structures" },
  stroke: { url: stroke.url, alt: "Scientific visualization of cerebral vasculature" },
  kidney: { url: kidney.url, alt: "Scientific visualization of a kidney and nephron structures" },
  neurological: { url: neuro.url, alt: "Scientific visualization of a neuron and synaptic connections" },
  respiratory: { url: respiratory.url, alt: "Scientific visualization of lungs and the bronchial tree" },
  "rare-disease": { url: rare.url, alt: "Scientific visualization of a DNA double helix" },
};

export function diseaseVisual(slug: string) {
  return diseaseVisuals[slug];
}
