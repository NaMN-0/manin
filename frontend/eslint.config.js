import globals from "globals";
import pluginJs from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import reactConfig from "eslint-plugin-react/configs/recommended.js";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import reactRefresh from "eslint-plugin-react-refresh"; // Import react-refresh

export default [
  {
    // Ignore patterns for the new flat config
    ignores: ["dist/", "node_modules/", "lint_output.txt"],
  },
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"], // Include .ts, .tsx for future-proofing
    settings: {
        react: {
            version: "detect" // Automatically detect the React version
        }
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 2020,
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        process: true, // Add process global for environment variables
        // Add other common globals explicitly if not fully covered by globals.browser
        console: true,
        setTimeout: true,
        setInterval: true,
        clearInterval: true,
        clearTimeout: true,
        fetch: true,
        localStorage: true,
        // window, document, navigator are usually covered by globals.browser but explicit can help
        window: true,
        document: true,
        navigator: true,
        // For special __REACT_DEVTOOLS_GLOBAL_HOOK__ if still appearing
        __REACT_DEVTOOLS_GLOBAL_HOOK__: true,
      },
    },
    plugins: {
      react: reactPlugin,
      prettier: prettierPlugin, // Ensure prettier plugin is registered
      "react-refresh": reactRefresh, // Register react-refresh plugin
    },
    rules: {
      ...reactConfig.rules, // Directly spread the recommended rules
      "react/react-in-jsx-scope": "off", // Not needed for React 17+ with new JSX transform
      "react/jsx-uses-react": "off", // Not needed for React 17+ with new JSX transform
      "prettier/prettier": "error", // Ensure prettier rule is active
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }], // React Refresh rule

      // Re-enable and configure core rules
      "no-undef": "error", // Re-enable no-undef
      "react/jsx-no-undef": "error", // Re-enable jsx-no-undef
      "no-empty": "warn", // Treat empty blocks as warnings
      "no-cond-assign": "warn", // Treat conditional assignment as warning
      "no-fallthrough": "warn", // Treat fallthrough in switch as warning
      "no-unused-vars": "warn", // Treat unused vars as warning for now
      "react/prop-types": "off", // Keep prop-types off for now as it's a massive cleanup task
      "react/no-unescaped-entities": "off", // Disable to prevent parsing issues with special characters in JSX
    },
  },
  pluginJs.configs.recommended,
  prettierConfig, // Integrates Prettier's rules
  // No need for a separate plugin entry for prettier if already in the main config
];