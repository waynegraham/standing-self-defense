const fs = require('node:fs');
const path = require('node:path');
const htmlmin = require('html-minifier-terser');
// const { type } = require("os");
const { DateTime } = require('luxon');
const markdownIt = require('markdown-it');
const markdownItAttrs = require('markdown-it-attrs');

const { eleventyImageTransformPlugin } = require('@11ty/eleventy-img');
const eleventyNavigationPlugin = require('@11ty/eleventy-navigation');
const emojiReadTime = require('@11tyrocks/eleventy-plugin-emoji-readtime'); // https://github.com/5t3ph/eleventy-plugin-emoji-readtime

// const { format } = require("path");
const CleanCSS = require('clean-css');

// 11ty plugins
const eleventyPluginHubspot = require('eleventy-plugin-hubspot');

const { IdAttributePlugin, HtmlBasePlugin } = require('@11ty/eleventy');
// const { getDeploymentPathPrefix } = require('./_config/deployment-path-prefix.cjs');

module.exports = function (eleventyConfig) {
  eleventyConfig.setTemplateFormats(['njk', 'js', 'md', 'html']);

  const markdownLibrary = markdownIt({
    html: true,
    linkify: true,
    typographer: true,
  }).use(markdownItAttrs);

  eleventyConfig.setLibrary('md', markdownLibrary);

  eleventyConfig.addBundle('css');
  eleventyConfig.addBundle('js');

  if (process.env.ELEVENTY_PRODUCTION) {
    eleventyConfig.addTransform('htmlmin', htmlminTransform);
  }

  // Preprocessors
  eleventyConfig.addPreprocessor('drafts', '*', (data, _content) => {
    if (data.draft && process.env.ELEVENTY_RUN_MODE === 'build') {
      return false;
    }
  });

  // Passthrough
  eleventyConfig.addPassthroughCopy({ 'src/static': './static/' });
  eleventyConfig.addPassthroughCopy({ 'src/assets/': './assets/' });

  // Watch targets
  eleventyConfig.addWatchTarget('./src/styles/');

  // Plugins
  eleventyConfig.addPlugin(emojiReadTime, {
    emoji: '📖',
  });

  // Collections
  eleventyConfig.addCollection('sponsorsByLevel', function () {
    const sponsorsPath = path.join(__dirname, 'src/_data/sponsors.json');
    let sponsors = [];

    try {
      sponsors = JSON.parse(fs.readFileSync(sponsorsPath, 'utf8'));
    } catch {
      sponsors = [];
    }

    if (!Array.isArray(sponsors)) {
      sponsors = [];
    }

    const levels = ['Platinum', 'Gold', 'Silver', 'Bronze'];

    const result = levels.map((level) => ({
      level,
      sponsors: sponsors.filter((s) => s.level === level),
    }));

    // console.log("Sponsors by level:", result); // helpful debug
    return result;
  });

  // shortcodes
  eleventyConfig.addPairedShortcode(
    'sparkleCard',
    function (content, colorClass = 'text-yellow-400') {
      return `
      <div class="border rounded-xl p-5 relative overflow-hidden">
        <div class="absolute top-3 right-3 pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" 
              class="w-6 h-6 ${colorClass} animate-sparkle">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
          </svg>
        </div>
        ${content}
      </div>
    `;
    }
  );

  // Filters
  eleventyConfig.addFilter('usd', function (value) {
    if (typeof value !== 'number') {
      return 'Invalid Input';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  });

  eleventyConfig.addFilter('stringify', (data) => {
    return JSON.stringify(data, null, '\t'); // Using tab for indentation
  });

  // @see https://www.11ty.dev/docs/quicktips/inline-css/
  eleventyConfig.addFilter('cssmin', function (code) {
    return new CleanCSS({}).minify(code).styles;
  });

  // https://11ty.rocks/eleventyjs/data-arrays/#randomitem-filter
  eleventyConfig.addFilter('randomItem', (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) {
      return [];
    }

    arr.sort(() => {
      return 0.5 - Math.random();
    });
    return arr.slice(0, 1);
  });

  eleventyConfig.addFilter('firstWords', (text, count) => {
    if (!text) return '';
    const plainText = text.replace(/(<([^>]+)>)/gi, '');
    return (
      plainText.split(' ').slice(0, count).join(' ') +
      (plainText.split(' ').length > count ? '...' : '')
    );
  });

  // Get the first `n` elements of a collection.
  eleventyConfig.addFilter('head', (array, n) => {
    if (!Array.isArray(array) || array.length === 0) {
      return [];
    }
    if (n < 0) {
      return array.slice(n);
    }

    return array.slice(0, n);
  });

  eleventyConfig.addFilter('readableDate', (dateObj, format, zone) => {
    // Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
    return DateTime.fromJSDate(dateObj, { zone: zone || 'utc' }).toFormat(format || 'dd LLL yyyy');
  });

  eleventyConfig.addFilter('htmlDateString', (dateObj) => {
    // dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('yyyy-LL-dd');
  });

  eleventyConfig.addFilter('date', (value, format = 'yyyy-MM-dd') => {
    if (!value) return '';
    return DateTime.fromISO(value).toFormat(format);
  });

  eleventyConfig.addShortcode('year', () => `${new Date().getFullYear()}`);

  eleventyConfig.addFilter('groupbyIterable', function (arr, key) {
    const grouped = arr.reduce((acc, item) => {
      const groupKey = item[key];
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(item);
      return acc;
    }, {});
    return Object.entries(grouped).map(([k, v]) => ({ grouper: k, items: v }));
  });

  // Plugins
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ['avif', 'webp', 'jpeg'],
    // output image widths
    widths: ['auto'],

    // optional, attributes assigned on <img> nodes override these values
    htmlOptions: {
      imgAttributes: {
        loading: 'lazy',
        decoding: 'async',
      },
      pictureAttributes: {},
    },
  });

  //https://www.11ty.dev/docs/plugins/navigation/
  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  eleventyConfig.addPlugin(HtmlBasePlugin);

  eleventyConfig.addPlugin(eleventyPluginHubspot, {
    portalId: 20251227,
    loadingMode: 'lazy',
  });

  // https://www.11ty.dev/docs/plugins/id-attribute/
  eleventyConfig.addPlugin(IdAttributePlugin, {
    selector: 'h1,h2,h3,h4,h5,h6', // default

    // swaps html entities (like &amp;) to their counterparts before slugify-ing
    decodeEntities: true,

    // check for duplicate `id` attributes in application code?
    checkDuplicates: 'error', // `false` to disable

    // by default we use Eleventy’s built-in `slugify` filter:
    slugify: eleventyConfig.getFilter('slugify'),

    filter: function ({ page }) {
      if (page.inputPath.endsWith('test-skipped.html')) {
        return false; // skip
      }

      return true;
    },
  });

  return {
    dir: {
      input: 'src',
      layouts: '_layouts',
      includes: '_includes',
    },
    pathPrefix: 'standing-self-defense',
  };
};

function htmlminTransform(content, outputPath) {
  if (outputPath.endsWith('.html')) {
    let minified = htmlmin.minify(content, {
      useShortDoctype: true,
      removeComments: true,
      collapseWhitespace: true,
    });
    return minified;
  }
  return content;
}
