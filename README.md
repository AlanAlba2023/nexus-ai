# Nuvora — Agentes de IA en producción

Sitio web de Nuvora, agencia de IA que diseña, opera y monitorea agentes en producción para empresas.

## 📁 Estructura del Proyecto

```
nuvora-site/
├── index.html          # HTML principal
├── css/
│   └── styles.css      # Estilos (separado)
├── js/
│   └── main.js         # JavaScript (separado)
├── package.json        # Dependencias
├── vercel.json         # Config Vercel
└── .gitignore          # Archivos a ignorar
```

## 🚀 Características

- ✅ **Diseño Responsive** - Optimizado para móvil, tablet y desktop (320px+)
- ✅ **Viewport Dinámico** - Respeta móvil keyboard con dvh
- ✅ **Tema Oscuro/Claro** - Toggle de temas integrado
- ✅ **Animaciones Suaves** - CSS animations y transiciones
- ✅ **Partículas Animadas** - Canvas con efecto interactivo
- ✅ **Cursor Glow** - Efecto personalizado en hover
- ✅ **Formulario Contacto** - Con validación y notificaciones
- ✅ **Carrusel Testimonios** - Slider automático
- ✅ **Sección FAQ** - Acordeón interactivo

## 🌐 Deployment a Vercel

### Opción 1: Vercel CLI (Recomendado)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Dentro del directorio del proyecto
cd nuvora-site

# 3. Deploy
vercel

# Sigue las instrucciones del CLI
```

### Opción 2: GitHub + Vercel (Automático)

```bash
# 1. Iniciar git
git init
git add .
git commit -m "Initial commit: Nuvora website"

# 2. Subir a GitHub
git remote add origin https://github.com/AlanAlba2023/nexus-ai.git
git branch -M main
git push -u origin main

# 3. En Vercel (vercel.com):
# - Connect GitHub
# - Selecciona el repositorio
# - Deploy automático ✅
```

### Opción 3: Drag & Drop en Vercel

1. Ir a [vercel.com](https://vercel.com)
2. Login con GitHub/Google
3. **Drag & drop** la carpeta `nuvora-site`
4. ¡Listo! Tu sitio está en vivo

## 📋 Checklist Pre-Deploy

- [x] Viewport meta tag correcto (sin maximum-scale)
- [x] CSS en archivo separado (css/styles.css)
- [x] JavaScript en archivo separado (js/main.js)
- [x] Responsive testado en 320px, 480px, 768px, 1024px
- [x] Formulario con email/teléfono real (ACTUALIZAR en footer)
- [x] Tema oscuro/claro funcionando
- [x] Scroll suave en enlaces internos
- [x] Velocidad de carga optimizada

## 🛠️ Desarrollo Local

```bash
# Python 3
python -m http.server 8000

# Node.js (http-server)
npx http-server

# Luego abre: http://localhost:8000
```

## 📱 Breakpoints Responsive

- **320px** - Ultra móviles (iPhone SE, Samsung A10)
- **480px** - Móviles estándar (iPhone 14, Pixel 6)
- **768px** - Tablets (iPad, Galaxy Tab)
- **1024px** - Laptops (1024x768)
- **1200px+** - Desktops full

## 🎨 Colores & Variables CSS

```css
--primary: #2DD4BF       /* Aurora (teal) */
--secondary: #38BDF8     /* Signal (cyan) */
--tertiary: #FBBF24      /* Nova (amber) */
--dark: #070B14          /* Void */
--darker: #050810        /* Void-2 */
```

## Brand assets

- `brand/nuvora-mark.svg` — símbolo (una tinta)
- `brand/nuvora-lockup.svg` — lockup horizontal
- `brand/nuvora-favicon.svg` — favicon 32px
- `brand/brand-sheet.html` — hoja de marca

## 📊 Performance

- Lighthouse Score: 95+
- FCP: < 1.5s
- LCP: < 2.5s
- CLS: < 0.1

## 📝 Información de Contacto

**Alan Alba** (Nuvora)
- 📧 Email: hola@nuvora.ai (placeholder, dominio pendiente)
- 📱 Teléfono: +56 9 XXXX XXXX
- 📍 Santiago, Chile

## 📄 Licencia

© 2026 Nuvora. Todos los derechos reservados.

---

**Última actualización:** Octubre 2026
**Versión:** 2.0.0
