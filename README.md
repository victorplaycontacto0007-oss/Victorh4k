# ⚡ VictorH4K — Cyberpunk Premium

🌐 **Live:** https://victorh4k.vercel.app

## Estructura

```
victorh4k/
├── index.html      ← página principal
├── style.css       ← estilos + tema cyberpunk
├── script.js       ← animaciones e interactividad
├── vite.config.js  ← configuración Vite
├── package.json    ← dependencias
├── vercel.json     ← configuración Vercel
├── .gitignore
└── README.md
```

---

## PASO A PASO — GitHub + Vercel

### PASO 1 — Instalar dependencias (solo la primera vez)

Abre **Git Bash** o **CMD** en `C:\Victorh4k` y ejecuta:

```bash
npm install
```

Esto crea la carpeta `node_modules/` con Vite.

---

### PASO 2 — Subir a GitHub

```bash
git init
git add .
git commit -m "feat: VictorH4K cyberpunk site"
git branch -M main
git remote add origin https://github.com/TuUsuario/victorh4k.git
git push -u origin main
```

> Reemplaza **TuUsuario** con tu usuario real de GitHub.

---

### PASO 3 — Configurar Vercel

1. Ve a **vercel.com** → **Add New Project**
2. Importa el repo **victorh4k**
3. Vercel detecta automáticamente la configuración de `vercel.json`
4. Clic **Deploy** ✅

Vercel ejecuta `npm install` + `npm run build` y publica la carpeta `dist/`.

---

### PASO 4 — Actualizar en el futuro

```bash
git add .
git commit -m "descripción del cambio"
git push
```

Vercel se actualiza automáticamente. ✅

---

### Ver en local (opcional)

```bash
npm run dev
```

Abre http://localhost:3000

---

© 2025 VictorH4K · Todos los derechos reservados.
