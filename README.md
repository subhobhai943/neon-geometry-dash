# Neon Geometry Dash

A vibrant, neon-themed endless runner game inspired by Geometry Dash, built with HTML5, CSS3, and JavaScript. Features multiple challenging levels, dynamic audio effects, and smooth gameplay mechanics.

## Features

- **Neon Visual Style**: Eye-catching neon colors with glow effects and smooth animations
- **Multiple Levels**: 3 progressively challenging levels with unique obstacle patterns
- **Audio Effects**: Dynamic sound effects for jumps, collisions, and victories using Web Audio API
- **Smooth Gameplay**: 60 FPS gameplay with responsive controls
- **Particle Effects**: Dynamic particle system for visual feedback
- **Trail Effect**: Player leaves a glowing trail for enhanced visuals
- **Progress Tracking**: Real-time progress bar showing level completion
- **Responsive Design**: Works on desktop and mobile devices

## Game Mechanics

### Controls
- **Desktop**: Press SPACE or click to jump
- **Mobile**: Tap the screen to jump

### Levels
1. **Level 1**: Basic obstacles - single spikes and blocks
2. **Level 2**: Intermediate patterns - double obstacles, gaps, and platforms
3. **Level 3**: Advanced challenges - stairs, tunnels, and wave patterns

### Obstacle Types
- **Spikes**: Yellow triangular hazards on the ground
- **Blocks**: Red square obstacles
- **Platforms**: Green elevated platforms
- **Ceiling Spikes**: Overhead hazards in advanced levels

## Technologies Used

- **HTML5 Canvas**: For rendering game graphics
- **CSS3**: For styling and neon effects
- **JavaScript**: Game logic and physics
- **Web Audio API**: For dynamic sound generation

## Installation & Setup

### Option 1: Direct Play
1. Clone or download this repository
2. Open `index.html` in a modern web browser
3. Start playing!

### Option 2: Local Server (Recommended)
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx http-server
```
Then navigate to `http://localhost:8000`

## File Structure

```
neon-geometry-dash/
│
├── index.html          # Main HTML file
├── styles.css          # Styling and neon effects
├── game.js            # Game logic and mechanics
└── README.md          # This file
```

## Game Configuration

You can customize the game by modifying the CONFIG object in `game.js`:

```javascript
const CONFIG = {
    GRAVITY: 0.6,           // Gravity strength
    JUMP_FORCE: -12,        // Jump power
    PLAYER_SIZE: 30,        // Player dimensions
    SCROLL_SPEED: 5,        // Game speed
    NEON_COLORS: {...}      // Color scheme
};
```

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Touch controls supported

## Performance Optimization

- Canvas rendering optimized for 60 FPS
- Efficient collision detection
- Particle system with lifecycle management
- Off-screen obstacle culling

## Future Enhancements

- [ ] More levels with increasing difficulty
- [ ] Power-ups and collectibles
- [ ] Leaderboard system
- [ ] Background music
- [ ] Level editor
- [ ] Mobile app packaging

## Credits

Inspired by Geometry Dash by RobTop Games

## License

MIT License - Feel free to use and modify!

## Contributing

Feel free to submit issues and pull requests!

---

Enjoy the neon rush! 🎮✨