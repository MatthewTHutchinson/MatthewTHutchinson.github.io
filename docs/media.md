# Portfolio Media

- `public/media/<project>/`: the single portfolio media folder for images, videos, and project downloads. Files here are public, tracked in Git, and deployed. Use real files, never shortcuts to folders outside the repository.
- Project working media: private CAD, controller logs, and unfinished source captures stay with their project. Copy only selected publishable exports into `public/media`.
- Notebook's `career/portfolio/project-media/`: local shortcuts to project originals and `website-ready` copies, not another media store.

Preserve simulation labels and image aspect ratios. Do not publish controller logs, credentials, or whole working-media folders. Local-only originals need a separate backup; Git covers published assets, not ignored files.

## Hexapod test figures

`art-motion-loads.png` and `art-motion-thermal-voltage.png` are unchanged exports from the shared testing folder's `shadow-dialogue-amplitude-sweep-2026-08-24/analysis/amplitude-100/`. The run records 15 motors over 16.52 seconds. Aggregate Iq is summed absolute motor q-axis current, not battery-pack current; mechanical power is an estimate from motor telemetry. Raw logs remain in the project testing archive.
