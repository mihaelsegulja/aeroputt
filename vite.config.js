import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

function compactHtml(html) {
  return html
    .replace(/>\s+</g, '><')
    .replace(/\s*\/>/g, '>');
}

function trimHtml(html) {
  html = html
    .replace(/\s+crossorigin(?=[\s>])/g, '')
    .replace(/\/\*\$vite\$:1\*\//g, '');

  const blocks = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;
  let out = '';
  let last = 0;
  let match;

  while ((match = blocks.exec(html))) {
    out += compactHtml(html.slice(last, match.index)).trim() + match[0];
    last = match.index + match[0].length;
  }

  return out + compactHtml(html.slice(last)).trim();
}

function trimHtmlPlugin() {
  return {
    name: 'trim-html',
    apply: 'build',
    enforce: 'post',
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        for (const asset of Object.values(bundle)) {
          if (asset.type !== 'asset' || !asset.fileName.endsWith('.html')) continue;
          const html = typeof asset.source === 'string'
            ? asset.source
            : Buffer.from(asset.source).toString();
          asset.source = trimHtml(html);
        }
      },
    },
  };
}

export default defineConfig({
  plugins: [
    viteSingleFile({
      outputFileName: 'index.html',
      removeViteModuleLoader: true,
    }),
    trimHtmlPlugin(),
  ],
  build: {
    target: 'esnext',
    modulePreload: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        passes: 5,
        drop_console: true,
        drop_debugger: true,
      },
      mangle: {
        toplevel: true,
      },
      format: {
        comments: false,
      },
    },
  },
});