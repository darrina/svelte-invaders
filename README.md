# Space Invaders

A classic Space Invaders game built with Svelte 5 and Vite, featuring responsive design and touch controls.

## Features

- Classic Space Invaders gameplay with authentic arcade-style graphics
- Responsive design that adapts to both landscape and portrait orientations
- Touch controls for mobile devices (swipe to move, tap to shoot)
- Keyboard controls for desktop (arrow keys/WASD to move, space to shoot)
- Progressive difficulty with waves
- Sound effects and animations
- High score tracking
- UFO bonus targets

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm

### Installation

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open your browser and navigate to the local server URL displayed in the terminal.

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Controls

### Desktop
- **Arrow Keys / A & D**: Move left and right
- **Space / Up Arrow**: Shoot
- **P / Escape**: Pause game
- **Enter**: Start game / Continue to next wave

### Mobile
- **Swipe**: Move player left and right
- **Tap**: Shoot
- **Pause Button**: Pause/resume game

## Game Rules

- Destroy all aliens to advance to the next wave
- Use shields for protection (they degrade with hits)
- Earn bonus points by shooting the mystery UFO
- You have 3 lives
- Game ends if aliens reach your position or you lose all lives

### Point Values
- Top row aliens: 30 points
- Middle rows: 20 points
- Bottom rows: 10 points
- Mystery UFO: 50-300 points

## Technology Stack

- [Svelte 5](https://svelte.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool and dev server
- HTML5 Canvas for rendering
- Web Audio API for sound effects

## License

MIT
