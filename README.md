# Neon Geometry Dash

## 🚀 Version 2.0 - TypeScript + Astro

A high-performance, neon-themed Geometry Dash clone rebuilt with **TypeScript** and **Astro** for better type safety, maintainability, and blazing-fast performance.

## ✨ Features

- **TypeScript**: Full type safety for robust game logic
- **Astro Framework**: Modern, fast, component-based architecture
- **Dual Game Modes**: Cube (jump) and Ship (fly) modes with portal switching
- **Neon Visual Style**: Stunning gradient effects and smooth animations
- **Multiple Levels**: 3 progressively challenging levels
- **Audio Effects**: Dynamic Web Audio API sound generation
- **Smooth Performance**: Optimized rendering with requestAnimationFrame
- **Responsive Design**: Works on desktop and mobile devices

## 🎮 Game Mechanics

### Controls
- **Desktop**: Hold SPACE to jump/fly, release to fall
- **Mobile**: Tap and hold screen to jump/fly

### Game Modes
1. **Cube Mode**: Jump over obstacles by pressing space
2. **Ship Mode**: Hold to fly up, release to glide down
3. **Portals**: Transform between cube and ship modes

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
/
├── public/
│   └── styles/
│       └── global.css       # Global styles
├── src/
│   ├── components/
│   │   ├── Menu.astro       # Main menu component
│   │   └── GameCanvas.astro # Game canvas component
│   ├── layouts/
│   │   └── Layout.astro     # Base layout
│   ├── pages/
│   │   └── index.astro      # Main page
│   └── scripts/
│       ├── game.ts          # Game logic (TypeScript)
│       └── types.ts         # Type definitions
├── astro.config.mjs         # Astro configuration
├── tsconfig.json            # TypeScript configuration
└── package.json
```

## 🎨 Technologies

- **Astro**: Modern web framework
- **TypeScript**: Type-safe JavaScript
- **HTML5 Canvas**: For rendering
- **Web Audio API**: For sound effects
- **CSS3**: For styling and animations

## 🚀 Performance Optimizations

- Time-based animation loop for consistent framerates
- Efficient collision detection
- Object pooling for particles
- Off-screen culling for obstacles
- Minimal DOM manipulation
- Type-safe code prevents runtime errors

## 🎯 Future Enhancements

- [ ] More game modes (Ball, UFO, Wave)
- [ ] Level editor
- [ ] Music synchronization
- [ ] Power-ups and collectibles
- [ ] Online leaderboards
- [ ] Custom level sharing

## 📄 License

MIT License - Feel free to use and modify!

## 🎮 Play Now!

Open `index.html` in your browser or run the dev server to start playing!

---

Built with ❤️ using TypeScript & Astro