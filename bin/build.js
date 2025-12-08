import * as esbuild from 'esbuild';
import { readdirSync } from 'fs';
import { join, sep } from 'path';

// Config output
const BUILD_DIRECTORY = 'dist';
const PRODUCTION = process.env.NODE_ENV === 'production';

// Config entrypoint files
const ENTRY_POINTS = ['src/index.js', 'src/listing.js', 'src/payment.js', 'src/reservation_confirmation.js', 'src/trips.js', 'src/trip_details.js', 'src/trip_change.js', 'src/trip_cancel.js', 'src/trip_payments.js', 'src/trip_cancelled.js', 'src/help.js', 'src/account.js', 'src/messaging.js', 'src/create_stripe_account_host.js', 'src/terms_policy_pages.js', 'src/reset_password.js', 'src/add-home.js', 'src/host-home.js', 'src/edit-home.js', 'src/host-dashboard.js', 'src/payments-payouts.js', 'src/host-listings.js', 'src/taxes.js', 'src/calendar.js', 'src/host-reservations.js', 'src/profile-info.js', 'src/index-search.js', 'src/calendar-2.js', 'src/manage-booking-extras.js', 'src/concierge-services.js', 'src/boat-host-home.js'];

//const ENTRY_POINTS = ['src/index.js', 'src/listing.js', 'src/payment.js', 'src/reservation_confirmation.js', 'src/trips.js', 'src/trip_details.js', 'src/trip_change.js', 'src/trip_cancel.js', 'src/trip_payments.js', 'src/trip_cancelled.js', 'src/help.js', 'src/account.js', 'src/messaging.js', 'src/create_stripe_account_host.js', 'src/terms_policy_pages.js', 'src/reset_password.js'];

// Config dev serving
const LIVE_RELOAD = !PRODUCTION;
const SERVE_PORT = 8080;
const SERVE_ORIGIN = `http://localhost:${SERVE_PORT}`;
//const SERVE_ORIGIN = `http://localhost:${SERVE_PORT}`;

// Create context
const context = await esbuild.context({
  bundle: true,
  entryPoints: ENTRY_POINTS,
  outdir: BUILD_DIRECTORY,
  minify: PRODUCTION,
  sourcemap: !PRODUCTION,
  target: PRODUCTION ? 'es2020' : 'esnext',
  inject: LIVE_RELOAD ? ['./bin/live-reload.js'] : undefined,
  define: {
    SERVE_ORIGIN: JSON.stringify(SERVE_ORIGIN),
    STRIPE_KEY: JSON.stringify(
      PRODUCTION ? '123456' : 'pk_test_51OsWQaBjoQQxZuTR7kxKM3PQ891E9I2EbUPpWANip2KMtR9VBvfgBLFTtpXH3XfDO1iFFBAuQ3EdjG6G2WyN4Sjf006Suh9NY6'
    ),
  },
});

// Build files in prod
if (PRODUCTION) {
  await context.rebuild();
  context.dispose();
}

// Watch and serve files in dev
else {
  await context.watch();
  await context
    .serve({
      servedir: BUILD_DIRECTORY,
      port: SERVE_PORT,
    })
    .then(logServedFiles);
}

/**
 * Logs information about the files that are being served during local development.
 */
function logServedFiles() {
  /**
   * Recursively gets all files in a directory.
   * @param {string} dirPath
   * @returns {string[]} An array of file paths.
   */
  const getFiles = (dirPath) => {
    const files = readdirSync(dirPath, { withFileTypes: true }).map((dirent) => {
      const path = join(dirPath, dirent.name);
      return dirent.isDirectory() ? getFiles(path) : path;
    });

    return files.flat();
  };

  const files = getFiles(BUILD_DIRECTORY);

  const filesInfo = files
    .map((file) => {
      if (file.endsWith('.map')) return;

      // Normalize path and create file location
      const paths = file.split(sep);
      paths[0] = SERVE_ORIGIN;

      const location = paths.join('/');

      // Create import suggestion
      const tag = location.endsWith('.css')
        ? `<link href="${location}" rel="stylesheet" type="text/css"/>`
        : `<script defer src="${location}"></script>`;

      return {
        'File Location': location,
        'Import Suggestion': tag,
      };
    })
    .filter(Boolean);

  // eslint-disable-next-line no-console
  console.table(filesInfo);
}
