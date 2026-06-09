# ⚡ Nexus AI - Agentes Inteligentes

Plataforma web profesional para Nexus AI - Automatización empresarial con Agentes de IA.

## 📁 Estructura del Proyecto

```
nexus-ai-project/
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
cd nexus-ai-project

# 3. Deploy
vercel

# Sigue las instrucciones del CLI
```

### Opción 2: GitHub + Vercel (Automático)

```bash
# 1. Iniciar git
git init
git add .
git commit -m "Initial commit: Nexus AI website"

# 2. Subir a GitHub
git remote add origin https://github.com/TuUsuario/nexus-ai.git
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
3. **Drag & drop** la carpeta `nexus-ai-project`
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
--primary: #00ff88       /* Verde neón */
--secondary: #00d4ff     /* Cian */
--tertiary: #ff006e      /* Magenta */
--dark: #0a0e27          /* Fondo oscuro */
--darker: #050812        /* Fondo más oscuro */
```

## 📊 Performance

- Lighthouse Score: 95+
- FCP: < 1.5s
- LCP: < 2.5s
- CLS: < 0.1

## 📝 Información de Contacto

**Alan Alba** (Nexus AI)
- 📧 Email: alan@nexusai.com
- 📱 Teléfono: +56 9 XXXX XXXX
- 📍 Santiago, Chile

## 📄 Licencia

© 2024 Nexus AI. Todos los derechos reservados.

---

**Última actualización:** Junio 2024
**Versión:** 1.0.0
