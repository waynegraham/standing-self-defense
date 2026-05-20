import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import test from 'node:test';

test('site build output exists', async () => {
  await access('_site/index.html', constants.R_OK);
  await access('_site/site.css', constants.R_OK);
});
