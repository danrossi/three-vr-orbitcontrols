import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'unplugin-dts/vite';

export default defineConfig(({ mode }) => {
  return {
    root: '.',
    envDir: resolve(import.meta.dirname),
    plugins: [
      dts({
        outDirs: './build',

        //entryRoot: './src',
        declarationOnly: true,
        //bundleTypes: true,
        // tsconfigPath: './tsconfig.json',
      }),
    ],
    resolve: {
      //alias: aliases,
    },
    define: {
      // Statically replaces process.env.NODE_ENV with the current string mode
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    build: {
      //minify: "terser",
      minify: false,
      outDir: 'build',
      sourcemap: false,
      //license: true,
      emptyOutDir: false,
      lib: {
        entry: ['./three-vr-orbitcontrols.js'],
        fileName: (format, entryName) => {
          return `three-vr-orbitcontrols.module.js`;
        },
        formats: ['es'],
      },
      rolldownOptions: {
        external: ['three'],

        output: {
          format: 'es',
          // Inlines dynamic imports to prevent separate chunk files
          codeSplitting: false,
          comments: false,
        },
      },
    },
  };
});
