/* Generado por split de data/plants.js — Hytech Tools */

export const NAMING = {
  A: { label: "Rating de bridas y accesorios", slot: "A", rows: [
    { code: "A", value: "150# / 125# / PN16" }, { code: "B", value: "300#" },
    { code: "C", value: "600#" }, { code: "D", value: "900#" }, { code: "E", value: "1500#" } ] },
  B: { label: "Grado de material", slot: "B", rows: [
    { code: "C", value: "Carbon Steel" }, { code: "G", value: "Carbon Steel Galv." },
    { code: "L", value: "Carbon Steel Low Temp" }, { code: "S", value: "Stainless Steel" },
    { code: "D", value: "Duplex" }, { code: "P", value: "Polyethylene" }, { code: "F", value: "Fiberglass" } ] },
  C: { label: "Corrosión permitida", slot: "C", rows: [
    { code: "0", value: "0 mm" }, { code: "1", value: "1,6 mm" },
    { code: "3", value: "3,2 mm" }, { code: "6", value: "6,4 mm" } ] },
  D: { label: "Requisito adicional", slot: "D", rows: [
    { code: "A", value: "Sand Services" }, { code: "R", value: "Internal Coating" },
    { code: "RA", value: "Sand Services & Int. Coat." }, { code: "N", value: "NACE MR0175" },
    { code: "F", value: "Fire water systems" }, { code: "G", value: "GRP (PRFV)" },
    { code: "E", value: "GRE (ERFV) Epoxy" }, { code: "X", value: "Cross-linked PE (PEX)" },
    { code: "H", value: "HDPE (PEAD)" }, { code: "M", value: "316/316L" },
    { code: "S", value: "304/304L" }, { code: "T", value: "321/321L" } ] },
};

/* Convención de nomenclatura, generalizada por proyecto ─────────────────────
   Cada planta declara su propia lógica de código, en vez de asumir que todas
   usan el esquema segmentado A-B-C-D de EPF:
   - { type: "segmented", slots: [...] } → código armado por segmentos, con
     un ensamblador tipo el de EPF (cualquier cantidad de slots, cualquier
     letra — no está atado a A/B/C/D).
   - { type: "freeform" } → cada clase tiene su propio código de documento
     (ej. B10A, A10R), sin convención segmentada — como La Calera. */
export const EPF_CODE_CONVENTION = {
  type: "segmented",
  slots: [
    { slot: "A", label: NAMING.A.label, rows: NAMING.A.rows },
    { slot: "B", label: NAMING.B.label, rows: NAMING.B.rows },
    { slot: "C", label: NAMING.C.label, rows: NAMING.C.rows },
    { slot: "D", label: NAMING.D.label, rows: NAMING.D.rows },
  ],
};
export const FREEFORM_CODE_CONVENTION = { type: "freeform" };

