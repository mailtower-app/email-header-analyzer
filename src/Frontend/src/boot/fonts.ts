// Self-hosted IBM Plex faces (sans + mono).
// Bundled via @fontsource so no request ever leaves the browser — the tool's
// privacy promise rules out a webfont CDN.
import { defineBoot } from '#q-app/wrappers';

import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';

export default defineBoot(() => {
  //
});
