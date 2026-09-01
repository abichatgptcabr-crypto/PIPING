# Hytech Tools

Sitio interno de Hytech para herramientas de ingeniería de cañería. Primera
herramienta publicada: **Generador de piping class** — estándar de clases
pre-cargado por tipo de planta, editable (componentes, válvulas, condiciones
de diseño y ramificaciones), con el ensamblador de nomenclatura A-B-C-D.

Hecho con React + Vite + Tailwind CSS v4. Los cambios que hagas en el
generador se guardan en el navegador de cada persona (`localStorage`); no hay
backend compartido todavía — ver "Próximos pasos" abajo.

## Publicarlo en GitHub Pages (repo `abichatgptcabr-crypto/TUBERÍA`)

### 1. Subir este código al repo

Si el repo ya está creado pero vacío (como el tuyo), desde esta misma
carpeta:

```bash
cd hytech-tools
git init
git remote add origin https://github.com/abichatgptcabr-crypto/TUBER%C3%8DA.git
git add -A
git commit -m "Primera versión: home + generador de piping class"
git branch -M main
git push -u origin main
```

Si preferís clonar el repo vacío primero y copiar los archivos adentro:

```bash
git clone https://github.com/abichatgptcabr-crypto/TUBER%C3%8DA.git
# copiá todo el contenido de esta carpeta hytech-tools/ adentro del repo clonado
cd TUBERÍA
git add -A
git commit -m "Primera versión: home + generador de piping class"
git push
```

> El nombre del repo tiene tilde (Í), por eso en la URL de clonado aparece
> como `%C3%8D`. En GitHub Desktop o cualquier cliente gráfico no hace falta
> tocar nada, se resuelve solo.

### 2. Activar GitHub Pages

En el repo: **Settings → Pages → Build and deployment → Source →
GitHub Actions**. No hace falta elegir una rama a mano: el workflow que ya
está en `.github/workflows/deploy.yml` compila el sitio y lo publica solo
cada vez que hacés push a `main`.

### 3. Ver el sitio

Después del primer push, entrá a **Actions** en el repo y esperá a que el
job "Deploy a GitHub Pages" termine (tarda ~1 minuto). La URL final queda en
**Settings → Pages**, normalmente:

```
https://abichatgptcabr-crypto.github.io/TUBER%C3%8DA/
```

## Desarrollo local

```bash
npm install
npm run dev       # servidor local con recarga en caliente
npm run build     # genera dist/ para producción
npm run preview   # sirve dist/ localmente para probarlo antes de publicar
```

## Estructura

```
src/
  App.jsx              nav simple (Inicio ↔ herramientas) + header con logo
  pages/Home.jsx        landing con el listado de herramientas
  pages/Generador.jsx   el generador de piping class completo
  assets/hytech-logo.png
  index.css             tokens de color de marca (paleta Hytech) + tipografía
```

## Próximos pasos (cuando quieras seguir)

- **Agregar una segunda industria/tipo de planta** con datos reales: se
  agrega como bloque de datos en `Generador.jsx` (`CLASSES`, `SEED_PLANTS`),
  no hace falta tocar la lógica.
- **Persistencia compartida entre personas**: hoy cada quien edita en su
  propio navegador. El siguiente paso natural es un backend chico (o una
  hoja de cálculo/Google Sheet como fuente) para que el registro sea uno
  solo para todo el equipo.
- **Export a PDF/Excel** con el formato real de la especificación de Hytech.
- Nueva herramienta: **Registro de MTO/BOM** (ya tiene lugar reservado en la
  home, sin definir todavía).
