// Supabase Edge Function: extract-spec
// Recibe un PDF (base64, unas pocas páginas de UNA clase de piping) y le pide
// a Claude que lo estructure en el mismo formato que usa Hytech Tools.
// La clave de Anthropic vive en un secret de Supabase — nunca en el navegador.

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Sos un asistente que transcribe especificaciones técnicas de piping
class a un formato JSON estructurado. Vas a recibir unas pocas páginas de PDF que
describen UNA sola clase de cañería (piping class), típicamente con: un encabezado
con temperatura/presión de diseño, rating de bridas, material, corrosión permitida
y servicio; una tabla de componentes; una tabla de válvulas; una matriz de
ramificaciones; y una lista de notas numeradas.

Devolvé ÚNICAMENTE un objeto JSON (sin texto antes ni después, sin bloque de código
markdown) con esta forma exacta:

{
  "code": "string — el código de la clase, ej. AC1 o B10A",
  "mat": "string — material principal, breve, ej. 'C.S.' o 'S.S.'",
  "corr": "string — sobreespesor de corrosión, ej. '1,6mm'",
  "rating": "string — rating de bridas, ej. '150#'",
  "design": "string — resumen de presión/temperatura de diseño en una línea",
  "services": ["array de strings, un servicio por elemento"],
  "detail": {
    "designT": ["array de temperaturas, en el mismo orden que designP"],
    "designP": ["array de presiones, correspondientes a cada temperatura"],
    "comps": [["Descripción","Material","Sch.","Rating","Dim. Code","Ends","Size","Notas"], "... una fila por componente, mismas 8 columnas, string vacío si no aplica"],
    "valves": [["Tipo","Commodity Code","Bore","Type","Rating","End","Size","Notas"], "... una fila por válvula, mismas 8 columnas"],
    "branch": {
      "legend": ["referencias numeradas de la matriz, como texto"],
      "sizes": ["tamaños de la matriz en orden, ej. '2\\"', '3\\"'"],
      "m": { "tamañoRama": { "tamañoRun": "valor de esa celda (número o texto)" } }
    },
    "notes": ["una nota por elemento, en el orden numerado del documento"]
  },
  "warning": "string — dejalo vacío si extrajiste todo con confianza. Si el documento parece tener MÁS de una clase, si alguna tabla no se ve clara, o si tuviste que adivinar algún valor, explicalo acá en una o dos frases."
}

Reglas importantes:
- Si una tabla tiene filas de continuación (celdas vacías al principio que heredan
  la descripción de la fila anterior), respetá eso — dejá la descripción vacía en
  esas filas de continuación, igual que en el documento original.
- No inventes datos que no estén en el documento. Si algo no se lee, dejalo como
  string vacío y mencionalo en "warning".
- La respuesta tiene que ser JSON válido, nada más.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  try {
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "Falta configurar ANTHROPIC_API_KEY en los secrets de Supabase." }), {
        status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const { pdfBase64, fileName } = await req.json();
    if (!pdfBase64) {
      return new Response(JSON.stringify({ error: "Falta el PDF (pdfBase64)." }), {
        status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdfBase64 } },
              { type: "text", text: `Extraé la clase de piping de este documento (${fileName || "sin nombre"}) según el formato indicado.` },
            ],
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      return new Response(JSON.stringify({ error: `Error de la API de Claude: ${errText}` }), {
        status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const data = await anthropicRes.json();
    const textBlock = data.content?.find((b: any) => b.type === "text");
    if (!textBlock) throw new Error("La respuesta no tuvo texto.");

    let cleaned = textBlock.text.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(cleaned);

    return new Response(JSON.stringify({ result: parsed }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || String(e) }), {
      status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
