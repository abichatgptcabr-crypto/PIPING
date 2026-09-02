/* Generado por split de data/plants.js — Hytech Tools */

export { FAMILIES, COMP_COLS, VALVE_COLS, ratingLevel, clone, uid } from "./shared";
export { NAMING, EPF_CODE_CONVENTION, FREEFORM_CODE_CONVENTION } from "./naming";
export { CLASSES, seedClasses } from "./epf";
export { LACAL_CLASSES, seedLaCalera } from "./lacal";

import { EPF_CODE_CONVENTION, FREEFORM_CODE_CONVENTION } from "./naming";
import { seedClasses } from "./epf";
import { seedLaCalera } from "./lacal";

export const SEED_PLANTS = [
  { id: "epf-og", name: "EPF · Oil & Gas Upstream (PCN)",
    kind: "Central de producción temprana — crudo y gas no convencional",
    ref: "018-ABDC-00300-TI-C-0001 · Rev.1", code: "ASME B31.3", seeded: true,
    codeConvention: EPF_CODE_CONVENTION, classes: seedClasses() },
  { id: "lacal-pluspetrol", name: "Yacimiento La Calera · Pluspetrol",
    kind: "Facilities Engineering & Construction — desarrollo de yacimiento",
    ref: "ACAL-000-ET-C-001 · Rev. D/E/F/0", code: "ASME B31.3", seeded: true,
    codeConvention: FREEFORM_CODE_CONVENTION, classes: seedLaCalera() },
  { id: "hdt-ref", name: "Refinería · Unidad HDT",
    kind: "Hidrotratamiento — plantilla base a completar",
    ref: "—", code: "ASME B31.3", seeded: false, codeConvention: EPF_CODE_CONVENTION, classes: [] },
  { id: "litio", name: "Planta de Litio · Concentradora",
    kind: "Minería / salmuera — plantilla base a completar",
    ref: "—", code: "ASME B31.3", seeded: false, codeConvention: EPF_CODE_CONVENTION, classes: [] },
];

