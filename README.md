# Blackstone H5

Blackstone H5 is a standalone, no-build browser prototype for a fantasy
domain-management game. You play the lord of Blackstone, make decisions,
watch the town change, and follow the people and events that shape its history.

## Features

- Event cards with choices that affect treasury, order, food, population, and prestige.
- A simulated world feed with NPC travel, commerce, conversations, disputes, and quests.
- Quest publishing and filtering for combat, exploration, investigation, and construction.
- Territory management with shops, taxes, commerce, and food reserves.
- NPC profiles with relationships, memories, thoughts, and recent actions.
- A chronicle timeline and touch-friendly event-card swiping.

## Run it

No Node.js, server, or dependency installation is required. Open `index.html`
directly in a modern browser.

For a local HTTP server instead:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

## Project status

This is a playable UI and simulation prototype. Values, events, and NPC
behavior are illustrative; there is no backend and no save/load system yet.

The project is implemented with plain HTML, CSS, and JavaScript. Runtime
artwork is stored in `assets/`.

## License

Released under the MIT License. See [LICENSE](LICENSE).
