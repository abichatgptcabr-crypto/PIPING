import { supabase } from "./supabaseClient";

/* ═══════════════════════════ Sesión ═══════════════════════════════════ */
export async function getCurrentUserEmail() {
  const { data } = await supabase.auth.getUser();
  return data?.user?.email || "desconocido";
}

/* ═══════════════════════════ Lectura ═══════════════════════════════════ */
// Trae todas las plantas con sus clases anidadas, listas para usar en la UI.
export async function fetchAllPlants() {
  const { data: plants, error: e1 } = await supabase
    .from("plants")
    .select("*")
    .order("created_at", { ascending: true });
  if (e1) throw e1;

  const { data: classes, error: e2 } = await supabase
    .from("classes")
    .select("*")
    .order("code", { ascending: true });
  if (e2) throw e2;

  return plants.map((p) => ({
    id: p.id,
    name: p.name,
    kind: p.kind,
    ref: p.ref,
    code: p.code,
    seeded: p.seeded,
    codeConvention: p.naming_convention,
    classes: classes
      .filter((k) => k.plant_id === p.id)
      .map((k) => ({
        id: k.id,
        code: k.code,
        fam: k.fam,
        mat: k.mat,
        corr: k.corr,
        rating: k.rating,
        design: k.design,
        services: k.services || [],
        page: k.page,
        on: k.included,
        detail: k.detail,
        reviewedBy: k.reviewed_by,
        reviewedAt: k.reviewed_at,
        reviewedAgainst: k.reviewed_against,
        updatedAt: k.updated_at,
      })),
  }));
}

export async function fetchRevisions(classId) {
  const { data, error } = await supabase
    .from("class_revisions")
    .select("*")
    .eq("class_id", classId)
    .order("edited_at", { ascending: false });
  if (error) throw error;
  return data;
}

/* ═══════════════════════════ Semilla (primera carga) ══════════════════ */
// Si la base está vacía, la llena con los datos que ya vienen en el código
// (data/plants.js). Sólo corre una vez — si ya hay plantas, no hace nada.
export async function ensureSeeded(seedPlants) {
  const { count, error } = await supabase
    .from("plants")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  if (count > 0) return false;

  for (const plant of seedPlants) {
    const { error: pErr } = await supabase.from("plants").insert({
      id: plant.id,
      name: plant.name,
      kind: plant.kind,
      ref: plant.ref,
      code: plant.code,
      seeded: plant.seeded,
      naming_convention: plant.codeConvention,
    });
    if (pErr) throw pErr;

    if (plant.classes.length) {
      const rows = plant.classes.map((k) => ({
        plant_id: plant.id,
        code: k.code,
        fam: k.fam,
        mat: k.mat,
        corr: k.corr,
        rating: k.rating,
        design: k.design,
        services: k.services,
        page: k.page ?? null,
        included: true,
        detail: k.detail || null,
      }));
      const { error: cErr } = await supabase.from("classes").insert(rows);
      if (cErr) throw cErr;
    }
  }
  return true;
}

// Trae la base de datos al día con lo que hay en el código: agrega plantas
// y clases nuevas que todavía no existan, y completa el "detail" de clases
// que ya existen pero siguen en "sólo resumen" (detail null) cuando el
// código ya tiene el detalle cargado. Nunca pisa una clase que el usuario
// ya editó a mano (si detail ya tiene algo, no se toca). Corre siempre,
// no sólo la primera vez — así cualquier avance en epf.js/lacal.js llega
// solo, sin volver a sembrar toda la base.
export async function syncFromSeed(seedPlants) {
  const { data: existingPlants, error: pErr } = await supabase.from("plants").select("id");
  if (pErr) throw pErr;
  const existingPlantIds = new Set((existingPlants || []).map((p) => p.id));

  const { data: existingClasses, error: cErr } = await supabase
    .from("classes")
    .select("id, plant_id, code, detail");
  if (cErr) throw cErr;
  const existingByKey = new Map((existingClasses || []).map((k) => [k.plant_id + "::" + k.code, k]));

  let added = 0, filled = 0;

  for (const plant of seedPlants) {
    if (!existingPlantIds.has(plant.id)) {
      const { error } = await supabase.from("plants").insert({
        id: plant.id, name: plant.name, kind: plant.kind, ref: plant.ref,
        code: plant.code, seeded: plant.seeded, naming_convention: plant.codeConvention,
      });
      if (error) throw error;
    }

    for (const k of plant.classes) {
      const key = plant.id + "::" + k.code;
      const existing = existingByKey.get(key);

      if (!existing) {
        const { error } = await supabase.from("classes").insert({
          plant_id: plant.id, code: k.code, fam: k.fam, mat: k.mat, corr: k.corr,
          rating: k.rating, design: k.design, services: k.services, page: k.page ?? null,
          included: true, detail: k.detail || null,
        });
        if (error) throw error;
        added++;
      } else if (!existing.detail && k.detail) {
        const { error } = await supabase.from("classes").update({ detail: k.detail }).eq("id", existing.id);
        if (error) throw error;
        filled++;
      }
    }
  }
  return { added, filled };
}

/* ═══════════════════════════ Escritura: clases ═════════════════════════ */
export async function insertClass(plantId, classData) {
  const { data, error } = await supabase
    .from("classes")
    .insert({
      plant_id: plantId,
      code: classData.code,
      fam: classData.fam || "custom",
      mat: classData.mat || "—",
      corr: classData.corr || "—",
      rating: classData.rating || "",
      design: classData.design || "",
      services: classData.services || [],
      page: classData.page ?? null,
      included: true,
      detail: classData.detail || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Inserta muchas clases de una — para duplicar un estándar completo en otra planta.
export async function bulkInsertClasses(plantId, classesArray) {
  if (!classesArray.length) return [];
  const rows = classesArray.map((k) => ({
    plant_id: plantId, code: k.code, fam: k.fam || "custom",
    mat: k.mat || "—", corr: k.corr || "—", rating: k.rating || "",
    design: k.design || "", services: k.services || [], page: k.page ?? null,
    included: true, detail: k.detail || null,
  }));
  const { data, error } = await supabase.from("classes").insert(rows).select();
  if (error) throw error;
  return data;
}

// Borra todas las clases de una planta y las vuelve a cargar desde el estándar
// original (data/plants.js) — "Restaurar estándar".
export async function resetPlantClasses(plantId, seedClassesArray) {
  const { error: delErr } = await supabase.from("classes").delete().eq("plant_id", plantId);
  if (delErr) throw delErr;
  return bulkInsertClasses(plantId, seedClassesArray);
}

// Guarda cambios de una clase Y deja constancia en el historial.
export async function updateClassWithRevision(classId, patch, note = "") {
  const editedBy = await getCurrentUserEmail();

  const dbPatch = {};
  if ("code" in patch) dbPatch.code = patch.code;
  if ("fam" in patch) dbPatch.fam = patch.fam;
  if ("mat" in patch) dbPatch.mat = patch.mat;
  if ("corr" in patch) dbPatch.corr = patch.corr;
  if ("rating" in patch) dbPatch.rating = patch.rating;
  if ("design" in patch) dbPatch.design = patch.design;
  if ("services" in patch) dbPatch.services = patch.services;
  if ("detail" in patch) dbPatch.detail = patch.detail;

  const { data, error } = await supabase
    .from("classes")
    .update(dbPatch)
    .eq("id", classId)
    .select()
    .single();
  if (error) throw error;

  await supabase.from("class_revisions").insert({
    class_id: classId,
    edited_by: editedBy,
    snapshot: data,
    note,
  });

  return data;
}

export async function toggleClassIncluded(classId, included) {
  const { error } = await supabase.from("classes").update({ included }).eq("id", classId);
  if (error) throw error;
}

export async function deleteClass(classId) {
  const { error } = await supabase.from("classes").delete().eq("id", classId);
  if (error) throw error;
}

export async function markReviewed(classId, against) {
  const reviewedBy = await getCurrentUserEmail();
  const { data, error } = await supabase
    .from("classes")
    .update({ reviewed_by: reviewedBy, reviewed_at: new Date().toISOString(), reviewed_against: against })
    .eq("id", classId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function clearReviewed(classId) {
  const { error } = await supabase
    .from("classes")
    .update({ reviewed_by: null, reviewed_at: null, reviewed_against: null })
    .eq("id", classId);
  if (error) throw error;
}

/* ═══════════════════════════ Escritura: plantas ════════════════════════ */
export async function createPlant({ id, name, kind, ref, code, codeConvention }) {
  const { data, error } = await supabase
    .from("plants")
    .insert({ id, name, kind, ref, code, seeded: false, naming_convention: codeConvention })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function renamePlant(id, name) {
  const { error } = await supabase.from("plants").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function deletePlant(id) {
  const { error } = await supabase.from("plants").delete().eq("id", id);
  if (error) throw error;
}

/* ═══════════════════════════ Especificaciones armadas ══════════════════ */
export async function fetchSpecs() {
  const { data, error } = await supabase.from("specs").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function saveSpec(meta, classIds) {
  const createdBy = await getCurrentUserEmail();
  const { data: spec, error } = await supabase
    .from("specs")
    .insert({
      title: meta.title, project: meta.project, client: meta.client,
      doc_number: meta.docNumber, revision: meta.revision, company: meta.company,
      confidential: meta.confidential, date: meta.date, created_by: createdBy,
    })
    .select()
    .single();
  if (error) throw error;

  if (classIds.length) {
    const rows = classIds.map((classId, i) => ({ spec_id: spec.id, class_id: classId, position: i }));
    const { error: itemsErr } = await supabase.from("spec_items").insert(rows);
    if (itemsErr) throw itemsErr;
  }
  return spec;
}

export async function fetchSpecItems(specId) {
  const { data, error } = await supabase
    .from("spec_items")
    .select("position, classes(*)")
    .eq("spec_id", specId)
    .order("position", { ascending: true });
  if (error) throw error;
  return data.map((row) => row.classes);
}

// Trazabilidad: en qué specs guardadas se usó esta clase (para el tab
// "Specs" del panel de detalle).
export async function fetchSpecsForClass(classId) {
  const { data, error } = await supabase
    .from("spec_items")
    .select("specs(*)")
    .eq("class_id", classId);
  if (error) throw error;
  return data
    .map((row) => row.specs)
    .filter(Boolean)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function deleteSpec(id) {
  const { error } = await supabase.from("specs").delete().eq("id", id);
  if (error) throw error;
}
