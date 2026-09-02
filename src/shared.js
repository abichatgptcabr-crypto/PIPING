/* Generado por split de data/plants.js — Hytech Tools */

export const FAMILIES = {
  gas: "Gas y utilitarios", hc: "Hidrocarburos", venteo: "Venteos y antorcha",
  fire: "Agua contra incendio", wepoxy: "Agua prod./iny. · acero c/ epoxi",
  wss: "Agua prod./iny. · acero inox", wnm: "Agua prod./iny. · no metálica",
  wserv: "Agua de servicio y drenajes", custom: "Clases propias",
};
export const COMP_COLS = ["Descripción", "Material", "Sch.", "Rating", "Dim. Code", "Ends", "Size", "Notas"];
export const VALVE_COLS = ["Tipo", "Commodity Code", "Bore", "Type", "Rating", "End", "Size", "Notas"];
export const ratingLevel = (r) =>
  /1500/.test(r) ? 5 : /900/.test(r) ? 4 : /600/.test(r) ? 3 : /300/.test(r) ? 2 : 1;
export const clone = (x) => JSON.parse(JSON.stringify(x));
export const uid = () => "p" + Math.random().toString(36).slice(2, 8);
