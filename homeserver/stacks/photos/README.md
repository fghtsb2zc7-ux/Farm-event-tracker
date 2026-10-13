# photos

Immich, the photo library: https://photos.taild086ea.ts.net (private to your devices). See docs/PHOTOS-AND-MEDIA.md.

- Photos and videos: `~/ServerData/photos/library` (backed up nightly, except thumbnails and converted videos,
  which Immich makes again).
- Database: in a Docker volume. Immich copies it to `library/backups` every night, and the nightly backup
  copies it to `~/ServerData/dumps/immich.sql.gz` first.
- Updated by hand only: read the release notes at https://github.com/immich-app/immich/releases first.
