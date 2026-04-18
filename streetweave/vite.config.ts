/* eslint-disable no-undef */

import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'streetweave',
    },
    copyPublicDir: false,
    emptyOutDir: false,
    sourcemap: true
  },
});


// import { defineConfig } from 'vite';
// import dts from 'vite-plugin-dts';
// export default defineConfig({
//   build: {
//     lib: {
//       entry: 'src/index.ts',
//       name: 'streetweave',
//       fileName: (format) => streetweave.${format}.js
//     },
//     rollupOptions: {
//       // if you depend on react, react-dom, etc, mark them external:
//       external: ['react', 'react-dom'],
//       output: {
//         globals: {
//           react: 'React',
//           'react-dom': 'ReactDOM'
//         }
//       }
//     }
//   },
//   plugins: [dts()]
// });