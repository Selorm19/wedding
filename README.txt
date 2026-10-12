HOLY MATRIMONY INVITATION — CUSTOMIZABLE EDITION

Files:
- index.html: page structure
- config.json: wedding details and editable content
- css/styles.css: visual styling
- js/main.js: interactions and live customizer
- js/tailwind.config.js: Tailwind theme configuration

Run locally from this folder with: python3 -m http.server 8000
Then visit http://localhost:8000. Do not open index.html using file:// because config.json is loaded with fetch.

Customize button: edit couple names/photos/bios, love story milestones, gallery image paths, venue directions, programme events, theme, RSVP settings and feature visibility. Export JSON Config after editing and replace config.json on your host to publish the settings.

Images can be local paths such as assets/groom.jpg or hosted image URLs. Place local images inside an assets folder and keep the paths in config or customizer aligned. RSVP submission requires a real endpoint configured in the RSVP Form settings.
