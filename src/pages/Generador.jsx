import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Layers, ChevronDown, ChevronRight, X, Table2, CircleDot, GitBranch, StickyNote,
  Gauge, Search, Info, FileWarning, Plus, Pencil, Copy, Trash2, Building2, RotateCcw,
  CheckSquare, Square, Check, Save,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   MOTOR DE NOMENCLATURA · A-B-C-D  ·  018-ABDC-00300-TI-C-0001 Rev.1 pág.3
   ═══════════════════════════════════════════════════════════════════════════ */
const NAMING = {
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
const FAMILIES = {
  gas: "Gas y utilitarios", hc: "Hidrocarburos", venteo: "Venteos y antorcha",
  fire: "Agua contra incendio", wepoxy: "Agua prod./iny. · acero c/ epoxi",
  wss: "Agua prod./iny. · acero inox", wnm: "Agua prod./iny. · no metálica",
  wserv: "Agua de servicio y drenajes", custom: "Clases propias",
};
const BRANCH_METAL = {
  legend: ["S.W. Equal Tee", "S.W. Reducing Tee", "Beveled End Equal Tee",
    "Beveled End Reducing Tee (* rama menor biselada)", "Weldolet", "Sockolet"],
  sizes: ['½"', '¾"', '1"', '1½"', '2"', '3"', '4"', '6"'],
  m: {
    '½"': { '½"': 1, '¾"': 2, '1"': 2, '1½"': 2, '2"': 6, '3"': 6, '4"': 6, '6"': 6 },
    '¾"': { '¾"': 1, '1"': 2, '1½"': 2, '2"': 6, '3"': 6, '4"': 6, '6"': 6 },
    '1"': { '1"': 1, '1½"': 2, '2"': 6, '3"': 6, '4"': 6, '6"': 6 },
    '1½"': { '1½"': 1, '2"': 6, '3"': 6, '4"': 6, '6"': 6 },
    '2"': { '2"': 3, '3"': 4, '4"': 4, '6"': 5 }, '3"': { '3"': 3, '4"': 4, '6"': 4 },
    '4"': { '4"': 3, '6"': 4 }, '6"': { '6"': 3 } },
  note: "Extracto ½\"–6\" del documento (matriz completa hasta 24\"/36\").",
};
const BRANCH_PEX = {
  legend: ["Equal Tee", "Reducing Tee", "Stub In"],
  sizes: ['1"', '1½"', '2"', '3"', '4"', '6"', '8"'],
  m: {
    '1"': { '1"': 1, '1½"': 2, '2"': 3, '3"': 3, '4"': 3, '6"': 3, '8"': 3 },
    '1½"': { '1½"': 1, '2"': 2, '3"': 3, '4"': 3, '6"': 3, '8"': 3 },
    '2"': { '2"': 1, '3"': 2, '4"': 3, '6"': 3, '8"': 3 }, '3"': { '3"': 1, '4"': 2, '6"': 2, '8"': 3 },
    '4"': { '4"': 1, '6"': 2, '8"': 2 }, '6"': { '6"': 1, '8"': 2 }, '8"': { '8"': 1 } },
  note: "Extracto 1\"–8\" del documento (matriz completa hasta 16\").",
};
const COMP_COLS = ["Descripción", "Material", "Sch.", "Rating", "Dim. Code", "Ends", "Size", "Notas"];
const VALVE_COLS = ["Tipo", "Commodity Code", "Bore", "Type", "Rating", "End", "Size", "Notas"];
const c = (...a) => a;
const v = (...a) => a;

const AC1 = {
  designT: ["-29 a 38", "50", "100", "150", "200"], designP: ["20", "19,6", "18", "16,1", "14,1"],
  comps: [
    c("Seamless Pipe", "API 5L Gr. B", "80", "", "ASME B36.10M", "PE", '½"–1½"', "(1)(2)"),
    c("", "", "40", "", "", "BE", '2"–6"', "(1)(2)"), c("", "", "20", "", "", "BE", '8"–12"', "(1)(2)"),
    c("SAWL Pipe (100% RX)", "API 5L Gr. B", "10", "", "ASME B36.10M", "BE", '14"–18"', "(1)(2)"),
    c("", "", "20", "", "", "BE", '20"–24"', "(1)(2)"),
    c("Seamless Pipe (Nipple)", "ASTM A106 Gr.B", "80", "", "ASME B36.10", "PExNPT", '½"–1½"', "(4)(13)"),
    c("Forged Fittings", "ASTM A-105", "", "3000#", "ASME B16.11", "SW", '½"–1½"', "(18)"),
    c("Hexagonal Head Plug", "ASTM A-105", "", "3000#", "ASME B16.11", "NPT", '½"–1½"', "(4)(12)(13)"),
    c("Wrought Pipe Fittings", "ASTM A-234 Gr. WPB", "", "", "ASME B16.9", "BW", '2"–24"', "(5)"),
    c("Flange", "ASTM A-105", "", "150#", "ASME B16.5", "SW/RF", '½"–1½"', "(5)"),
    c("", "", "", "150#", "", "WN/RF", '2"–24"', "(5)"),
    c("Blind Flange", "ASTM A-105", "", "150#", "ASME B16.5", "BLIND RF", '½"–24"', "(5)"),
    c("Orifice Flange", "ASTM A-105", "", "300#", "ASME B16.36", "WN/RF", '1"–24"', "(5)(16)"),
    c("Gaskets", "304 SS Flexible Graphite filler", "", "150#/300#", "ASME B16.20", "—", '½"–24"', "(10)"),
    c("Stud Bolts", "ASTM A-193 Gr. B7-ZINC", "", "", "ASME B18.2.1", "—", "—", "(11)(17)"),
    c("Nuts", "ASTM A-194 Gr. 2H-ZINC", "", "", "ASME B18.2.2", "—", "—", ""),
    c("Spectacle Blind", "ASTM A-516 Gr. 70", "", "150#", "ASME B16.48", "RF", '1"–12"', "(7)(14)(15)"),
    c("Paddle & Spacer Blind", "ASTM A-516 Gr. 70", "", "150#", "", "RF", '14"–24"', ""),
    c("Drip Ring", "ASTM A-516 Gr. 70", "", "150#", "", "RF", '1"–12"', ""),
    c("Dielectric Joint", "Ver Nota 9", "", "150#", "ASME B16.21", "RF", '½"–24"', "(9)"),
    c("Olet Fittings", "ASTM A-105", "", "3000#", "MSS SP-97", "SW-NPT", '½"–1½"', "(5)(13)"),
    c("", "", "", "3000#", "", "BW-NPT", '2"–24"', "(5)(13)"),
    c("Swage Nipple", "ASTM A234 Gr. WPB", "", "", "MSS SP-95", "BW-PE", '1"–4"', "(4)(5)"),
  ],
  valves: [
    v("Ball", "RCJ8SW0", "Reduced", "—", "800#", "PE", '½"–1½"', "(4)"),
    v("Ball", "FCJ8SW0", "Full", "—", "800#", "PE", '½"–1½"', "(4)"),
    v("Ball", "VBA1WC005", "Full", "—", "2000WOG", "PExNPT-F", '½"–1½"', "(3)"),
    v("Ball", "RCC1RW0", "Reduced", "—", "150#", "RF", '2"–6"', ""),
    v("Ball", "FCC1RW0", "Full", "—", "150#", "RF", '2"–6"', ""),
    v("Ball", "VBA01C020", "Reduced", "—", "150#", "RF", '8"–24"', ""),
    v("Ball", "VBA01C018", "Full", "—", "150#", "RF", '8"–24"', ""),
    v("Gate", "ECB8SH0", "—", "—", "800#", "SW", '½"–1½"', ""),
    v("Gate", "ECB1RH0", "—", "—", "150#", "RF", '2"–12"', "HW/Gear Box ≥12\""),
    v("Gate", "ECB1RG0", "—", "—", "150#", "RF", '14"–24"', "Gear Box"),
    v("Globe", "GCB8SH0", "—", "—", "800#", "SW", '½"–1½"', ""),
    v("Globe", "GCB1RH0", "—", "—", "150#", "RF", '2"–12"', "HW/Gear Box ≥8\""),
    v("Globe", "GCB1RG0", "—", "—", "150#", "RF", '14"–24"', "Gear Box"),
    v("Butterfly", "BCJ1W00", "—", "Wafer", "150#", "-", '3"–12"', "Operator: By Vendor"),
    v("Butterfly", "BCJ1L00", "—", "Lug", "150#", "-", '14"–24"', "Operator: By Vendor"),
    v("Check", "CCB8SP0", "—", "Piston", "800#", "SW", '½"–1½"', "(2)"),
    v("Check", "CCB1WD0", "—", "Dual-Plate", "150#", "RF", '2"–12"', ""),
    v("Check", "CCB1LD0", "—", "Dual-Plate", "150#", "-", '14"–24"', "Lug Type"),
  ],
  branch: BRANCH_METAL,
  notes: [
    "Extremos biselados según ASME B16.25.",
    "Cañería enterrada: coating externo (3LPE/3LPP por NAG 108) según temperatura de servicio.",
    "Extremo NPT según ASME B1.20.1.", "El bore debe coincidir con el schedule de la cañería.",
    "Bridas y extremos bridados: cara serrada spiral 125–250 AARH máx.",
    "Junta dieléctrica: sólo tipo Pikotek VCS (no Micarta).",
    "Gaskets, sellos y empaquetaduras: libres de asbesto.",
    "Espárragos roscados en toda su longitud, con dos tuercas pesadas.",
    "Tapones hexagonales roscados sólo para venteos y drenajes.",
    "Fittings roscados sobre process piping: sólo termopozos y venteos de prueba hidráulica.",
  ],
};
const BC1 = {
  designT: ["-29 a 38", "50", "100", "150", "200"], designP: ["52,1", "51,1", "47,5", "46", "44,7"],
  comps: [
    c("Seamless Pipe", "ASTM A106 Gr. B", "80", "", "ASME B36.10M", "PE", '½"–1½"', "(2)"),
    c("", "ASTM A106 Gr B", "40", "", "", "BE", '2"', "(2)"), c("", "", "40", "", "", "BE", '3"–4"', "(2)"),
    c("", "", "40", "", "", "BE", '6"', "(2)"), c("", "", "30", "", "", "BE", '8"–10"', "(2)"),
    c("", "", "STD", "", "", "BE", '12"', "(2)"),
    c("SAWL Pipe (100% RX)", "API 5L Gr. B SAWL", "30", "", "ASME B36.10M", "BE", '14"', "(2)(7)(12)"),
    c("", "", "XS", "", "", "BE", '16"–18"', "(2)(7)(12)"), c("", "", "30", "", "", "BE", '20"', "(2)(7)(12)"),
    c("", "", "15,88", "", "", "BE", '24"', "(2)(7)(12)"), c("", "", "Nota 13", "", "", "BE", '30"', "(13)"),
    c("", "", "Nota 13", "", "", "BE", '36"', "(13)"),
    c("SMLS Pipe Niple", "ASTM A106 Gr B", "160", "", "ASME B36.10M", "NPTxPE", '½"–¾"', "(6)"),
    c("", "", "80", "", "", "NPTxPE", '1"–1½"', "(6)"),
    c("Forged Fittings", "ASTM A105", "", "3000#", "ASME B16.11", "SW", '½"–1½"', "(3)(12)"),
    c("Wrought Pipe Fittings", "ASTM A234 WPB", "", "", "ASME B16.9", "BW", '2"–36"', "(3)(12)"),
    c("Flange", "ASTM A105", "", "300#", "ASME B16.5", "SW/RF", '½"–1½"', "(4)(5)(12)"),
    c("", "", "", "300#", "", "WN/RF", '2"–24"', "(4)(5)(12)"),
    c("", "", "", "300#", "ASME B16.47 Serie A", "RF", '26"–36"', "(4)(5)(12)"),
    c("Blind Flange", "ASTM A105", "", "300#", "ASME B16.5", "RF", '½"–24"', "(4)(5)(12)"),
    c("", "", "", "300#", "ASME B16.47 Serie A", "RF", '26"–36"', "(4)(5)(12)"),
    c("Orifice Flange", "ASTM A-105", "", "300#", "ASME B16.36", "WN RF", '2"–24"', "(5)(12)"),
    c("Spiral Wound Gasket", "304 SS Flexible Graphite filler", "", "300#", "ASME B16.20", "RF", '½"–36"', "(10)"),
    c("Stud Bolts", "ASTM A-193 Gr.B7-ZINC", "", "", "ASME B18.2.1", "—", "—", "(11)(14)"),
    c("Nuts", "ASTM A-194 Gr.2H-ZINC", "", "", "ASME B18.2.2", "—", "—", ""),
    c("Spectacle Blind", "ASTM A516 Gr.70", "", "300#", "ASME B16.48", "RF", '1"–12"', "(15)(16)(17)"),
    c("Paddle & Spacer Blind", "ASTM A516 Gr.70", "", "300#", "ASME B16.48", "RF", '14"–24"', "(15)(16)(17)"),
    c("Drip Ring", "ASTM A516 Gr.70", "", "300#", "", "RF", '1"–12"', "(15)(16)(17)"),
    c("Dielectric Joint", "Ver Nota 9", "", "300#", "ASME B16.21", "RF", '½"–24"', "(9)"),
    c("Swage Nipple", "ASTM A105 / A234 WPB", "", "", "MSS SP-95", "SW-BW", '½"–4"', "(6)"),
    c("Olet Fittings", "ASTM A105", "", "6000#/3000#", "MSS SP-97", "SW-BW", '½"–24"', "(5)(6)"),
  ],
  valves: [
    v("Ball", "VBA1WC004", "Full", "—", "1500WOG", "PE", '½"–1½"', "5"),
    v("Ball", "VBA1WC001", "Reduced", "—", "1500WOG", "PE", '½"–1½"', "5"),
    v("Ball", "VBA1WC005", "Full", "—", "2000WOG", "NPT-F x PE", '½"–1½"', "4"),
    v("Ball", "VBA03C018", "Full", "—", "300#", "RF", '2"–4"', ""),
    v("Ball", "VBA03C019", "Reduced", "—", "300#", "RF", '2"–4"', ""),
    v("Ball", "VBA04C001", "Full", "—", "300#", "RF", '4"–36"', "3"),
    v("Ball", "VBA04C002", "Reduced", "—", "300#", "RF", '6"–36"', "3"),
    v("Butterfly", "VBY03C003", "—", "Wafer/Lug", "300#", "-", '3"–24"', "Wrench/Gear box ≥4\""),
    v("Check", "VCP08C001", "—", "Piston", "800#", "SW", '½"–1½"', "2"),
    v("Check", "VCK03C010", "—", "Swing", "300#", "RF", '2"–12"', ""),
    v("Check", "VCK03C007", "—", "Dual Plate", "300#", "-", '14"–24"', "Wafer Type"),
    v("Gate", "VGA08C007", "—", "—", "800#", "SW", '½"–1½"', ""),
    v("Gate", "VGA04C001", "—", "—", "300#", "RF", '2"–36"', "HW/Gear Box ≥10\""),
    v("Globe", "VGL08C004", "—", "—", "800#", "SW", '½"–1½"', ""),
    v("Globe", "VGL03C006", "—", "—", "300#", "RF", '2"–12"', "HW/Gear Box ≥8\""),
  ],
  branch: BRANCH_METAL,
  notes: [
    "Estándar dimensional: ASME B16.5 (bridas), B16.9 (BW), B16.11 (forjados), B16.10 (válvulas).",
    "Cañería enterrada: coating externo (3LPE/3LPP por NAG 108) según temperatura.",
    "El espesor de los fittings reductores debe igualar la pared más gruesa.",
    "Bridas y extremos bridados: cara serrada spiral 125–250 AARH máx.",
    "Cañería SAWL soldada (costura recta) con 100% de radiografía.",
    "Toda soldadura de cañería de espesor mayor a 3/4\" debe relevarse de tensiones.",
    "Junta dieléctrica: sólo tipo Pikotek VCS.",
    "Schedule para cañerías de 30\" y mayores: definido por proyecto (SAWL API 5L Gr.B).",
  ],
};
const AP0X = {
  designT: ["0 a 60"], designP: ["16,3"],
  comps: [
    c("Pipe", "PEX (Crosslinked PE) PE-100", "SDR 6 (S2.5)", "", "ISO 14531 / DIN 16892/16893", "—", '2"–16"', "(1)(2)(12)"),
    c("Jointing Method", "Electrofusión (con coupling)", "", "", "—", "—", "—", "(2)(6)"),
    c("Fittings", "Electrofusión HDPE PE-100 reforzado con metal", "", "", "ISO 14531 P2&3", "—", '2"–16"', "(2)(3)(4)(17)(18)"),
    c("Flange", "Flanged coupler ASTM A-536 65-45-12", "", "150#", "ASME B16.5", "FF", '2"–16"', "(5)"),
    c("Flange Lap-Joint", "ASTM A105 galvanizado (con stub end)", "", "150#", "ASME B16.5", "FF", '2"–16"', "(16)"),
    c("Closures", "Blind Flange ASTM A105 (PTFE lined)", "", "150#", "ASME B16.5", "FF", '2"–16"', ""),
    c("Spectacle Blind", "ASTM A-516 Gr. 70 (PTFE lined)", "", "150#", "ASME B16.48", "FF", '2"–12"', ""),
    c("Paddle & Spacer", "ASTM A-516 Gr. 70 (PTFE lined)", "", "150#", "ASME B16.48", "FF", '14"–16"', ""),
    c("Bolts & Nuts", "A193 GrB7-ZINC / A194 Gr2H-ZINC", "", "", "ASME B18.2.1/2", "—", "—", "(11)(14)(15)"),
    c("Gasket", "Full Face, PTFE expandido e=3,2mm", "", "150#", "ASME B16.21", "FF", '2"–16"', "(13)"),
  ],
  valves: [
    v("Ball", "VBA01C028", "Reduced", "—", "150#", "FF", '2"–6"', "(3)(5)"),
    v("Ball", "VBA01C029", "Reduced", "—", "150#", "FF", '8"–16"', "(3)(5)"),
    v("Gate", "VGA01C011", "—", "—", "150#", "FF", '2"–16"', "(4)(5) HW/Gear box ≥12\""),
    v("Globe", "VGL01C011", "—", "—", "150#", "FF", '2"–10"', "(3)(4)(5) HW/Gear box ≥8\""),
    v("Butterfly", "VBY01C010", "—", "Lug", "150#", "FF", '3"–12"', "(2)(5) HW/Gear box ≥8\""),
    v("Check", "VCK01C014", "—", "Swing", "150#", "FF", '2"–16"', "(3)(4)(5)"),
  ],
  branch: BRANCH_PEX,
  notes: [
    "El espesor de pared de la cañería lo confirma el proveedor final según la clase de presión.",
    "Cañería y fittings PEX sobre superficie: protegidos contra UV.",
    "Fittings por electrofusión, compatibles con ISO 14531 Parte 2&3.",
    "El rating de presión de cañería y fittings debe registrarse en la documentación del fabricante.",
    "Algunas derivaciones bridadas pueden ser de acero inoxidable según el proveedor.",
    "Temperatura de servicio de fittings de electrofusión PE-100 limitada a 40°C; a mayor temperatura, fittings reforzados con metal.",
  ],
};

const BRANCH_B10A = {
  legend: ["S.W. Equal Tee", "S.W. Reducing Tee", "Beveled End Equal Tee",
    "Beveled End Reducing Tee (* rama menor biselada)", "Weldolet", "Sockolet"],
  sizes: ['½"', '¾"', '1"', '1½"', '2"', '3"', '4"', '6"', '8"', '10"', '12"', '14"', '16"', '18"', '20"', '24"'],
  m: {
    '½"': { '½"': 1, '¾"': 2, '1"': 2, '1½"': 2, '2"': 6, '3"': 6, '4"': 6, '6"': 6, '8"': 6, '10"': 6, '12"': 6, '14"': 6, '16"': 6, '18"': 6, '20"': 6, '24"': 6 },
    '¾"': { '¾"': 1, '1"': 2, '1½"': 2, '2"': 6, '3"': 6, '4"': 6, '6"': 6, '8"': 6, '10"': 6, '12"': 6, '14"': 6, '16"': 6, '18"': 6, '20"': 6, '24"': 6 },
    '1"': { '1"': 1, '1½"': 2, '2"': 6, '3"': 6, '4"': 6, '6"': 6, '8"': 6, '10"': 6, '12"': 6, '14"': 6, '16"': 6, '18"': 6, '20"': 6, '24"': 6 },
    '1½"': { '1½"': 1, '2"': 6, '3"': 6, '4"': 6, '6"': 6, '8"': 6, '10"': 6, '12"': 6, '14"': 6, '16"': 6, '18"': 6, '20"': 6, '24"': 6 },
    '2"': { '2"': 3, '3"': 4, '4"': 4, '6"': 5, '8"': 5, '10"': 5, '12"': 5, '14"': 5, '16"': 5, '18"': 5, '20"': 5, '24"': 5 },
    '3"': { '3"': 3, '4"': 4, '6"': 4, '8"': 5, '10"': 5, '12"': 5, '14"': 5, '16"': 5, '18"': 5, '20"': 5, '24"': 5 },
    '4"': { '4"': 3, '6"': 4, '8"': 4, '10"': 5, '12"': 5, '14"': 5, '16"': 5, '18"': 5, '20"': 5, '24"': 5 },
    '6"': { '6"': 3, '8"': 4, '10"': 4, '12"': 4, '14"': 5, '16"': 5, '18"': 5, '20"': 5, '24"': 5 },
    '8"': { '8"': 3, '10"': 4, '12"': 4, '14"': 4, '16"': 4, '18"': 4, '20"': 4, '24"': 5 },
    '10"': { '10"': 3, '12"': 4, '14"': 4, '16"': 4, '18"': 4, '20"': 4, '24"': 4 },
    '12"': { '12"': 3, '14"': 4, '16"': 4, '18"': 4, '20"': 4, '24"': 4 },
    '14"': { '14"': 3, '16"': 4, '18"': 4, '20"': 4, '24"': 4 },
    '16"': { '16"': 3, '18"': 4, '20"': 4, '24"': 4 },
    '18"': { '18"': 3, '20"': 4, '24"': 4 },
    '20"': { '20"': 3, '24"': 4 },
    '24"': { '24"': 3 },
  },
  note: "Matriz completa ½\"–24\" según ACAL-000-ET-C-001, pág. 49.",
};
const B10A = {
  designT: ["-29 a 38", "50", "100", "150", "200"], designP: ["52,1", "51,1", "47,5", "46", "44,7"],
  comps: [
    c("Seamless Pipe", "API 5L Gr. B", "160", "", "ASME B36.10M", "PE", '½"–¾"', "(1)(2)"),
    c("", "", "80", "", "", "PE", '1"–1½"', "(1)(2)"),
    c("", "", "80", "", "", "BE", '2"', "(1)(2)"),
    c("", "", "40", "", "", "BE", '2½"–12"', "(1)(2)"),
    c("SAWL Pipe (100% RX)", "API 5L Gr. B", "40", "", "ASME B36.10M", "BE", '14"–24"', "(1)(2)(3)"),
    c("Seamless Pipe (Nipple)", "ASTM A-106 Gr.B", "XXS", "", "ASME B36.10M", "NPT", '½"–1½"', "(14)"),
    c("Forged Fittings", "ASTM A-105", "", "6000#", "ASME B16.11", "SW", '½"–¾"', ""),
    c("", "", "", "3000#", "", "SW", '1"–1½"', ""),
    c("", "", "", "6000#", "", "NPT", '½"–1½"', "(14)"),
    c("Wrought Pipe Fittings", "ASTM A-234 Gr. WPB", "", "", "ASME B16.9", "BW", '2"–24"', "(6)"),
    c("Flange", "ASTM A-105", "", "300#", "ASME B16.5", "SW/RF", '½"–1½"', "(6)(7)"),
    c("", "", "", "300#", "", "WN/RF", '2"–24"', "(6)(7)"),
    c("Blind Flange", "ASTM A-105", "", "300#", "ASME B16.5", "BLIND RF", '½"–24"', "(7)"),
    c("Orifice Flange", "ASTM A-105", "", "300#", "ASME B16.36", "WN/RF", '2"–24"', "(6)(7)"),
    c("Gaskets", "304 SS Flexible Graphite filler, 4,5mm Nom Thk., 3,2mm Compressed Thk. / CS Zinc outer ring 304 SS inner ring", "", "300#", "ASME B16.20", "—", '½"–24"', "(11)"),
    c("Stud Bolts", "ASTM A-193 Gr.B7-ZINC", "", "", "ASME B18.2.1", "—", "—", "(12)(21)"),
    c("Nuts", "ASTM A-194 Gr.2H-ZINC", "", "", "ASME B18.2.2", "—", "—", ""),
    c("Spectacle Blind", "ASTM A-516 Gr. 70", "", "300#", "ASME B16.48", "RF", '1"–12"', "(8)(19)(20)"),
    c("Paddle & Spacer Blind", "ASTM A-516 Gr. 70", "", "300#", "", "RF", '14"–24"', ""),
    c("Drip Ring", "ASTM A-516 Gr. 70", "", "300#", "", "RF", '1"–12"', ""),
    c("Dielectric Joint", "Ver Nota 10", "", "300#", "ASME B16.21", "RF", '½"–24"', "(10)"),
    c("Olet Fittings", "ASTM A-105", "", "6000#", "MSS SP-97", "SW-NPT", '½"–¾"', "(14)"),
    c("", "", "", "3000#", "", "SW-NPT", '1"–1½"', "(14)"),
    c("", "", "", "3000#", "", "BW", '2"–24"', ""),
    c("Swage Nipple", "ASTM A-234 Gr. WPB", "", "", "MSS SP-95", "BW-PE", '½"–4"', "(6)"),
  ],
  valves: [
    v("Ball", "FCJ8SW7", "Full", "—", "2000WOG", "NPT-F x PE", '½"–1½"', "(1)(2)(3)(5)"),
    v("Ball", "FCJ8SW8", "Full", "—", "800#", "PE", '½"–1½"', "(1)(2)(3)(4)"),
    v("Ball", "VBA03C030", "Full", "—", "300#", "RF", '2"–4"', "(1)(2)(3)"),
    v("Ball", "VBA03C031", "Full", "—", "300#", "RF", '6"–24"', "(1)(2)(3)"),
    v("Globe", "", "—", "—", "300#", "RF", '2"–24"', "(1)(2)(3)"),
    v("Check", "", "—", "Swing", "300#", "RF", '2"–12"', "(1)(2)(3)"),
  ],
  branch: BRANCH_B10A,
  notes: [
    "Extremos biselados según ASME B16.25.",
    "Cañería enterrada: coating externo epoxi fusionado, mín. 16 mils, temperatura de servicio limitada a 65°C según GRAL-100-ET-X-002.",
    "Costura recta con 100% de radiografía.",
    "Eliminada.",
    "Eliminada.",
    "El bore debe coincidir con el schedule de la cañería.",
    "Bridas y extremos bridados: cara serrada spiral 125–250 AARH máx.",
    "Tap hole: ½\" diám. tipo NPT hasta 2\" diám. de cañería, ¾\" para diámetros mayores a 2\".",
    "Eliminada.",
    "Junta dieléctrica: sólo tipo Pikotek VCS o monolítica. No se permite tipo Micarta. Incluye manguito aislante, doble aislación y arandelas de acero para tipo Pikotek.",
    "Gaskets, sellos, asientos y empaquetaduras: libres de materiales con asbesto.",
    "Espárragos roscados en toda su longitud, con dos tuercas hexagonales semiterminadas pesadas.",
    "Válvulas de bola socket weld deben quedar en posición abierta al soldarse a la cañería, para no dañar el asiento.",
    "Fittings roscados sobre process piping: sólo para termopozos y venteos de prueba hidráulica.",
    "Eliminada.",
    "Eliminada.",
    "Ver Nota General 1 (MDMT / espesor de pared, cañería y fittings de acero al carbono).",
    "Ver Nota General 7 (bridas orificio mayores a 6\": jack screw).",
    "Espesor mínimo de drip ring: 38,1 mm.",
    "Oreja de izaje (lifting eye) requerida en tamaños 12\" y mayores.",
    "Ver Nota General 2 (roscas de espárragos y tuercas: UNC hasta 1\", 8UN por encima de 1\").",
  ],
};

const LACAL_FAMILIES_MAP = {
  A1: "gas", A5: "custom", A10: "gas", A10R: "wepoxy", A10RA: "wepoxy", A11: "venteo",
  A13: "fire", A14: "fire", A15: "gas", B1: "hc", B3: "wss", B5: "hc", B10A: "hc",
  B10R: "wepoxy", B10RA: "wepoxy", C1: "gas", C3: "wss", C10: "hc", C10A: "hc",
  C10R: "wserv", C10RA: "wepoxy", D1: "gas", D10: "hc", D10R: "wepoxy", E3: "wss",
  PRFV1: "wnm", Y2: "fire",
};
const LACAL_CLASSES = [
  { code: "A1", page: 6, mat: "C.S.", corr: "3,2mm", rating: "150#", design: "20 kg/cm² @ -29 a 38°C / 14,1 kg/cm² @ 200°C", services: ["Unidad Tratamiento Agua", "Líneas de Condensado", "Sistema Gas Combustible", "Drenajes", "Sist. de Venteos", "Agua de Servicio"] },
  { code: "A5", page: 10, mat: "C.S. / Galv.", corr: "3,2mm", rating: "150#", design: "20 kg/cm² @ -29 a 38°C / 16,1 kg/cm² @ 150°C", services: ["Clase fuera de servicio — reemplazada por A13, A14 y A15"] },
  { code: "A10", page: 13, mat: "C.S.", corr: "1,6mm", rating: "150#", design: "20 kg/cm² @ -29 a 38°C / 14,1 kg/cm² @ 200°C", services: ["Glycol", "Nitrógeno"] },
  { code: "A10R", page: 16, mat: "C.S. w/ int. epoxy coating", corr: "1,6mm", rating: "150#", design: "20 kg/cm² @ -20 a 38°C / 18,71 kg/cm² @ 65°C", services: ["Descarga de agua de inyección a pozos"] },
  { code: "A10RA", page: 20, mat: "C.S. w/ int. epoxy coating", corr: "1,6mm", rating: "150#", design: "20 kg/cm² @ -20 a 38°C / 18,71 kg/cm² @ 65°C", services: ["Agua de Inyección — Presencia de Arena"] },
  { code: "A11", page: 24, mat: "Low Temp. C.S.", corr: "1,6mm", rating: "150#", design: "20 kg/cm² @ -40 a 38°C / 14,1 kg/cm² @ 200°C", services: ["Sistema de Venteos Fríos"] },
  { code: "A13", page: 27, mat: "C.S. / Galv.", corr: "3,2 / 0,0mm", rating: "150#", design: "19,6 kg/cm² @ 0 a 38°C / 50°C", services: ["Agua sistema contra incendios (Above Ground, wet service)"] },
  { code: "A14", page: 30, mat: "C.S. Hot Dip Galv.", corr: "0,0mm", rating: "150#", design: "14 kg/cm² @ -29 a 38°C", services: ["Agua sistema contra incendios (tubería seca)"] },
  { code: "A15", page: 33, mat: "C.S. Hot Dip Galv.", corr: "0,0mm", rating: "150#", design: "20 kg/cm² @ -29 a 38°C / 16,1 kg/cm² @ 150°C", services: ["Aire de instrumentos"] },
  { code: "B1", page: 36, mat: "C.S.", corr: "1,6mm", rating: "300#", design: "52,1 kg/cm² @ -29 a 38°C / 44,7 kg/cm² @ 200°C", services: ["Hidrocarburos"] },
  { code: "B3", page: 40, mat: "S.S.", corr: "0,0mm", rating: "300#", design: "42,2 kg/cm² @ -29 a 38°C / 39,2 kg/cm² @ 65°C", services: ["Agua de Inyección", "Agua de producción", "Condensado", "(cloruros hasta 120.000 ppm @ 80°C)"] },
  { code: "B5", page: 43, mat: "C.S.", corr: "1,6mm", rating: "300#", design: "52,1 kg/cm² @ -29 a 38°C / 37,1 kg/cm² @ 375°C", services: ["Hot Oil"] },
  { code: "B10A", fam: "hc", detail: B10A, page: 47, mat: "C.S.", corr: "3,2mm", rating: "300#", design: "52,1 kg/cm² @ -29 a 38°C / 44,7 kg/cm² @ 200°C", services: ["Gas sin Tratamiento", "Condensado MP", "Presencia de Arena"] },
  { code: "B10R", page: 51, mat: "C.S. w/ int. epoxy coating", corr: "1,6mm", rating: "300#", design: "52,1 kg/cm² @ -20 a 38°C / 50,02 kg/cm² @ 65°C", services: ["Descarga de Bombas de Agua Sandjet"] },
  { code: "B10RA", page: 55, mat: "C.S. w/ int. epoxy coating", corr: "1,6mm", rating: "300#", design: "49,60 kg/cm² @ -20 a 38°C / 46,33 kg/cm² @ 65°C", services: ["Descarga de Bombas de Agua Sandjet — Presencia de Arena"] },
  { code: "C1", page: 58, mat: "C.S.", corr: "1,6mm", rating: "600#", design: "104,1 kg/cm² @ -29 a 38°C / 89,32 kg/cm² @ 200°C", services: ["Gas Deshidratado"] },
  { code: "C3", page: 61, mat: "S.S.", corr: "0,0mm", rating: "600#", design: "84,3 kg/cm² @ -29 a 38°C / 78,4 kg/cm² @ 65°C", services: ["Agua de Inyección", "Agua de producción", "Condensado", "(cloruros hasta 120.000 ppm @ 80°C)"] },
  { code: "C10", page: 64, mat: "C.S.", corr: "3,2mm", rating: "600#", design: "104,1 kg/cm² @ -29 a 38°C / 89,32 kg/cm² @ 200°C", services: ["Gas sin Tratamiento", "Condensado HP"] },
  { code: "C10A", page: 67, mat: "C.S.", corr: "3,2mm", rating: "600#", design: "104,1 kg/cm² @ -29 a 38°C / 89,32 kg/cm² @ 200°C", services: ["Gas sin Tratamiento", "Condensado HP", "Presencia de Arena"] },
  { code: "C10R", page: 70, mat: "C.S.", corr: "1,6mm", rating: "600#", design: "99,30 kg/cm² @ -29 a 38°C / 92,66 kg/cm² @ 65°C", services: ["Agua de Producción", "Condensado"] },
  { code: "C10RA", page: 73, mat: "C.S. w/ int. epoxy coating", corr: "1,6mm", rating: "600#", design: "104,1 kg/cm² @ -29 a 38°C / 102,2 kg/cm² @ 65°C", services: ["Agua de Producción", "Condensado", "Presencia de Arena"] },
  { code: "D1", page: 76, mat: "C.S.", corr: "1,6mm", rating: "900#", design: "150 kg/cm² @ -29 a 65°C / 134 kg/cm² @ 200°C", services: ["Gas Deshidratado"] },
  { code: "D10", page: 79, mat: "C.S.", corr: "3,2mm", rating: "900#", design: "156,2 kg/cm² @ -29 a 38°C / 134 kg/cm² @ 200°C", services: ["Gas sin Tratamiento"] },
  { code: "D10R", page: 83, mat: "C.S. w/ int. epoxy coating", corr: "1,6mm", rating: "900#", design: "156,2 kg/cm² @ -20 a 38°C / 145,8 kg/cm² @ 65°C", services: ["Agua de Producción"] },
  { code: "E3", page: 87, mat: "S.S.", corr: "0,0mm", rating: "1500#", design: "156,2 kg/cm² @ -20 a 38°C / 145,8 kg/cm² @ 65°C", services: ["Agua de Inyección", "Agua de producción", "Condensado", "(cloruros hasta 120.000 ppm @ 80°C)"] },
  { code: "PRFV1", page: 90, mat: "PRFV", corr: "N/A", rating: "150#", design: "10,5 kg/cm² @ 0 a 80°C", services: ["Agua de Producción"] },
  { code: "Y2", page: 94, mat: "HDPE", corr: "N/A", rating: "150#", design: "16,31 kg/cm² @ 21°C", services: ["Agua Sistema Contra Incendios (Underground Service)"] },
].map((k) => ({ ...k, fam: k.fam || LACAL_FAMILIES_MAP[k.code] || "custom" }));


const CLASSES = [
  { code: "AC1", fam: "gas", detail: AC1, page: 7, mat: "C.S.", corr: "1,6mm", rating: "150#", design: "20 kg/cm² @ -29 a 38°C", services: ["Fuel Gas", "Service Air", "Starting Air", "Nitrogen", "Glycol", "Flare", "Atm. Vents", "Gas Lift", "Hydrocarbons liquid & Gas"] },
  { code: "AC3", fam: "wserv", page: 11, mat: "C.S.", corr: "3,2mm", rating: "150#", design: "20 kg/cm² @ -29 a 38°C", services: ["Service Water", "Open Drain", "Close Drain", "Hydrocarbons liquid & Gas"] },
  { code: "AL1", fam: "venteo", page: 15, mat: "Low T. C.S.", corr: "1,6mm", rating: "150#", design: "20 kg/cm² @ -45 a 38°C", services: ["Low Temp. Flare", "Cold Vents"] },
  { code: "AC3F", fam: "fire", page: 19, mat: "C.S. / Galv.", corr: "3,2 / 0,0mm", rating: "150#", design: "20 kg/cm² @ 0 a 38°C", services: ["Fire Water (AG wet service)"] },
  { code: "AG0F", fam: "fire", page: 22, mat: "C.S. Hot Dip Galv.", corr: "0,0mm", rating: "150#", design: "14 kg/cm² @ -29 a 38°C", services: ["Fire Water (AG dry service)"] },
  { code: "AG0", fam: "gas", page: 25, mat: "C.S. Galv.", corr: "0mm", rating: "150#", design: "20 kg/cm² @ -29 a 38°C", services: ["Instrument Air"] },
  { code: "BC1", fam: "hc", detail: BC1, page: 28, mat: "C.S.", corr: "1,6mm", rating: "300#", design: "52,1 kg/cm² @ -29 a 38°C", services: ["Hydrocarbons liquid & Gas with treatment", "Hydrocarbons liquid & Gas without treatment"] },
  { code: "BC3", fam: "hc", page: 32, mat: "C.S.", corr: "3,2mm", rating: "300#", design: "52,1 kg/cm² @ -29 a 38°C", services: ["Hydrocarbons liquid & Gas with treatment", "Hydrocarbons liquid & Gas without treatment"] },
  { code: "BC3A", fam: "hc", page: 36, mat: "C.S.", corr: "3,2mm", rating: "300#", design: "52,1 kg/cm² @ -29 a 38°C", services: ["Hydrocarbons liquid & Gas with sand service"] },
  { code: "CC1", fam: "hc", page: 40, mat: "C.S.", corr: "1,6mm", rating: "600#", design: "104,1 kg/cm² @ -29 a 38°C", services: ["Hydrocarbons liquid & Gas with treatment"] },
  { code: "DC1", fam: "hc", page: 43, mat: "C.S.", corr: "1,6mm", rating: "900#", design: "150 kg/cm² @ -29 a 65°C", services: ["Hydrocarbons Gas with treatment"] },
  { code: "AF0G", fam: "wnm", page: 47, mat: "GRP", corr: "NA", rating: "150#", design: "10,5 kg/cm² @ 0 a 80°C", services: ["Produced Water (AG & UG)"] },
  { code: "AP0X", fam: "wnm", detail: AP0X, page: 51, mat: "PEX", corr: "NA", rating: "150#", design: "16,3 kg/cm² @ 0 a 60°C", services: ["Produced Water (AG & UG)"] },
  { code: "AC1R", fam: "wepoxy", page: 55, mat: "C.S. w/ int. coating", corr: "1,6mm", rating: "150#", design: "20 kg/cm² @ -20 a 38°C", services: ["Produced Water", "Injection Water"] },
  { code: "BC1R", fam: "wepoxy", page: 59, mat: "C.S. w/ int. coating", corr: "1,6mm", rating: "300#", design: "52,1 kg/cm² @ -20 a 38°C", services: ["Produced Water", "Injection Water"] },
  { code: "DC1R", fam: "wepoxy", page: 63, mat: "C.S. w/ int. coating", corr: "1,6mm", rating: "900#", design: "156,2 kg/cm² @ -20 a 38°C", services: ["Produced Water", "Injection Water"] },
  { code: "EC1R", fam: "wepoxy", page: 67, mat: "C.S. w/ int. coating", corr: "1,6mm", rating: "1500#", design: "210,8 kg/cm² @ -20 a 38°C", services: ["Produced Water", "Injection Water"] },
  { code: "AP0H", fam: "wserv", page: 71, mat: "HDPE", corr: "0mm", rating: "150#/PN16", design: "16,31 kg/cm² @ 21°C", services: ["Service Water Underground"] },
  { code: "AP0HF", fam: "fire", page: 74, mat: "HDPE", corr: "0mm", rating: "125/150#/PN16", design: "16,31 kg/cm² @ 21°C", services: ["Fire Water (UG wet service)"] },
  { code: "BS0M", fam: "wss", page: 77, mat: "S.S.", corr: "0,0mm", rating: "300#", design: "39,91 kg/cm² @ -29 a 38°C", services: ["Produced Water", "Injection Water", "(complementa AC1R en diámetros menores)"] },
  { code: "CS0M", fam: "wss", page: 80, mat: "S.S.", corr: "0,0mm", rating: "600#", design: "81,92 kg/cm² @ -29 a 38°C", services: ["Produced Water", "Injection Water", "(complementa BC1R en diámetros menores)"] },
  { code: "ES0M", fam: "wss", page: 83, mat: "S.S.", corr: "0,0mm", rating: "1500#", design: "207,76 kg/cm² @ -20 a 38°C", services: ["Produced Water", "Injection Water", "(complementa DC1R/EC1R en diámetros menores)"] },
  { code: "BC6", fam: "hc", page: 86, mat: "C.S.", corr: "6,4mm", rating: "300#", design: "52,1 kg/cm² @ -29 a 38°C", services: ["Hydrocarbons liquid & Gas without treatment"] },
];

const seedClasses = () => CLASSES.map((k) => ({ ...k, on: true }));
const seedLaCalera = () => LACAL_CLASSES.map((k) => ({ ...k, on: true }));
const SEED_PLANTS = [
  { id: "epf-og", name: "EPF · Oil & Gas Upstream (PCN)",
    kind: "Central de producción temprana — crudo y gas no convencional",
    ref: "018-ABDC-00300-TI-C-0001 · Rev.1", code: "ASME B31.3", seeded: true,
    codeConvention: "abcd", naming: NAMING, classes: seedClasses() },
  { id: "lacal-pluspetrol", name: "Yacimiento La Calera · Pluspetrol",
    kind: "Facilities Engineering & Construction — desarrollo de yacimiento",
    ref: "ACAL-000-ET-C-001 · Rev. D/E/F/0", code: "ASME B31.3", seeded: true,
    codeConvention: "freeform", naming: null, classes: seedLaCalera() },
  { id: "hdt-ref", name: "Refinería · Unidad HDT",
    kind: "Hidrotratamiento — plantilla base a completar",
    ref: "—", code: "ASME B31.3", seeded: false, codeConvention: "abcd", naming: NAMING, classes: [] },
  { id: "litio", name: "Planta de Litio · Concentradora",
    kind: "Minería / salmuera — plantilla base a completar",
    ref: "—", code: "ASME B31.3", seeded: false, codeConvention: "abcd", naming: NAMING, classes: [] },
];

const ratingLevel = (r) =>
  /1500/.test(r) ? 5 : /900/.test(r) ? 4 : /600/.test(r) ? 3 : /300/.test(r) ? 2 : 1;
const clone = (x) => JSON.parse(JSON.stringify(x));
const uid = () => "p" + Math.random().toString(36).slice(2, 8);

/* Persistencia en localStorage del navegador ─────────────────────────────── */
const STORE_KEY = "pcgen:plants:v1";
function storageLoad() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
function storageSave(plants) {
  try { window.localStorage.setItem(STORE_KEY, JSON.stringify(plants)); } catch (e) {}
}

/* ═══════════════════════════════ UI ════════════════════════════════════ */
function Gauge5({ level }) {
  return (
    <span className="inline-flex items-end gap-[2px] h-4" title={`Rating ${level}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`w-[3px] rounded-sm ${i <= level ? "bg-[#2C568E]" : "bg-slate-200"}`}
          style={{ height: `${5 + i * 2}px` }} />
      ))}
    </span>
  );
}

function SpecTable({ cols, rows }) {
  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg">
      <table className="w-full text-[11.5px] font-mono">
        <thead><tr className="bg-slate-100 text-slate-600">
          {cols.map((h) => <th key={h} className="text-left font-semibold px-2.5 py-1.5 whitespace-nowrap border-b border-slate-200">{h}</th>)}
        </tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={cols.length} className="px-3 py-4 text-slate-400">Sin filas cargadas.</td></tr>}
          {rows.map((r, i) => {
            const isCont = r[0] === "";
            return (
              <tr key={i} className={i % 2 && !isCont ? "bg-slate-50/60" : "bg-white"}>
                {r.map((cell, j) => (
                  <td key={j} className={`px-2.5 py-1 align-top whitespace-nowrap border-t border-slate-100 ${j === 0 ? "font-semibold text-slate-800" : "text-slate-600"}`}>{cell}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EditTable({ cols, rows, onChange }) {
  const upd = (i, j, val) => { const n = rows.map((r) => r.slice()); n[i][j] = val; onChange(n); };
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="text-[11px] font-mono min-w-full">
          <thead><tr className="bg-slate-100">
            {cols.map((h) => <th key={h} className="px-2 py-1.5 text-left font-semibold text-slate-600 border-b border-slate-200 whitespace-nowrap">{h}</th>)}
            <th className="border-b border-slate-200 w-8"></th>
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-slate-100">
                {r.map((cell, j) => (
                  <td key={j} className="p-0.5">
                    <input value={cell} onChange={(e) => upd(i, j, e.target.value)}
                      className="w-full min-w-[64px] px-1.5 py-1 text-[11px] rounded border border-transparent hover:border-slate-200 focus:border-[#3F72AC] focus:outline-none bg-transparent" />
                  </td>
                ))}
                <td className="px-1 text-center">
                  <button onClick={() => onChange(rows.filter((_, k) => k !== i))} className="text-slate-300 hover:text-red-500"><X size={13} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={() => onChange([...rows, cols.map(() => "")])}
        className="text-[12px] text-[#1F3F6E] hover:text-[#173257] flex items-center gap-1"><Plus size={13} /> Agregar fila</button>
    </div>
  );
}

function BranchMatrix({ data }) {
  if (!data || !data.sizes || data.sizes.length === 0)
    return <div className="text-[13px] text-slate-400">Sin tabla de ramificaciones cargada.</div>;
  const { sizes, m, legend, note } = data;
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto border border-slate-200 rounded-lg inline-block max-w-full">
        <table className="text-[11px] font-mono border-collapse">
          <thead><tr>
            <th className="bg-[#1D3A63] text-slate-100 px-2 py-1.5 text-[10px]">RAMA \ RUN</th>
            {sizes.map((s) => <th key={s} className="bg-slate-100 text-slate-600 px-2 py-1.5 font-semibold border-l border-slate-200">{s}</th>)}
          </tr></thead>
          <tbody>
            {sizes.map((br) => (
              <tr key={br}>
                <td className="bg-slate-50 text-slate-700 font-semibold px-2 py-1 border-t border-slate-200">{br}</td>
                {sizes.map((run) => {
                  const val = m[br] && m[br][run];
                  return <td key={run} className={`text-center px-2 py-1 border-t border-l border-slate-100 ${val ? "text-slate-800 font-semibold" : "text-slate-200"}`}>{val || "·"}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5">Referencias</div>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
          {legend.map((l, i) => (
            <div key={i} className="flex gap-2 text-[12px] text-slate-600"><span className="font-mono font-semibold text-slate-800 w-4">{i + 1}</span><span>{l}</span></div>
          ))}
        </div>
        {note && <div className="mt-3 text-[11px] text-slate-400 italic">{note}</div>}
      </div>
    </div>
  );
}

const TABS = [
  { id: "cond", label: "Condiciones", icon: Gauge }, { id: "comp", label: "Componentes", icon: Table2 },
  { id: "valv", label: "Válvulas", icon: CircleDot }, { id: "branch", label: "Ramificaciones", icon: GitBranch },
  { id: "notes", label: "Notas", icon: StickyNote },
];
const emptyDetail = () => ({ designT: [""], designP: [""], comps: [], valves: [], branch: { legend: [], sizes: [], m: {}, note: "" }, notes: [] });

function DetailPanel({ item, onClose, onSave }) {
  const [tab, setTab] = useState("cond");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const originalCode = useRef(item.code);

  useEffect(() => { originalCode.current = item.code; setEditing(false); setTab("cond"); }, [item]);
  useEffect(() => {
    if (editing) setDraft(clone({ ...item, detail: item.detail || emptyDetail() }));
  }, [editing, item]);

  const view = editing && draft ? draft : item;
  const d = view.detail;
  const lvl = ratingLevel(view.rating);
  const setD = (patch) => setDraft((dr) => ({ ...dr, detail: { ...dr.detail, ...patch } }));
  const save = () => { onSave(originalCode.current, draft); setEditing(false); };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={onClose}>
      <div className="w-full max-w-3xl h-full bg-slate-50 shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 bg-white border-b border-slate-200 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              {editing ? (
                <input value={draft?.code || ""} onChange={(e) => setDraft({ ...draft, code: e.target.value })}
                  className="font-mono text-2xl font-bold text-slate-900 w-28 border-b border-[#7FC4EE] focus:outline-none" />
              ) : (
                <span className="font-mono text-2xl font-bold text-slate-900">{view.code}</span>
              )}
              <Gauge5 level={lvl} />
            </div>
            {editing ? (
              <div className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
                <label className="col-span-3 text-[10px] uppercase tracking-wider text-slate-400">Servicios (uno por línea)</label>
                <textarea value={(draft.services || []).join("\n")} onChange={(e) => setDraft({ ...draft, services: e.target.value.split("\n") })}
                  rows={3} className="col-span-3 font-mono text-[12px] px-2 py-1.5 border border-slate-200 rounded focus:border-[#3F72AC] focus:outline-none" />
                <input value={draft.mat} onChange={(e) => setDraft({ ...draft, mat: e.target.value })} placeholder="Material" className="px-2 py-1 border border-slate-200 rounded focus:border-[#3F72AC] focus:outline-none" />
                <input value={draft.corr} onChange={(e) => setDraft({ ...draft, corr: e.target.value })} placeholder="Corrosión" className="px-2 py-1 border border-slate-200 rounded focus:border-[#3F72AC] focus:outline-none" />
                <input value={draft.rating} onChange={(e) => setDraft({ ...draft, rating: e.target.value })} placeholder="Rating" className="px-2 py-1 border border-slate-200 rounded focus:border-[#3F72AC] focus:outline-none" />
              </div>
            ) : (
              <>
                <div className="mt-1 text-[13px] text-slate-600">{view.mat} · corrosión {view.corr} · rating {view.rating}</div>
                <div className="mt-0.5 text-[12px] text-slate-500">{(view.services || []).join(" · ")}</div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {editing ? (
              <>
                <button onClick={save} className="flex items-center gap-1 px-3 py-1.5 text-[13px] rounded-md bg-[#2C568E] text-white hover:bg-[#1F3F6E]"><Save size={14} /> Guardar</button>
                <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-[13px] rounded-md text-slate-500 hover:bg-slate-100">Cancelar</button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1 px-3 py-1.5 text-[13px] rounded-md border border-slate-200 text-slate-700 hover:border-[#7FC4EE]"><Pencil size={13} /> Editar</button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400"><X size={18} /></button>
          </div>
        </div>

        <div className="px-5 pt-3 bg-white border-b border-slate-200 flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon; const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-[13px] rounded-t-md whitespace-nowrap border-b-2 ${active ? "border-[#2C568E] text-slate-900 font-medium" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {!d && !editing ? (
            <div className="flex flex-col items-center justify-center text-center py-16 text-slate-500">
              <FileWarning size={32} className="text-slate-300 mb-3" />
              <div className="text-sm font-medium text-slate-700 mb-1">Detalle todavía sin cargar</div>
              <div className="text-[13px] max-w-sm">Esta clase tiene su servicio, material y rating, pero las tablas de componentes/válvulas/ramificaciones aún no fueron transcritas. Tocá <b>Editar</b> para cargarlas.</div>
            </div>
          ) : (
            <>
              {tab === "cond" && (editing ? (
                <DesignEdit T={d.designT} P={d.designP} onChange={(T, P) => setD({ designT: T, designP: P })} rating={view.rating} />
              ) : (
                <DesignView T={d.designT} P={d.designP} rating={view.rating} />
              ))}
              {tab === "comp" && (editing ? <EditTable cols={COMP_COLS} rows={d.comps} onChange={(rows) => setD({ comps: rows })} /> : <SpecTable cols={COMP_COLS} rows={d.comps} />)}
              {tab === "valv" && (editing ? <EditTable cols={VALVE_COLS} rows={d.valves} onChange={(rows) => setD({ valves: rows })} /> : <SpecTable cols={VALVE_COLS} rows={d.valves} />)}
              {tab === "branch" && (
                editing ? (
                  <div className="text-[13px] text-slate-500 bg-white border border-slate-200 rounded-lg p-4">
                    La edición de la matriz de ramificaciones se agrega en la próxima iteración. Por ahora se conserva la tabla cargada; se muestra abajo.
                    <div className="mt-4"><BranchMatrix data={d.branch} /></div>
                  </div>
                ) : <BranchMatrix data={d.branch} />
              )}
              {tab === "notes" && (editing ? <NotesEdit notes={d.notes} onChange={(n) => setD({ notes: n })} /> : (
                d.notes && d.notes.length ? (
                  <ol className="space-y-2">
                    {d.notes.map((n, i) => <li key={i} className="flex gap-2.5 text-[13px] text-slate-700"><span className="font-mono text-slate-400 shrink-0">{i + 1}.</span><span>{n}</span></li>)}
                  </ol>
                ) : <div className="text-[13px] text-slate-400">Sin notas cargadas.</div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DesignView({ T, P, rating }) {
  return (
    <div className="space-y-4">
      <div className="text-[11px] uppercase tracking-wider text-slate-500">Presión de diseño vs. temperatura</div>
      <div className="overflow-x-auto border border-slate-200 rounded-lg inline-block">
        <table className="text-[12px] font-mono">
          <thead><tr className="bg-slate-100 text-slate-600">
            <th className="text-left px-3 py-1.5 border-b border-slate-200">Temp. °C</th>
            {T.map((t, i) => <th key={i} className="px-3 py-1.5 border-b border-l border-slate-200">{t}</th>)}
          </tr></thead>
          <tbody><tr>
            <td className="px-3 py-1.5 text-slate-700 font-semibold">Presión kg/cm²</td>
            {P.map((p, i) => <td key={i} className="px-3 py-1.5 text-center text-slate-800 border-l border-slate-100">{p}</td>)}
          </tr></tbody>
        </table>
      </div>
      <div className="text-[12px] text-slate-500">La presión admisible desrata con la temperatura. Rating de bridas: {rating}.</div>
    </div>
  );
}
function DesignEdit({ T, P, onChange, rating }) {
  const setT = (i, val) => { const t = T.slice(); t[i] = val; onChange(t, P); };
  const setP = (i, val) => { const p = P.slice(); p[i] = val; onChange(T, p); };
  return (
    <div className="space-y-3">
      <div className="text-[11px] uppercase tracking-wider text-slate-500">Presión de diseño vs. temperatura (rating {rating})</div>
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="text-[12px] font-mono">
          <tbody>
            <tr>
              <td className="px-2 py-1 text-slate-500 font-semibold whitespace-nowrap border-b border-slate-100">Temp. °C</td>
              {T.map((t, i) => (
                <td key={i} className="p-0.5 border-b border-l border-slate-100">
                  <input value={t} onChange={(e) => setT(i, e.target.value)} className="w-20 px-1.5 py-1 text-center rounded border border-transparent hover:border-slate-200 focus:border-[#3F72AC] focus:outline-none bg-transparent" />
                </td>
              ))}
              <td className="border-b border-slate-100"></td>
            </tr>
            <tr>
              <td className="px-2 py-1 text-slate-500 font-semibold whitespace-nowrap">Pres. kg/cm²</td>
              {P.map((p, i) => (
                <td key={i} className="p-0.5 border-l border-slate-100">
                  <input value={p} onChange={(e) => setP(i, e.target.value)} className="w-20 px-1.5 py-1 text-center rounded border border-transparent hover:border-slate-200 focus:border-[#3F72AC] focus:outline-none bg-transparent" />
                </td>
              ))}
              <td className="px-1 text-center align-middle">
                <button onClick={() => onChange(T.filter((_, k) => k !== T.length - 1), P.filter((_, k) => k !== P.length - 1))}
                  disabled={T.length <= 1} className="text-slate-300 hover:text-red-500 disabled:opacity-30" title="Quitar última columna"><X size={13} /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <button onClick={() => onChange([...T, ""], [...P, ""])} className="text-[12px] text-[#1F3F6E] hover:text-[#173257] flex items-center gap-1"><Plus size={13} /> Agregar columna (temperatura)</button>
    </div>
  );
}
function NotesEdit({ notes, onChange }) {
  const upd = (i, val) => { const n = notes.slice(); n[i] = val; onChange(n); };
  return (
    <div className="space-y-2">
      {notes.map((n, i) => (
        <div key={i} className="flex gap-2 items-start">
          <span className="font-mono text-[12px] text-slate-400 mt-2">{i + 1}.</span>
          <textarea value={n} onChange={(e) => upd(i, e.target.value)} rows={2} className="flex-1 text-[13px] px-2 py-1.5 border border-slate-200 rounded focus:border-[#3F72AC] focus:outline-none" />
          <button onClick={() => onChange(notes.filter((_, k) => k !== i))} className="text-slate-300 hover:text-red-500 mt-2"><X size={14} /></button>
        </div>
      ))}
      <button onClick={() => onChange([...notes, ""])} className="text-[12px] text-[#1F3F6E] hover:text-[#173257] flex items-center gap-1"><Plus size={13} /> Agregar nota</button>
    </div>
  );
}

function CodeStamp({ sel, setSel, classes }) {
  const parts = ["A", "B", "C", "D"];
  const assembled = parts.map((p) => sel[p] || "·").join("");
  const match = classes.find((k) => k.code === assembled);
  return (
    <div className="rounded-xl bg-[#122542] text-slate-100 p-5">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#8FAFD6] mb-4"><Layers size={13} /> Ensamblador de clase · A-B-C-D</div>
      <div className="flex items-baseline justify-center gap-1 mb-4">
        {parts.map((p) => (
          <span key={p} className="flex flex-col items-center">
            <span className={`font-mono text-4xl leading-none ${sel[p] ? "text-[#7FC4EE]" : "text-[#3C567F]"}`}>{sel[p] || "·"}</span>
            <span className="mt-2 text-[10px] tracking-widest text-[#7291BB]">{p}</span>
          </span>
        ))}
      </div>
      <div className="text-center text-[13px] mb-4">
        {match ? <span className="text-emerald-300">Coincide con <span className="font-mono font-semibold">{match.code}</span></span>
          : assembled !== "····" ? <span className="text-[#8FAFD6]">Sin clase en este registro</span>
          : <span className="text-[#7291BB]">Ensamblá cada segmento</span>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {parts.map((p) => (
          <div key={p}>
            <div className="text-[10px] uppercase tracking-wider text-[#7291BB] mb-1">{p} · {NAMING[p].label}</div>
            <select value={sel[p] || ""} onChange={(e) => setSel({ ...sel, [p]: e.target.value })}
              className="w-full bg-[#1D3A63] text-slate-100 text-[13px] rounded-md px-2 py-1.5 border border-[#2C4C7C] focus:border-[#3F72AC] focus:outline-none">
              <option value="">—</option>
              {NAMING[p].rows.map((r) => <option key={r.code} value={r.code}>{r.code} · {r.value}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
function Convention() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-left">
        <span className="flex items-center gap-2 text-sm font-medium text-slate-800"><Info size={15} className="text-slate-400" /> Convención A-B-C-D</span>
        {open ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {Object.values(NAMING).map((t) => (
            <div key={t.slot}>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5"><span className="font-mono font-semibold text-[#1F3F6E]">{t.slot}</span> · {t.label}</div>
              <div className="border border-slate-200 rounded-md overflow-hidden">
                {t.rows.map((r, i) => (
                  <div key={r.code} className={`flex text-[12px] ${i % 2 ? "bg-slate-50" : "bg-white"}`}>
                    <div className="w-10 shrink-0 font-mono font-semibold text-slate-700 px-2 py-1 border-r border-slate-100">{r.code}</div>
                    <div className="px-2 py-1 text-slate-600">{r.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RegisterCard({ item, onOpen, onToggle, onDuplicate, onRemove }) {
  const lvl = ratingLevel(item.rating);
  return (
    <div className={`group relative rounded-lg border bg-white transition p-3.5 ${item.on ? "border-slate-200 hover:border-[#7FC4EE] hover:shadow-sm" : "border-slate-100 opacity-60"}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button onClick={() => onToggle(item.code)} title={item.on ? "Incluida en el proyecto" : "Excluida del proyecto"}>
            {item.on ? <CheckSquare size={16} className="text-[#2C568E]" /> : <Square size={16} className="text-slate-300" />}
          </button>
          <button onClick={() => onOpen(item)} className="font-mono text-lg font-bold text-slate-900 hover:text-[#1F3F6E]">{item.code}</button>
        </div>
        <Gauge5 level={lvl} />
      </div>
      <button onClick={() => onOpen(item)} className="text-left w-full">
        <div className="text-[12px] text-slate-600 leading-snug mb-2 h-8 overflow-hidden">{item.services.filter((s) => !s.startsWith("(")).join(" · ")}</div>
        <div className="flex flex-wrap gap-1.5 text-[10.5px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{item.rating}</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{item.mat}</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">CA {item.corr}</span>
        </div>
      </button>
      <div className="mt-2 flex items-center justify-between">
        {item.detail ? <span className="text-[10.5px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">detalle completo</span>
          : <span className="text-[10.5px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">sólo resumen</span>}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button onClick={() => onDuplicate(item.code)} title="Duplicar" className="p-1 text-slate-400 hover:text-slate-700"><Copy size={13} /></button>
          <button onClick={() => onRemove(item.code)} title="Eliminar" className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
        </div>
      </div>
    </div>
  );
}

function PlantBar({ plants, activeId, setActiveId, onNew, onRename, onDelete }) {
  const [menu, setMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const active = plants.find((p) => p.id === activeId);
  const [name, setName] = useState(active?.name || "");
  useEffect(() => { setName(active?.name || ""); setRenaming(false); }, [activeId]);
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-slate-400"><Building2 size={16} /><span className="text-[12px] uppercase tracking-wider">Tipo de planta</span></div>
        <select value={activeId} onChange={(e) => setActiveId(e.target.value)}
          className="text-[14px] font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 focus:border-[#3F72AC] focus:outline-none">
          {plants.map((p) => <option key={p.id} value={p.id}>{p.name}{p.seeded ? "  ✓ cargada" : "  · plantilla"}</option>)}
        </select>
        {renaming ? (
          <span className="flex items-center gap-1">
            <input value={name} onChange={(e) => setName(e.target.value)} className="text-[14px] px-2 py-1 border border-[#7FC4EE] rounded focus:outline-none" />
            <button onClick={() => { onRename(activeId, name); setRenaming(false); }} className="p-1.5 text-[#1F3F6E]"><Check size={15} /></button>
          </span>
        ) : (
          <button onClick={() => setRenaming(true)} className="p-1.5 text-slate-400 hover:text-slate-700" title="Renombrar"><Pencil size={14} /></button>
        )}
        {plants.length > 1 && <button onClick={() => onDelete(activeId)} className="p-1.5 text-slate-400 hover:text-red-500" title="Eliminar tipo de planta"><Trash2 size={14} /></button>}
        <div className="relative ml-auto">
          <button onClick={() => setMenu(!menu)} className="flex items-center gap-1 text-[13px] px-3 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:border-[#7FC4EE]"><Plus size={14} /> Nuevo tipo de planta</button>
          {menu && (
            <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 text-[13px]">
              <button onClick={() => { onNew("dup"); setMenu(false); }} className="w-full text-left px-3 py-2 hover:bg-[#EAF3FB]">
                <div className="font-medium text-slate-800">Duplicar estándar EPF</div>
                <div className="text-[11px] text-slate-500">Arranca con las 23 clases pre-cargadas para editar</div>
              </button>
              <button onClick={() => { onNew("blank"); setMenu(false); }} className="w-full text-left px-3 py-2 hover:bg-[#EAF3FB]">
                <div className="font-medium text-slate-800">Empezar en blanco</div>
                <div className="text-[11px] text-slate-500">Registro vacío, cargás tus clases</div>
              </button>
            </div>
          )}
        </div>
      </div>
      {active && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-2 -mt-1">
          <span className="text-[12px] text-slate-500">{active.kind}</span>
          {active.ref !== "—" && <span className="text-[11px] font-mono text-slate-400"> · {active.ref} · {active.code}</span>}
        </div>
      )}
    </div>
  );
}

export default function Generador() {
  const [plants, setPlants] = useState(SEED_PLANTS);
  const [activeId, setActiveId] = useState(SEED_PLANTS[0].id);
  const [ready, setReady] = useState(false);
  const [openCode, setOpenCode] = useState(null);
  const [asm, setAsm] = useState({});
  const [q, setQ] = useState("");
  const [onlyIncluded, setOnlyIncluded] = useState(false);

  useEffect(() => {
    const saved = storageLoad();
    if (saved && Array.isArray(saved) && saved.length) {
      setPlants(saved);
      if (!saved.find((p) => p.id === activeId)) setActiveId(saved[0].id);
    }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) storageSave(plants); }, [plants, ready]);

  const active = plants.find((p) => p.id === activeId) || plants[0];
  const setActiveClasses = (fn) =>
    setPlants((ps) => ps.map((p) => (p.id !== activeId ? p : { ...p, classes: fn(p.classes) })));

  const uniqueCode = (base, list) => {
    let code = base, i = 2;
    while (list.find((k) => k.code === code)) code = `${base}-${i++}`;
    return code;
  };
  const openItem = active.classes.find((k) => k.code === openCode) || null;

  const handlers = {
    toggle: (code) => setActiveClasses((cs) => cs.map((k) => (k.code === code ? { ...k, on: !k.on } : k))),
    remove: (code) => { setActiveClasses((cs) => cs.filter((k) => k.code !== code)); if (openCode === code) setOpenCode(null); },
    duplicate: (code) => setActiveClasses((cs) => {
      const src = cs.find((k) => k.code === code); if (!src) return cs;
      const copy = clone({ ...src, code: uniqueCode(src.code, cs), fam: "custom", page: null });
      const idx = cs.findIndex((k) => k.code === code);
      return [...cs.slice(0, idx + 1), copy, ...cs.slice(idx + 1)];
    }),
    addBlank: () => setActiveClasses((cs) => [
      { code: uniqueCode("NUEVA", cs), fam: "custom", mat: "—", corr: "—", rating: "150#", page: null, on: true, services: ["Servicio nuevo"], detail: null },
      ...cs,
    ]),
    saveClass: (originalCode, nc) => setActiveClasses((cs) => cs.map((k) => (k.code === originalCode ? { ...nc, on: k.on } : k))),
    resetStandard: () => setActiveClasses(() =>
      activeId === "lacal-pluspetrol" ? seedLaCalera() : seedClasses()
    ),
    newPlant: (mode) => {
      const np = {
        id: uid(),
        name: mode === "dup" ? "EPF (copia) — editar" : "Nueva planta",
        kind: mode === "dup" ? "Duplicado del estándar EPF" : "Plantilla en blanco",
        ref: "—", code: "ASME B31.3", seeded: false, naming: NAMING,
        classes: mode === "dup" ? seedClasses() : [],
      };
      setPlants((ps) => [...ps, np]); setActiveId(np.id);
    },
    renamePlant: (id, name) => setPlants((ps) => ps.map((p) => (p.id === id ? { ...p, name } : p))),
    deletePlant: (id) => setPlants((ps) => {
      const next = ps.filter((p) => p.id !== id);
      if (id === activeId && next.length) setActiveId(next[0].id);
      return next.length ? next : ps;
    }),
  };

  const fams = useMemo(() => {
    const g = {};
    active.classes.forEach((k) => {
      if (onlyIncluded && !k.on) return;
      const hay = (k.code + " " + k.services.join(" ") + " " + k.mat).toLowerCase();
      if (q && !hay.includes(q.toLowerCase())) return;
      (g[k.fam] ||= []).push(k);
    });
    return g;
  }, [active, q, onlyIncluded]);
  const includedCount = active.classes.filter((k) => k.on).length;

  if (!ready)
    return <div className="min-h-[60vh] flex items-center justify-center text-slate-400 text-sm">Cargando registro…</div>;

  return (
    <div className="bg-slate-100 text-slate-900" style={{ fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif" }}>
      <PlantBar plants={plants} activeId={activeId} setActiveId={setActiveId}
        onNew={handlers.newPlant} onRename={handlers.renamePlant} onDelete={handlers.deletePlant} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6">
        <div className="space-y-5 order-2 lg:order-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">
              Registro de clases
              <span className="ml-2 text-[12px] font-normal text-slate-500">{includedCount} de {active.classes.length} en el proyecto</span>
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={handlers.addBlank} className="flex items-center gap-1 text-[12px] px-2.5 py-1.5 rounded-md bg-[#132A4C] text-white hover:bg-[#1F3F6E]"><Plus size={13} /> Agregar clase</button>
              {active.seeded && <button onClick={handlers.resetStandard} className="flex items-center gap-1 text-[12px] px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:border-[#7FC4EE]" title="Volver a las clases del documento original"><RotateCcw size={13} /> Restaurar estándar</button>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar servicio, código o material…"
                className="w-full pl-8 pr-2 py-1.5 text-[13px] border border-slate-200 rounded-md focus:border-[#3F72AC] focus:outline-none bg-white" />
            </div>
            <label className="flex items-center gap-1.5 text-[12px] text-slate-600 cursor-pointer select-none">
              <input type="checkbox" checked={onlyIncluded} onChange={(e) => setOnlyIncluded(e.target.checked)} className="accent-[#2C568E]" />
              Sólo las del proyecto
            </label>
          </div>

          {active.classes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-5 py-12 text-center">
              <Building2 size={26} className="text-slate-300 mx-auto mb-3" />
              <div className="text-[14px] font-medium text-slate-600">Plantilla vacía</div>
              <div className="text-[13px] text-slate-500 mt-1 max-w-md mx-auto">Este tipo de planta todavía no tiene clases. Duplicá el estándar EPF como base desde "Nuevo tipo de planta", o cargá tus clases con "Agregar clase".</div>
            </div>
          ) : (
            Object.entries(fams).map(([fam, list]) => (
              <div key={fam}>
                <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">{FAMILIES[fam] || fam}</div>
                <div className="grid sm:grid-cols-2 gap-3 mb-1">
                  {list.map((k) => <RegisterCard key={k.code} item={k} onOpen={(it) => setOpenCode(it.code)} onToggle={handlers.toggle} onDuplicate={handlers.duplicate} onRemove={handlers.remove} />)}
                </div>
              </div>
            ))
          )}
          {active.classes.length > 0 && Object.keys(fams).length === 0 && (
            <div className="text-[13px] text-slate-400 py-6">Sin resultados para el filtro actual.</div>
          )}
        </div>

        <div className="order-1 lg:order-2 space-y-4">
          {active.codeConvention === "abcd" ? (
            <>
              <CodeStamp sel={asm} setSel={setAsm} classes={active.classes} />
              <Convention />
            </>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-[13px] text-slate-600 leading-relaxed">
              <div className="flex items-center gap-2 text-[13px] font-medium text-slate-800 mb-1.5"><Info size={15} className="text-slate-400" /> Código propio por clase</div>
              Este proyecto no usa la convención segmentada A-B-C-D: cada clase tiene su propio código de documento (ej. B10A, A10R). El ensamblador de la izquierda no aplica acá — buscá por código directamente en el registro o con la barra de búsqueda.
            </div>
          )}
          <div className="text-[11px] text-slate-400 leading-relaxed px-1">
            Los cambios se guardan en este navegador (localStorage). Otro equipo o modo incógnito no los ve — el próximo paso, cuando la lógica esté validada, es un backend compartido.
          </div>
        </div>
      </main>

      {openItem && <DetailPanel item={openItem} onClose={() => setOpenCode(null)} onSave={handlers.saveClass} />}
    </div>
  );
}
