# TruthScroll MVP - AI Rules

## App Purpose
TruthScroll is a Bible study and original-language search app. The goal is to help users search Scripture, understand English translation choices, and see the Hebrew or Greek words behind Bible passages.

## Tech Stack
- Use Next.js with the existing App Router structure.
- Use React components for all UI.
- Use TypeScript for safer code.
- Use Tailwind CSS for styling if it already exists in the project.
- Use local JSON or TypeScript data files for MVP Bible/search data before adding a database.
- Use Supabase only when we are ready for saved users, notes, search history, or large structured Bible data.
- Keep components small and readable.
- Keep pages simple and working before adding advanced features.
- Do not add unnecessary packages.
- Do not change the framework or folder structure unless asked.

## Coding Rules
- Make one small change at a time.
- Do not rebuild the entire app unless explicitly asked.
- Do not remove existing pages, components, or data without explaining why.
- Fix broken imports before adding new features.
- Prefer simple working MVP code over complex architecture.
- Use clear file names and clear component names.
- Add comments only where they help explain important logic.
- Keep the app beginner-friendly so the owner can understand and maintain it.

## Feature Rules
- Search should eventually support English words, Bible references, Greek words, Hebrew words, literal meanings, and alternate translations.
- Study results must avoid generic filler.
- Explore should include relevant Old Testament and New Testament references where possible.
- Family mode should change based on selected age and should not return the same generic answer for every age.
- Original-language notes should clearly distinguish Greek, Hebrew, literal meaning, alternate translation, and interpretation.

## Safety Rules
- Do not invent Bible data as final truth.
- Placeholder data is allowed only if clearly labeled as placeholder.
- Do not claim Greek or Hebrew accuracy unless the data is actually provided.
- Do not connect Supabase or change environment variables unless asked.
- Do not push to GitHub unless the user confirms the app still works.